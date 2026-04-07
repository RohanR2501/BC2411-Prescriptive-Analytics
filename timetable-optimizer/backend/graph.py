# backend/graph.py

def compute_distance_matrix():
    edges = [
        ("SS", "S2", 2), ("SS", "S3", 2), ("SS", "GAIA", 4),
        ("SS", "S1", 2), ("SS", "S4", 4),
        ("SS", "NYA", 2), ("S3", "HIVE", 2), ("HIVE", "SOH", 2),
        ("GAIA", "SOH", 3), ("NYA", "SBS", 4), ("SBS", "RTP", 4),
        ("SBS", "LKC M", 2), ("NYA", "NS", 3), ("NS", "N1", 3),
        ("NS", "N4", 3), ("NS", "N2", 3),
        ("NS", "N3", 3), ("N1", "NS", 2), ("N3", "ABN", 1),
        ("N4", "ABN", 1), ("NS", "ART", 5), ("NS", "NIE", 3),
        ("NS", "ARC", 4), ("NIE", "ARC", 5)
    ]

    nodes = set()
    for u, v, w in edges:
        nodes.add(u)
        nodes.add(v)

    dist = {u: {v: float('inf') for v in nodes} for u in nodes}
    nxt = {u: {v: None for v in nodes} for u in nodes}

    for u in nodes:
        dist[u][u] = 0
        nxt[u][u] = u

    for u, v, w in edges:
        dist[u][v] = w
        dist[v][u] = w
        nxt[u][v] = v
        nxt[v][u] = u

    for k in nodes:
        for i in nodes:
            for j in nodes:
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
                    nxt[i][j] = nxt[i][k]

    flat_dist_matrix = {}
    for i in nodes:
        for j in nodes:
            if dist[i][j] != float('inf'):
                flat_dist_matrix[(i, j)] = dist[i][j]

    return flat_dist_matrix, nxt

CAMPUS_DISTANCE_MATRIX, NEXT_NODE_MATRIX = compute_distance_matrix()

def get_path(u, v):
    if NEXT_NODE_MATRIX[u][v] is None:
        return []
    path = [u]
    curr = u
    while curr != v:
        curr = NEXT_NODE_MATRIX[curr][v]
        path.append(curr)
    return path