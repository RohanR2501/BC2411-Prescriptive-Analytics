import pandas as pd
from graph import CAMPUS_DISTANCE_MATRIX, get_path

try:
    import gurobipy as gp
    from gurobipy import GRB
    GUROBI_IMPORT_ERROR = None
except ModuleNotFoundError as e:
    gp = None
    GRB = None
    GUROBI_IMPORT_ERROR = e

# =============================================================================
# 1. Core Model Functions
# =============================================================================
def create_decision_variables(model, courses, valid_indexes, days):
    x = model.addVars(courses, vtype=GRB.BINARY, name="SelectCourse")
    y = model.addVars(valid_indexes, vtype=GRB.BINARY, name="SelectIndex")
    z = model.addVars(days, vtype=GRB.BINARY, name="AttendDay")
    return x, y, z

def add_index_selection_constraints(model, x, y, course_indexes):
    for c, groups in course_indexes.items():
        model.addConstr(gp.quicksum(y[(c, g)] for g in groups) == x[c], name=f"req_index_{c}")

def add_time_clash_constraints(model, y, index_slots):
    slot_usage = {}
    for cg, slots in index_slots.items():
        for k in slots:
            slot_usage.setdefault(k, []).append(y[cg])
    for k, vars_in_slot in slot_usage.items():
        if len(vars_in_slot) > 1:
            model.addConstr(gp.quicksum(vars_in_slot) <= 1, name=f"clash_slot_{k}")

def add_academic_unit_constraints(model, x, au_dict, min_au, max_au):
    total_aus = gp.quicksum(au_dict.get(c, 0) * x[c] for c in x.keys())
    model.addConstr(total_aus <= max_au, name="Max_AUs")
    model.addConstr(total_aus >= min_au, name="Min_AUs")

def add_campus_days_constraints(model, y, z, index_days):
    for cg, days in index_days.items():
        for d in days:
            model.addConstr(z[d] >= y[cg], name=f"link_day_{cg[0]}_{cg[1]}_{d}")

