import { useState } from "react";
import { API_BASE_URL } from "../config";

const DEFAULT_WEIGHTS = { alpha: 0.25, beta: 0.25, gamma: 0.25, delta: 0.25 };
const REQUESTED_SOLUTIONS = 5;

export default function CourseInput({ onResults, onLoading = () => {}, loading = false }) {
  const [courses, setCourses] = useState([{ id: "", interest: 5 }]);
  const [minAu, setMinAu] = useState(15);
  const [maxAu, setMaxAu] = useState(21);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [error, setError] = useState(null);

  function addCourse() {
    setCourses([...courses, { id: "", interest: 5 }]);
  }

  function removeCourse(index) {
    setCourses(courses.filter((_, i) => i !== index));
  }

  function updateCourse(index, field, value) {
    const updated = [...courses];
    updated[index][field] = value;
    setCourses(updated);
  }

  function updateWeight(key, rawValue) {
    const value = parseFloat(rawValue);
    const others = Object.keys(weights).filter((k) => k !== key);
    const remaining = Math.max(0, 1 - value);
    const otherSum = others.reduce((s, k) => s + weights[k], 0);

    const newWeights = { ...weights, [key]: value };
    others.forEach((k) => {
      newWeights[k] =
        otherSum > 0
          ? parseFloat(((weights[k] / otherSum) * remaining).toFixed(3))
          : parseFloat((remaining / others.length).toFixed(3));
    });

    setWeights(newWeights);
  }

  async function handleSubmit() {
    if (loading) return;
    setError(null);

    const emptyIds = courses.some((c) => c.id.trim() === "");
    if (emptyIds) {
      setError("Please fill in all course IDs before submitting.");
      return;
    }

    const interest_dict = {};
    courses.forEach((c) => {
      interest_dict[c.id.trim().toUpperCase()] = c.interest;
    });

    onLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interest_dict,
          min_au: minAu,
          max_au: maxAu,
          weights,
          num_solutions: REQUESTED_SOLUTIONS,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Something went wrong.");
      } else {
        const normalized = data?.solutions?.length
          ? data
          : {
              ...data,
              solutions: data ? [data] : [],
              solution_count: data ? 1 : 0,
            };
        onResults(normalized);
      }
    } catch {
      setError("Could not reach the backend service. Please try again.");
    } finally {
      onLoading(false);
    }
  }

  const weightLabels = {
    alpha: "Interest Score",
    beta: "Total AUs",
    gamma: "Minimize Days on Campus",
    delta: "Minimize Walking",
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Course Preferences</h2>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Courses</h3>
        {courses.map((course, i) => (
          <div key={i} style={styles.courseRow}>
            <input
              style={styles.input}
              placeholder="Course ID e.g. BC3402"
              value={course.id}
              onChange={(e) => updateCourse(i, "id", e.target.value)}
            />
            <span style={styles.label}>Interest: {course.interest}</span>
            <input
              type="range"
              min={1}
              max={10}
              value={course.interest}
              onChange={(e) => updateCourse(i, "interest", parseInt(e.target.value))}
              style={styles.slider}
            />
            <button style={styles.removeBtn} onClick={() => removeCourse(i)}>
              ✕
            </button>
          </div>
        ))}
        <button style={styles.addBtn} onClick={addCourse}>+ Add Course</button>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Academic Units</h3>
        <div style={styles.auRow}>
          <label style={styles.label}>Min AUs</label>
          <input
            type="number"
            style={styles.numInput}
            value={minAu}
            min={0}
            max={maxAu}
            onChange={(e) => setMinAu(parseInt(e.target.value))}
          />
          <label style={styles.label}>Max AUs</label>
          <input
            type="number"
            style={styles.numInput}
            value={maxAu}
            min={minAu}
            max={30}
            onChange={(e) => setMaxAu(parseInt(e.target.value))}
          />
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Optimization Weights (must sum to 1.0)</h3>
        {Object.keys(weights).map((key) => (
          <div key={key} style={styles.weightRow}>
            <span style={styles.weightLabel}>{weightLabels[key]}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={weights[key]}
              onChange={(e) => updateWeight(key, e.target.value)}
              style={styles.slider}
            />
            <span style={styles.weightVal}>{weights[key].toFixed(2)}</span>
          </div>
        ))}
        <p style={styles.sumText}>
          Total: {Object.values(weights).reduce((a, b) => a + b, 0).toFixed(2)}
        </p>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <button
        style={{
          ...styles.submitBtn,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Optimizing timetable..." : "Optimize My Timetable ->"}
      </button>
    </div>
  );
}

const styles = {
  card: { background: "#1e1e2e", borderRadius: 16, padding: 32, maxWidth: 680, margin: "0 auto", color: "#cdd6f4", fontFamily: "sans-serif" },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 24, color: "#cba6f7" },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: "#a6e3a1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  courseRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  input: { background: "#313244", border: "none", borderRadius: 8, padding: "8px 12px", color: "#cdd6f4", fontSize: 14, width: 160 },
  label: { fontSize: 13, color: "#a6adc8", whiteSpace: "nowrap" },
  slider: { flex: 1, accentColor: "#cba6f7" },
  removeBtn: { background: "#f38ba8", border: "none", borderRadius: 6, color: "#1e1e2e", fontWeight: 700, cursor: "pointer", padding: "4px 10px" },
  addBtn: { background: "#313244", border: "none", borderRadius: 8, color: "#cba6f7", padding: "8px 16px", cursor: "pointer", fontSize: 14 },
  auRow: { display: "flex", alignItems: "center", gap: 16 },
  numInput: { background: "#313244", border: "none", borderRadius: 8, padding: "8px 12px", color: "#cdd6f4", fontSize: 14, width: 70 },
  weightRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 },
  weightLabel: { fontSize: 13, color: "#a6adc8", width: 200 },
  weightVal: { fontSize: 13, color: "#cba6f7", width: 36, textAlign: "right" },
  sumText: { fontSize: 12, color: "#6c7086", marginTop: 8 },
  error: { background: "#f38ba820", border: "1px solid #f38ba8", borderRadius: 8, padding: 12, color: "#f38ba8", fontSize: 13, marginBottom: 16 },
  submitBtn: { width: "100%", background: "#cba6f7", border: "none", borderRadius: 10, padding: "14px 0", color: "#1e1e2e", fontWeight: 700, fontSize: 16, cursor: "pointer" },
};