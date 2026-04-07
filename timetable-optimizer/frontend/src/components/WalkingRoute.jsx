import React from "react";
import "./WalkingRoute.css";

export default function WalkingRoute({ walking_routes, days_on_campus = [] }) {
  if (!walking_routes || walking_routes.length === 0) {
    return <p className="walking-empty">No walking needed 🎉</p>;
  }

  // Group by day
  const grouped = {};
  walking_routes.forEach(route => {
    if (!grouped[route.day]) grouped[route.day] = [];
    grouped[route.day].push(route);
  });

  const daysToRender = days_on_campus.length > 0 ? days_on_campus : Object.keys(grouped);

  return (
    <div className="walking-wrap">
      <h2>Walking Routes</h2>

      {daysToRender.map((day) => (
        <div key={day} className="day-route-group">
          <h3>{day}</h3>

          {(grouped[day] ?? []).length === 0 && (
            <p className="no-walk-day">No inter-class walking needed on this day.</p>
          )}

          {(grouped[day] ?? []).map((route, i) => (
            <div key={`${day}-${route.from_node}-${route.to_node}-${route.distance}-${i}`} className="route-card">
              <div className="path-line">
                {Array.isArray(route.path_list) ? route.path_list.join(" -> ") : `${route.from_node} -> ${route.to_node}`}
              </div>

              <div className="route-meta">
                <span><strong>From:</strong> {route.from_node}</span>
                <span><strong>To:</strong> {route.to_node}</span>
                <span><strong>Time:</strong> {route.distance} mins</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}