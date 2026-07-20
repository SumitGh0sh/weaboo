import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { fetchWeeklySchedule } from "../services/api";

export const SchedulePage = () => {
  const { lang, toggleWatchlist, isInWatchlist } = useApp();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  // Set default tab to current day
  const [activeDay, setActiveDay] = useState(() => {
    const currentDayIndex = new Date().getDay();
    return days[currentDayIndex];
  });

  const [scheduleList, setScheduleList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load weekly schedules from API
  useEffect(() => {
    let active = true;
    const loadSchedule = async () => {
      try {
        setIsLoading(true);
        const data = await fetchWeeklySchedule(activeDay);
        if (active) {
          setScheduleList(data);
        }
      } catch (err) {
        console.error("Error loading weekly schedules", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadSchedule();
    return () => { active = false; };
  }, [activeDay]);

  return (
    <main className="page page-wide">
      <div className="page-head" style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text)", marginBottom: "6px" }}>Estimated Schedule</h1>
        <p className="muted" style={{ fontSize: "13px" }}>Weekly release timetable of airing anime episodes in your local timezone.</p>
      </div>

      {/* Weekday Tab Switcher */}
      <div
        style={{
          display: "flex",
          border: "1px solid var(--border)",
          background: "var(--bg2)",
          borderRadius: "var(--radius)",
          padding: "6px",
          gap: "4px",
          marginBottom: "24px",
          overflowX: "auto"
        }}
      >
        {days.map((day) => {
          const isActive = day === activeDay;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(day)}
              style={{
                flexGrow: 1,
                padding: "10px 14px",
                border: "none",
                borderRadius: "6px",
                background: isActive ? "var(--accent)" : "transparent",
                color: isActive ? "hsl(220 25% 5%)" : "var(--muted)",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Roster Area */}
      <div className="schedule-results" style={{ minHeight: "300px", position: "relative" }}>
        {isLoading ? (
          <div style={{ padding: "80px 40px", display: "grid", placeItems: "center" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid var(--border)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}
            ></div>
          </div>
        ) : scheduleList.length > 0 ? (
          <div className="ani items">
            {scheduleList.map((anime) => (
              <div key={anime.id} className="item">
                <div className="ani poster">
                  <div className="poster-actions">
                    <Link to={`/anime/${anime.id}`} className="card-act card-act--info" style={{ display: "grid", placeItems: "center" }}>
                      <i className="fa-solid fa-circle-info"></i>
                    </Link>
                    <button
                      type="button"
                      className="card-act card-act--list"
                      onClick={() => toggleWatchlist(anime.id)}
                    >
                      <i className={`fa-solid ${isInWatchlist(anime.id) ? "fa-check" : "fa-plus"}`} style={{ color: isInWatchlist(anime.id) ? "var(--accent)" : "inherit" }}></i>
                    </button>
                  </div>
                  <Link to={`/anime/${anime.id}`}>
                    <img src={anime.poster} alt={lang === "en" ? anime.titleEn : anime.titleJp} />
                    <div className="meta">
                      <div className="inner">
                        <div className="left">
                          <span className="ep-status total"><span>{anime.totalEps} eps</span></span>
                        </div>
                        <div className="right">{anime.type}</div>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="info">
                  <Link className="name d-title" to={`/anime/${anime.id}`}>
                    {lang === "en" ? anime.titleEn : anime.titleJp}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
            No anime airing on this day.
          </div>
        )}
      </div>
    </main>
  );
};
export default SchedulePage;
