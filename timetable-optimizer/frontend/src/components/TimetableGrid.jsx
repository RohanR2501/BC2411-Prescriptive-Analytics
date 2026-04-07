import React from "react";
import "./TimetableGrid.css";

const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const startHour = 8;
const endHour = 22;
const palette = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#0ea5e9", "#6366f1", "#a855f7", "#ec4899", "#84cc16",
];

function parseSession(sessionStr) {
  // Example:
  // "[LEC] MON 0830-0930 @ LT2 (Node: SS)"

  const parts = sessionStr.split(" ");
  const day = parts[1];
  const time = parts[2];
  const venue = parts.slice(4).join(" ");
  const nodeMatch = venue.match(/\(Node:\s*([^)]+)\)/i);
  const node = nodeMatch ? nodeMatch[1].trim() : "";
  const venueName = venue.replace(/\s*\(Node:[^)]+\)\s*/i, "").trim();
  const compactVenue = node ? `Node ${node}` : venueName;

  const [start, end] = time.split("-");
  return { day, start, end, venue, venueName, node, compactVenue, raw: sessionStr };
}

export default function TimetableGrid({ selected_courses }) {
  const courses = selected_courses ?? [];
  const hourLines = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const halfHourLines = Array.from({ length: (endHour - startHour) * 2 + 1 }, (_, i) => i);
  const totalMinutes = (endHour - startHour) * 60;
  const [zoomMode, setZoomMode] = React.useState("auto");
  const colorByCourse = {};
  courses.forEach((course, idx) => {
    colorByCourse[course.course_id] = palette[idx % palette.length];
  });

  const eventsByDay = {};
  days.forEach((d) => {
    eventsByDay[d] = [];
  });

  courses.forEach((course, courseIdx) => {
    course.sessions.forEach((session, sessionIdx) => {
      const parsed = parseSession(session);
      if (!days.includes(parsed.day)) return;

      const startMins = Number.parseInt(parsed.start.slice(0, 2), 10) * 60 + Number.parseInt(parsed.start.slice(2), 10);
      const endMins = Number.parseInt(parsed.end.slice(0, 2), 10) * 60 + Number.parseInt(parsed.end.slice(2), 10);
      const clampedStart = Math.max(startMins, startHour * 60);
      const clampedEnd = Math.min(endMins, endHour * 60);
      if (clampedEnd <= clampedStart) return;

      const durationMins = clampedEnd - clampedStart;

      eventsByDay[parsed.day].push({
        id: `${course.course_id}-${courseIdx}-${sessionIdx}`,
        courseId: course.course_id,
        venue: parsed.venue,
        compactVenue: parsed.compactVenue,
        start: parsed.start,
        end: parsed.end,
        startMins: clampedStart,
        endMins: clampedEnd,
        durationMins,
        topPx: 0,
        heightPx: 0,
      });
    });
  });

  const allEvents = days.flatMap((day) => eventsByDay[day]);
  const shortestClassMins = allEvents.length
    ? Math.min(...allEvents.map((e) => e.durationMins))
    : 60;
  const basePixelsPerMinute = zoomMode === "compact" ? 0.95 : 1.4;
  const readablePixelsPerMinute = Math.max(basePixelsPerMinute, 88 / shortestClassMins);
  const pixelsPerMinute = zoomMode === "auto" ? Math.min(2.2, readablePixelsPerMinute) : basePixelsPerMinute;
  const timelineHeightPx = Math.round(totalMinutes * pixelsPerMinute);

  // Recompute vertical geometry with final scale.
  days.forEach((day) => {
    eventsByDay[day] = eventsByDay[day].map((event) => ({
      ...event,
      topPx: (event.startMins - startHour * 60) * pixelsPerMinute,
      heightPx: event.durationMins * pixelsPerMinute,
    }));
  });

  // Assign lanes so overlapping classes render side-by-side instead of stacked.
  days.forEach((day) => {
    const sorted = [...eventsByDay[day]].sort((a, b) => a.startMins - b.startMins || a.endMins - b.endMins);
    const laneEndTimes = [];
    const withLanes = sorted.map((event) => {
      let lane = laneEndTimes.findIndex((endTime) => endTime <= event.startMins);
      if (lane === -1) {
        lane = laneEndTimes.length;
        laneEndTimes.push(event.endMins);
      } else {
        laneEndTimes[lane] = event.endMins;
      }
      return { ...event, lane };
    });
    const laneCount = Math.max(1, laneEndTimes.length);
    eventsByDay[day] = withLanes.map((event) => ({ ...event, laneCount }));
  });

  return (
    <div className="timetable-wrap">
      <h2>Timetable</h2>
      <div className="zoom-controls">
        <button
          type="button"
          className={`zoom-btn ${zoomMode === "compact" ? "active" : ""}`}
          onClick={() => setZoomMode("compact")}
        >
          Compact
        </button>
        <button
          type="button"
          className={`zoom-btn ${zoomMode === "auto" ? "active" : ""}`}
          onClick={() => setZoomMode("auto")}
        >
          Auto Readable
        </button>
      </div>
      <div className="timetable-board">
        <div className="time-column">
          <div className="day-header empty-header" />
          <div className={`time-grid axis-grid ${zoomMode}`} style={{ height: `${timelineHeightPx}px` }}>
            {halfHourLines.map((s) => {
              const absoluteMins = (startHour * 60) + (s * 30);
              const minuteOffset = s * 30;
              const hh = Math.floor(absoluteMins / 60);
              const mm = absoluteMins % 60;
              const isHour = mm === 0;
              const isTop = s === 0;
              const isBottom = s === halfHourLines.length - 1;
              return (
                <div
                  key={`label-${s}`}
                  className={`time-label ${isHour ? "major" : "minor"} ${isTop ? "top-label" : ""} ${isBottom ? "bottom-label" : ""}`}
                  style={{ top: `${minuteOffset * pixelsPerMinute}px` }}
                >
                  {`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`}
                </div>
              );
            })}
            {hourLines.map((h) => (
              <div key={`time-col-${h}`} className="hour-line" style={{ top: `${(h - startHour) * 60 * pixelsPerMinute}px` }} />
            ))}
            {halfHourLines.map((s) => (
              <div
                key={`time-col-half-${s}`}
                className="half-hour-line"
                style={{ top: `${s * 30 * pixelsPerMinute}px` }}
              />
            ))}
          </div>
        </div>

        {days.map((day) => (
          <div key={day} className="day-column">
            <div className="day-header">{day}</div>
            <div className={`time-grid ${zoomMode}`} style={{ height: `${timelineHeightPx}px` }}>
              {hourLines.map((h) => (
                <div key={`${day}-${h}`} className="hour-line" style={{ top: `${(h - startHour) * 60 * pixelsPerMinute}px` }} />
              ))}
              {halfHourLines.map((s) => (
                <div
                  key={`${day}-half-${s}`}
                  className="half-hour-line"
                  style={{ top: `${s * 30 * pixelsPerMinute}px` }}
                />
              ))}
              {eventsByDay[day].map((event) => (
                <div
                  key={event.id}
                  className={`event-block ${zoomMode !== "auto" && event.durationMins <= 60 ? "short" : ""} ${zoomMode !== "auto" && event.durationMins <= 45 ? "tiny" : ""}`}
                  style={{
                    top: `${event.topPx}px`,
                    height: `${event.heightPx}px`,
                    left: `calc(${(event.lane / event.laneCount) * 100}% + 6px)`,
                    width: `calc(${100 / event.laneCount}% - 10px)`,
                    background: `linear-gradient(135deg, ${colorByCourse[event.courseId]} 0%, #1f2937 180%)`,
                  }}
                  title={`${event.courseId} ${event.start}-${event.end} @ ${event.venue}`}
                >
                  <div className="event-title">{event.courseId}</div>
                  <div className="event-time">{event.start}-{event.end}</div>
                  <div className="event-venue">{zoomMode === "auto" ? event.venue : (event.durationMins <= 60 ? event.compactVenue : event.venue)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}