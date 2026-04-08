import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "./config";
import CourseInput from "./components/CourseInput";
import ResultsSummary from "./components/ResultsSummary";
import TimetableGrid from "./components/TimetableGrid";
import WalkingRoute from "./components/WalkingRoute";
import "./App.css";

export default function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSolutionIndex, setSelectedSolutionIndex] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE_URL}/ping`, { method: "GET", mode: "cors" }).catch(() => {});
  }, []);

  const handleResults = (data) => {
    setResults(data);
    setSelectedSolutionIndex(0);
  };

  const handleReset = () => {
    setResults(null);
    setSelectedSolutionIndex(0);
  };

  const solutions = Array.isArray(results?.solutions)
    ? results.solutions
    : (results ? [results] : []);

  const safeSolutionIndex = Math.min(
    Math.max(selectedSolutionIndex, 0),
    Math.max(solutions.length - 1, 0)
  );
  const activeSolution = solutions[safeSolutionIndex] ?? null;

  return (
    <div className="app-container">
      <h1>Timetable Optimizer</h1>
      {loading && (
        <p className="loading-banner">
          <span className="spinner" aria-hidden="true" />
          Optimizing your timetable... please wait.
        </p>
      )}

      <CourseInput onResults={handleResults} onLoading={setLoading} loading={loading} />

      {results && activeSolution && (
        <>
          <button className="reset-btn" onClick={handleReset}>
            Reset
          </button>

          <div className="solution-switcher">
            <button
              className="solution-btn"
              onClick={() => setSelectedSolutionIndex((idx) => Math.max(0, idx - 1))}
              disabled={safeSolutionIndex === 0 || solutions.length <= 1}
            >
              Previous Solution
            </button>
            <span className="solution-label">
              Solution {safeSolutionIndex + 1} of {Math.max(solutions.length, 1)}
            </span>
            <button
              className="solution-btn"
              onClick={() =>
                setSelectedSolutionIndex((idx) => Math.min(solutions.length - 1, idx + 1))
              }
              disabled={safeSolutionIndex === solutions.length - 1 || solutions.length <= 1}
            >
              Next Solution
            </button>
            {solutions.length <= 1 && (
              <span className="solution-hint">Only one solution returned by the current backend run.</span>
            )}
          </div>

          <ResultsSummary
            total_au={activeSolution.total_au}
            total_interest={activeSolution.total_interest}
            days_on_campus={activeSolution.days_on_campus}
            objective_value={activeSolution.objective_value}
          />

          <TimetableGrid selected_courses={activeSolution.selected_courses} />

          <WalkingRoute
            walking_routes={activeSolution.walking_routes}
            days_on_campus={activeSolution.days_on_campus}
          />
        </>
      )}
    </div>
  );
}