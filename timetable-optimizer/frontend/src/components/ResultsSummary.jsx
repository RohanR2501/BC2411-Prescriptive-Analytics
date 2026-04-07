import React from "react";
import "./ResultsSummary.css";

export default function ResultsSummary({
  total_au,
  total_interest,
  days_on_campus,
  objective_value,
}) {
  const safeDays = Array.isArray(days_on_campus) ? days_on_campus : [];

  return (
    <div className="summary-grid">
      <div className="summary-card">
        <h3>Total AUs</h3>
        <p>{total_au ?? 0}</p>
      </div>

      <div className="summary-card">
        <h3>Total Interest</h3>
        <p>{total_interest ?? 0}</p>
      </div>

      <div className="summary-card">
        <h3>Objective</h3>
        <p>{typeof objective_value === "number" ? objective_value.toFixed(3) : "0.000"}</p>
      </div>

      <div className="summary-card">
        <h3>Days on Campus</h3>
        <p>{safeDays.length}</p>
        <div className="badge-container">
          {safeDays.map((day) => (
            <span key={day} className="day-badge">
              {day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}