def add_walking_time_constraints(model, y, index_locations, time_slots, locations):
    X = model.addVars(time_slots, locations, vtype=GRB.BINARY, name="LocOccupied")
    for t in time_slots:
        for l in locations:
            occupying_groups = [y[(c, g)] for (c, g), slots_locs in index_locations.items() if (t, l) in slots_locs]
            if occupying_groups:
                model.addConstr(X[t, l] == gp.quicksum(occupying_groups), name=f"link_X_{t}_{l}")
            else:
                model.addConstr(X[t, l] == 0, name=f"link_X_{t}_{l}")

    W = {}
    for day_idx in range(6):
        day_slots = [t for t in time_slots if (t - 1) // 16 == day_idx]
        for i in range(len(day_slots)):
            for j in range(i + 1, len(day_slots)):
                t1 = day_slots[i]
                t2 = day_slots[j]
                middle_slots = day_slots[i+1:j]
                classes_in_between = gp.quicksum(X[k, l] for k in middle_slots for l in locations)
                for l1 in locations:
                    for l2 in locations:
                        if l1 == l2:
                            continue
                        w_var = model.addVar(vtype=GRB.CONTINUOUS, lb=0, ub=1, name=f"W_{t1}_{t2}_{l1}_{l2}")
                        W[(t1, t2, l1, l2)] = w_var
                        model.addConstr(
                            w_var >= X[t1, l1] + X[t2, l2] - 1 - classes_in_between,
                            name=f"trans_{t1}_{t2}_{l1}_{l2}"
                        )
    return X, W

# =============================================================================
# 2. Main Optimization Function — returns JSON-serializable dict
# =============================================================================
def optimize_schedule(csv_filepath, interest_dict, weights, max_au, min_au=0):
    """
    Returns a dict with keys:
        selected_courses, total_au, total_interest,
        days_on_campus, walking_routes, objective_value
    Raises:
        RuntimeError  — if Gurobi license is missing
        ValueError    — if no courses found or infeasible
    """

    if GUROBI_IMPORT_ERROR is not None:
        raise RuntimeError(
            "Gurobi is not installed. Install backend dependencies and set up a valid "
            "Gurobi license before running optimization."
        ) from GUROBI_IMPORT_ERROR

    # --- Data Loading ---
    df = pd.read_csv(csv_filepath)
    df = df[df['course_id'].isin(interest_dict.keys())].copy()
    if df.empty:
        raise ValueError("None of the specified courses were found in the dataset.")

    df = df.dropna(subset=['day', 'start_time', 'end_time', 'venue', 'location'])

    day_map = {'MON': 0, 'TUE': 1, 'WED': 2, 'THU': 3, 'FRI': 4, 'SAT': 5}
    days_list = list(day_map.keys())
    time_slots_list = list(range(1, 97))

    def time_to_mins(t):
        t_int = int(float(t))
        return (t_int // 100) * 60 + (t_int % 100)

    def get_slots(day_str, start_t, end_t):
        if day_str not in day_map:
            return []
        day_idx = day_map[day_str]
        cls_start, cls_end = time_to_mins(start_t), time_to_mins(end_t)
        slots_occupied = []
        for i in range(16):
            slot_start = 480 if i == 0 else 510 + (i - 1) * 60
            slot_end = slot_start + 60
            if max(cls_start, slot_start) < min(cls_end, slot_end):
                slots_occupied.append((day_idx * 16) + i + 1)
        return slots_occupied

    course_indexes = {}
    index_slots = {}
    index_days = {}
    index_locations = {}
    index_info = {}
    au_dict = df.groupby('course_id')['AU'].first().fillna(3).to_dict()
    locations_set = set()

    for _, row in df.iterrows():
        c = row['course_id']
        g = str(row['class_group'])
        day_str = row['day']
        loc = str(row['location']).strip()
        raw_venue = str(row['venue'])
        locations_set.add(loc)

        slots = get_slots(day_str, row['start_time'], row['end_time'])
        if not slots:
            continue

        course_indexes.setdefault(c, set()).add(g)
        index_slots.setdefault((c, g), set()).update(slots)
        index_days.setdefault((c, g), set()).add(day_str)

        for k in slots:
            index_locations.setdefault((c, g), []).append((k, loc))

        start_fmt = f"{int(float(row['start_time'])):04d}"
        end_fmt = f"{int(float(row['end_time'])):04d}"
        session_str = f"[{row.get('class_type', 'CLS')}] {day_str} {start_fmt}-{end_fmt} @ {raw_venue} (Node: {loc})"
        index_info.setdefault((c, g), []).append(session_str)

    valid_indexes = list(index_slots.keys())
    locations = list(locations_set)

    # --- Build Model ---
    try:
        model = gp.Model("Course_Optimization")
    except gp.GurobiError as e:
        raise RuntimeError(
            "Gurobi license not found. Place your gurobi.lic file in your home directory. "
            "Obtain a free academic license at https://portal.gurobi.com"
        ) from e

    model.setParam('OutputFlag', 0)

    x, y, z = create_decision_variables(model, list(course_indexes.keys()), valid_indexes, days_list)
    add_index_selection_constraints(model, x, y, course_indexes)
    add_time_clash_constraints(model, y, index_slots)
    add_academic_unit_constraints(model, x, au_dict, min_au, max_au)
    add_campus_days_constraints(model, y, z, index_days)
    X, W = add_walking_time_constraints(model, y, index_locations, time_slots_list, locations)

    # --- Objective ---
    total_int = gp.quicksum(interest_dict.get(c, 0) * x[c] for c in x.keys())
    total_au  = gp.quicksum(au_dict.get(c, 0) * x[c] for c in x.keys())
    tot_days  = gp.quicksum(z[d] for d in days_list)

    walk_expr = []
    for (t1, t2, l1, l2), w_var in W.items():
        dist = CAMPUS_DISTANCE_MATRIX.get((l1, l2), 999)
        walk_expr.append(dist * w_var)
    total_walk = gp.quicksum(walk_expr)

    SCALE_INT  = len(interest_dict) * 10
    SCALE_AU   = 21.0
    SCALE_DAYS = 6.0
    SCALE_WALK = 120.0

    model.setObjective(
        (weights['alpha'] * (total_int / SCALE_INT)) +
        (weights['beta']  * (total_au  / SCALE_AU)) -
        (weights['gamma'] * (tot_days  / SCALE_DAYS)) -
        (weights['delta'] * (total_walk / SCALE_WALK)),
        GRB.MAXIMIZE
    )

    model.optimize()

    # --- Infeasible check ---
    if model.Status != GRB.OPTIMAL:
        raise ValueError(
            "No feasible schedule could be found. "
            "Check AU limits, course availability, or time clash constraints."
        )

    # =================================================================
    # Build return dictionary
    # =================================================================

    # selected_courses
    selected_courses = []
    for c in x.keys():
        if x[c].X > 0.5:
            selected_index = None
            sessions = []
            for cg in valid_indexes:
                if cg[0] == c and y[cg].X > 0.5:
                    selected_index = cg[1]
                    sessions = list(dict.fromkeys(index_info[cg]))  # deduplicated
                    break
            selected_courses.append({
                "course_id":      c,
                "au":             int(au_dict.get(c, 0)),
                "interest":       int(interest_dict.get(c, 0)),
                "selected_index": selected_index,
                "sessions":       sessions          # list of raw session strings
            })

    # days_on_campus
    days_on_campus = [d for d in days_list if z[d].X > 0.5]

    # walking_routes
    # Build route transitions directly from selected class locations,
    # so all day transitions are reflected in the API response.
    walking_routes = []
    occupied_slots = {}
    for cg in valid_indexes:
        if y[cg].X <= 0.5:
            continue
        for slot, loc in index_locations.get(cg, []):
            occupied_slots[slot] = loc

    for day_idx, day_name in enumerate(days_list):
        day_slots = sorted([s for s in occupied_slots.keys() if (s - 1) // 16 == day_idx])
        if not day_slots:
            continue

        prev_loc = occupied_slots[day_slots[0]]
        prev_slot = day_slots[0]

        for slot in day_slots[1:]:
            curr_loc = occupied_slots[slot]
            # New class segment starts when there is a gap in occupied slots.
            if slot != prev_slot + 1:
                if curr_loc != prev_loc:
                    dist = CAMPUS_DISTANCE_MATRIX.get((prev_loc, curr_loc), 999)
                    walking_routes.append({
                        "day": day_name,
                        "from_node": prev_loc,
                        "to_node": curr_loc,
                        "distance": dist,
                        "path_list": get_path(prev_loc, curr_loc)
                    })
            # Continuous occupancy but venue changed; count as immediate transition.
            elif curr_loc != prev_loc:
                dist = CAMPUS_DISTANCE_MATRIX.get((prev_loc, curr_loc), 999)
                walking_routes.append({
                    "day": day_name,
                    "from_node": prev_loc,
                    "to_node": curr_loc,
                    "distance": dist,
                    "path_list": get_path(prev_loc, curr_loc)
                })

            prev_loc = curr_loc
            prev_slot = slot

    return {
        "selected_courses": selected_courses,
        "total_au":         int(total_au.getValue()),
        "total_interest":   int(total_int.getValue()),
        "days_on_campus":   days_on_campus,
        "walking_routes":   walking_routes,
        "objective_value":  round(model.ObjVal, 4)
    }