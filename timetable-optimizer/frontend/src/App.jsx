import React, { useState } from "react";
import CourseInput from "./components/CourseInput";
import ResultsSummary from "./components/ResultsSummary";
import TimetableGrid from "./components/TimetableGrid";
import WalkingRoute from "./components/WalkingRoute";
import "./App.css";

export default function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setResults(null);
  };

  return (
    <div className="app-container">
      <h1>Timetable Optimizer</h1>
      {loading && (
        <p className="loading-banner">
          <span className="spinner" aria-hidden="true" />
          Optimizing your timetable... please wait.
        </p>
      )}

      <CourseInput onResults={setResults} onLoading={setLoading} loading={loading} />

      {results && (
        <>
          <button className="reset-btn" onClick={handleReset}>
            Reset
          </button>

          <ResultsSummary
            total_au={results.total_au}
            total_interest={results.total_interest}
            days_on_campus={results.days_on_campus}
            objective_value={results.objective_value}
          />

          <TimetableGrid selected_courses={results.selected_courses} />

          <WalkingRoute
            walking_routes={results.walking_routes}
            days_on_campus={results.days_on_campus}
          />
        </>
      )}
    </div>
  );
}