import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { animeCatalog } from "../data/animeData";
import gsap from "gsap";

export const MalProfileModal = () => {
  const {
    malUser,
    malWatching,
    showMalProfileModal,
    setShowMalProfileModal,
    unlinkMalUser,
    syncMalWatchlist
  } = useApp();

  const [syncStatus, setSyncStatus] = useState("");
  const [activeTab, setActiveTab] = useState("footprint"); // "footprint", "distribution", "scores", "formats"
  const chartContainerRef = useRef(null);

  useEffect(() => {
    if (!showMalProfileModal || !malUser || !chartContainerRef.current) return;

    // GSAP chart entrance animations depending on active tab
    if (activeTab === "footprint") {
      gsap.fromTo(
        chartContainerRef.current.querySelectorAll(".radar-grid"),
        { opacity: 0, scale: 0.8, transformOrigin: "120px 120px" },
        { opacity: 1, scale: 1, duration: 0.6, stagger: 0.08, ease: "power2.out" }
      );
      gsap.fromTo(
        chartContainerRef.current.querySelector(".radar-path"),
        { opacity: 0, scale: 0, transformOrigin: "120px 120px" },
        { opacity: 1, scale: 1, duration: 0.85, delay: 0.25, ease: "back.out(1.2)" }
      );
      gsap.fromTo(
        chartContainerRef.current.querySelectorAll(".radar-point"),
        { opacity: 0, scale: 0 },
        { opacity: 1, scale: 1, duration: 0.4, delay: 0.7, stagger: 0.06, ease: "back.out(1.5)" }
      );
    } else if (activeTab === "distribution") {
      gsap.fromTo(
        chartContainerRef.current.querySelectorAll(".chart-bar"),
        { scaleY: 0, transformOrigin: "bottom" },
        { scaleY: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" }
      );
      gsap.fromTo(
        chartContainerRef.current.querySelectorAll(".bar-value"),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, delay: 0.6, stagger: 0.06 }
      );
    } else if (activeTab === "scores") {
      gsap.fromTo(
        chartContainerRef.current.querySelectorAll(".score-bar-fill"),
        { scaleX: 0, transformOrigin: "left" },
        { scaleX: 1, duration: 0.7, stagger: 0.04, ease: "power2.out" }
      );
    } else if (activeTab === "formats") {
      gsap.fromTo(
        chartContainerRef.current.querySelectorAll(".doughnut-segment"),
        { strokeDashoffset: 377 }, // circumference
        {
          strokeDashoffset: (i, el) => el.getAttribute("data-target-offset"),
          duration: 1,
          stagger: 0.1,
          ease: "power2.out"
        }
      );
      gsap.fromTo(
        chartContainerRef.current.querySelector(".doughnut-center"),
        { scale: 0.5, opacity: 0, transformOrigin: "75px 75px" },
        { scale: 1, opacity: 1, duration: 0.6, delay: 0.4, ease: "back.out(1.2)" }
      );
    }
  }, [showMalProfileModal, activeTab, malUser]);

  if (!showMalProfileModal || !malUser) return null;

  const handleUnlink = () => {
    if (window.confirm(`Are you sure you want to unlink ${malUser.username}'s MAL profile?`)) {
      unlinkMalUser();
      setShowMalProfileModal(false);
    }
  };

  const handleSync = () => {
    const syncedCount = syncMalWatchlist();
    if (syncedCount > 0) {
      setSyncStatus(`Successfully imported ${syncedCount} anime into your watchlist!`);
    } else {
      setSyncStatus("Your watchlist is already up to date with your MAL watching list.");
    }
    setTimeout(() => setSyncStatus(""), 4000);
  };

  // Find local database links for MAL watching items
  const getLocalLink = (malTitle) => {
    const title = malTitle.toLowerCase();
    const match = animeCatalog.find(
      (local) =>
        local.titleEn?.toLowerCase().includes(title) ||
        title.includes(local.titleEn?.toLowerCase()) ||
        local.titleJp?.toLowerCase().includes(title) ||
        title.includes(local.titleJp?.toLowerCase())
    );
    return match ? `/anime/${match.id}` : null;
  };

  // ==================== CHART CALCULATIONS ====================

  // 1. RADAR / SPIDER CHART CONFIG
  const center = 120;
  const maxRadius = 80;
  const radarAxes = [
    { label: "Completed", value: malUser.completedCount || 0, max: 200 },
    { label: "Watching", value: malUser.watchingCount || 0, max: 20 },
    { label: "Plan to", value: malUser.planToWatchCount || 0, max: 120 },
    { label: "Days", value: Math.round(malUser.daysWatched || 0), max: 100 },
    { label: "Rating", value: malUser.meanScore || 0, max: 10 }
  ];

  const getRadarPoints = () => {
    return radarAxes.map((axis, i) => {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const ratio = Math.min(1, Math.max(0.05, axis.value / axis.max));
      const radius = ratio * maxRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return { x, y, label: axis.label, val: axis.value };
    });
  };

  const points = getRadarPoints();
  const radarPath = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Background Concentric Pentagons
  const gridLevels = [0.25, 0.5, 0.75, 1];

  // 2. STATUS DISTRIBUTION BAR CHART CONFIG
  const barData = [
    { label: "Watching", count: malUser.watchingCount || 0, color: "#38bdf8" },
    { label: "Completed", count: malUser.completedCount || 0, color: "#22c55e" },
    { label: "On Hold", count: malUser.onHoldCount || 0, color: "#f59e0b" },
    { label: "Dropped", count: malUser.droppedCount || 0, color: "#ef4444" },
    { label: "Plan to Watch", count: malUser.planToWatchCount || 0, color: "#8b5cf6" }
  ];
  const maxBarVal = Math.max(...barData.map((b) => b.count)) || 1;

  // 3. SCORE DISTRIBUTION GRAPH DATA
  const scoresData = malUser.scores || [
    { score: 10, count: 32, percentage: 22.8 },
    { score: 9, count: 54, percentage: 38.5 },
    { score: 8, count: 36, percentage: 25.7 },
    { score: 7, count: 12, percentage: 8.5 },
    { score: 6, count: 4, percentage: 2.8 },
    { score: 5, count: 1, percentage: 0.7 },
    { score: 4, count: 1, percentage: 0.7 },
    { score: 3, count: 0, percentage: 0 },
    { score: 2, count: 0, percentage: 0 },
    { score: 1, count: 0, percentage: 0 }
  ];
  const maxScoreCount = Math.max(...scoresData.map((s) => s.count)) || 1;
  const totalVotes = scoresData.reduce((acc, s) => acc + s.count, 0) || 1;

  // 4. DOUGHNUT CHART CONFIG
  const getFormatCounts = () => {
    const counts = { TV: 0, Movie: 0, OVA: 0, ONA: 0, Special: 0 };
    let active = false;
    malWatching.forEach((item) => {
      const type = item.anime?.type || "TV";
      active = true;
      if (type.includes("Movie")) counts.Movie++;
      else if (type.includes("OVA")) counts.OVA++;
      else if (type.includes("ONA")) counts.ONA++;
      else if (type.includes("Special")) counts.Special++;
      else counts.TV++;
    });

    // Default fallbacks if no items are currently loaded
    if (!active) {
      counts.TV = 6;
      counts.Movie = 2;
      counts.ONA = 3;
      counts.OVA = 1;
    }
    return counts;
  };

  const formatCounts = getFormatCounts();
  const doughnutSegments = [
    { label: "TV", count: formatCounts.TV, color: "#38bdf8" },
    { label: "Movie", count: formatCounts.Movie, color: "#22c55e" },
    { label: "ONA", count: formatCounts.ONA, color: "#8b5cf6" },
    { label: "OVA/Sp", count: formatCounts.OVA + formatCounts.Special, color: "#f59e0b" }
  ].filter(s => s.count > 0);

  const totalDoughnutCount = doughnutSegments.reduce((sum, s) => sum + s.count, 0);

  // Accumulate stroke offset maths
  let accumulatedOffset = 0;

  return (
    <div style={styles.overlay} onClick={() => setShowMalProfileModal(false)}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button style={styles.closeBtn} onClick={() => setShowMalProfileModal(false)} aria-label="Close modal">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Double Column Layout Grid */}
        <div style={styles.dashboardGrid} className="dashboard-grid">
          
          {/* LEFT COLUMN: Profile info & list syncing */}
          <div style={styles.leftCol} className="dashboard-left-col">
            
            {/* User profile Header */}
            <div style={styles.header}>
              <div style={styles.avatarContainer}>
                <img src={malUser.avatar} alt={malUser.username} style={styles.avatar} />
                <div style={styles.badge}>MAL</div>
              </div>
              <div style={styles.headerInfo}>
                <a href={malUser.url} target="_blank" rel="noopener noreferrer" style={styles.usernameLink}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "750", color: "#f8fafc" }}>
                    {malUser.username} <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "11px", marginLeft: "4px", color: "#64748b" }}></i>
                  </h3>
                </a>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={styles.statusBadge}>
                    <i className="fa-solid fa-circle-check" style={{ marginRight: "4px" }}></i> Connected
                  </span>
                  {malUser.source && (
                    <span style={styles.sourceBadge}>{malUser.source}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Mock Data Warning Alert */}
            {malUser.isMocked && (
              <div style={styles.mockWarning}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: "6px", color: "#f59e0b" }}></i>
                <span>Showing cached/fallback profile stats.</span>
              </div>
            )}

            {/* Numeric quick stats list with sleek FontAwesome icons */}
            <div style={styles.sidebarStats}>
              <div style={styles.sidebarStatRow}>
                <span>
                  <i className="fa-solid fa-tv" style={{ color: "#38bdf8", width: "16px", marginRight: "8px" }}></i> Episodes Watched
                </span>
                <strong>{malUser.episodesWatched ? malUser.episodesWatched.toLocaleString() : 0}</strong>
              </div>
              <div style={styles.sidebarStatRow}>
                <span>
                  <i className="fa-solid fa-clock" style={{ color: "#a855f7", width: "16px", marginRight: "8px" }}></i> Time Spent
                </span>
                <strong>{Math.round(malUser.daysWatched || 0)}d ({Math.round((malUser.daysWatched || 0) * 24)}h)</strong>
              </div>
              <div style={styles.sidebarStatRow}>
                <span>
                  <i className="fa-solid fa-star" style={{ color: "#f59e0b", width: "16px", marginRight: "8px" }}></i> Mean Rating
                </span>
                <strong style={{ color: "#f59e0b" }}>{malUser.meanScore || "N/A"} ★</strong>
              </div>
              <div style={styles.sidebarStatRow}>
                <span>
                  <i className="fa-solid fa-layer-group" style={{ color: "#22c55e", width: "16px", marginRight: "8px" }}></i> Total Entries
                </span>
                <strong>{malUser.totalEntries || (malUser.completedCount + malUser.watchingCount + malUser.planToWatchCount) || 0}</strong>
              </div>
              <div style={styles.sidebarStatRow}>
                <span>
                  <i className="fa-solid fa-rotate-right" style={{ color: "#ec4899", width: "16px", marginRight: "8px" }}></i> Rewatched Anime
                </span>
                <strong>{malUser.rewatchedCount || 0}</strong>
              </div>
            </div>

            {/* Currently Watching Shelf */}
            <div style={{ marginTop: "24px" }}>
              <h4 style={styles.sectionTitle}>
                <i className="fa-solid fa-circle-play" style={{ color: "#38bdf8", marginRight: "6px" }}></i>
                Currently Watching ({malWatching.length})
              </h4>
              {malWatching.length === 0 ? (
                <p style={styles.emptyText}>No active watchlist entries cataloged on your profile.</p>
              ) : (
                <div style={styles.scrollShelf}>
                  {malWatching.map((item, idx) => {
                    const animeTitle = item.anime?.title || "Unknown Title";
                    const localLink = getLocalLink(animeTitle);
                    const epProgress = item.progress !== undefined ? item.progress : (item.episodes_watched || 0);
                    const epTotal = item.anime?.episodes || item.episodes_total || "?";
                    
                    return (
                      <div key={item.anime?.mal_id || idx} style={styles.shelfCard}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                          <img
                            src={item.anime?.images?.jpg?.image_url}
                            alt=""
                            style={{ width: "42px", height: "56px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }}
                          />
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {animeTitle}
                            </span>
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                              Watched {epProgress} / {epTotal} eps
                            </span>
                          </div>
                        </div>

                        <div style={{ flexShrink: 0 }}>
                          {localLink ? (
                            <Link to={localLink} onClick={() => setShowMalProfileModal(false)} style={styles.localWatchBtn}>
                              <i className="fa-solid fa-play" style={{ fontSize: "8px", marginRight: "3px" }}></i> Watch
                            </Link>
                          ) : (
                            <a href={item.anime?.url || `https://myanimelist.net/anime/${item.anime?.mal_id}`} target="_blank" rel="noopener noreferrer" style={styles.malDetailsLink}>
                              Link <i className="fa-solid fa-up-right-from-square" style={{ fontSize: "8px" }}></i>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sync Status Alert */}
            {syncStatus && (
              <div style={styles.syncAlert}>
                <i className="fa-solid fa-circle-info" style={{ marginRight: "6px" }}></i>
                <span>{syncStatus}</span>
              </div>
            )}

            {/* Controls Footer */}
            <div style={styles.footer}>
              <button style={styles.syncBtn} onClick={handleSync}>
                <i className="fa-solid fa-rotate" style={{ marginRight: "8px" }}></i> Sync Watchlist
              </button>
              <button style={styles.unlinkBtn} onClick={handleUnlink}>
                <i className="fa-solid fa-link-slash" style={{ marginRight: "8px" }}></i> Unlink
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Premium MAL SVG Charts & Statistics */}
          <div style={styles.rightCol} ref={chartContainerRef}>
            
            {/* Chart Tab bar */}
            <div style={styles.tabBar}>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === "footprint" ? styles.tabBtnActive : {}) }}
                onClick={() => setActiveTab("footprint")}
              >
                <i className="fa-solid fa-bullseye" style={{ marginRight: "6px" }}></i> Footprint
              </button>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === "distribution" ? styles.tabBtnActive : {}) }}
                onClick={() => setActiveTab("distribution")}
              >
                <i className="fa-solid fa-chart-column" style={{ marginRight: "6px" }}></i> Status
              </button>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === "scores" ? styles.tabBtnActive : {}) }}
                onClick={() => setActiveTab("scores")}
              >
                <i className="fa-solid fa-star" style={{ marginRight: "6px" }}></i> Scores
              </button>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === "formats" ? styles.tabBtnActive : {}) }}
                onClick={() => setActiveTab("formats")}
              >
                <i className="fa-solid fa-film" style={{ marginRight: "6px" }}></i> Formats
              </button>
            </div>

            {/* Chart Screen viewport */}
            <div style={styles.chartViewport}>
              
              {/* TAB 1: RADAR / SPIDER CHART */}
              {activeTab === "footprint" && (
                <div style={styles.chartContainer}>
                  <div style={styles.chartHeading}>
                    <h5>Anime Overview Footprint</h5>
                    <p>Metrics normalized against MyAnimeList community standards.</p>
                  </div>
                  
                  <svg width="240" height="240" viewBox="0 0 240 240" style={styles.svgCanvas}>
                    <defs>
                      <radialGradient id="radarRadial" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(46, 81, 162, 0.15)" />
                        <stop offset="70%" stopColor="rgba(56, 189, 248, 0.25)" />
                        <stop offset="100%" stopColor="rgba(46, 81, 162, 0.45)" />
                      </radialGradient>
                      <linearGradient id="radarOutline" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="50%" stopColor="#2e51a2" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>

                    {/* Concentric grid lines */}
                    {gridLevels.map((lvl, idx) => {
                      const gridPoints = radarAxes.map((_, i) => {
                        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                        const r = lvl * maxRadius;
                        const x = center + r * Math.cos(angle);
                        const y = center + r * Math.sin(angle);
                        return `${x},${y}`;
                      }).join(" ");

                      return (
                        <polygon
                          key={idx}
                          points={gridPoints}
                          fill="none"
                          stroke={idx % 2 === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}
                          strokeWidth="1"
                          strokeDasharray={idx === 1 ? "3 2" : "none"}
                          className="radar-grid"
                        />
                      );
                    })}

                    {/* Radial axis lines */}
                    {points.map((p, i) => {
                      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                      const outerX = center + maxRadius * Math.cos(angle);
                      const outerY = center + maxRadius * Math.sin(angle);
                      return (
                        <line
                          key={i}
                          x1={center}
                          y1={center}
                          x2={outerX}
                          y2={outerY}
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Data Polygon path */}
                    <polygon
                      points={radarPath}
                      fill="url(#radarRadial)"
                      stroke="url(#radarOutline)"
                      strokeWidth="2.5"
                      className="radar-path"
                      style={{ filter: "drop-shadow(0 0 10px rgba(56, 189, 248, 0.4))" }}
                    />

                    {/* Data Points vertices */}
                    {points.map((p, i) => (
                      <g key={i} className="radar-point">
                        {/* Glow halo */}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="7"
                          fill="#38bdf8"
                          opacity="0.3"
                        />
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          fill="#ffffff"
                          stroke="#38bdf8"
                          strokeWidth="2"
                        />
                        {/* Values tooltips */}
                        <text
                          x={p.x}
                          y={p.y - 10}
                          fill="#f8fafc"
                          fontSize="9.5"
                          fontWeight="800"
                          textAnchor="middle"
                          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))" }}
                        >
                          {p.val}
                        </text>
                      </g>
                    ))}

                    {/* Axis Labels */}
                    {points.map((p, i) => {
                      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                      const textRadius = maxRadius + 20;
                      const x = center + textRadius * Math.cos(angle);
                      const y = center + textRadius * Math.sin(angle) + 3;
                      
                      return (
                        <text
                          key={i}
                          x={x}
                          y={y}
                          fill="#94a3b8"
                          fontSize="9.5"
                          fontWeight="700"
                          letterSpacing="0.3px"
                          textAnchor="middle"
                        >
                          {p.label}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              )}

              {/* TAB 2: STATUS DISTRIBUTION BAR GRAPH CHART */}
              {activeTab === "distribution" && (
                <div style={styles.chartContainer}>
                  <div style={styles.chartHeading}>
                    <h5>Anime Status Distribution</h5>
                    <p>Comparison of anime status counts in your MyAnimeList profile.</p>
                  </div>

                  <svg width="250" height="180" viewBox="0 0 250 180" style={styles.svgCanvas}>
                    <defs>
                      <linearGradient id="gradWatching" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                      <linearGradient id="gradCompleted" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#15803d" />
                      </linearGradient>
                      <linearGradient id="gradHold" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#b45309" />
                      </linearGradient>
                      <linearGradient id="gradDropped" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#ef4444" />
                        <stop offset="100%" stop-color="#b91c1c" />
                      </linearGradient>
                      <linearGradient id="gradPlan" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6d28d9" />
                      </linearGradient>
                    </defs>

                    {/* Background Grid Lines */}
                    <line x1="15" y1="30" x2="235" y2="30" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                    <line x1="15" y1="80" x2="235" y2="80" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="15" y1="130" x2="235" y2="130" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                    
                    {barData.map((bar, i) => {
                      const x = 20 + i * 44;
                      const maxBarHeight = 110;
                      const h = Math.max(8, (bar.count / maxBarVal) * maxBarHeight);
                      const y = 140 - h;

                      let gradId = "gradWatching";
                      if (bar.label === "Completed") gradId = "gradCompleted";
                      else if (bar.label === "On Hold") gradId = "gradHold";
                      else if (bar.label === "Dropped") gradId = "gradDropped";
                      else if (bar.label === "Plan to Watch") gradId = "gradPlan";

                      return (
                        <g key={i}>
                          {/* Backing Track */}
                          <rect
                            x={x}
                            y={30}
                            width="26"
                            height={maxBarHeight}
                            rx="5"
                            ry="5"
                            fill="rgba(255,255,255,0.03)"
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="0.5"
                          />

                          {/* Value above the bar */}
                          <text
                            x={x + 13}
                            y={y - 6}
                            fill="#f8fafc"
                            fontSize="9.5"
                            fontWeight="800"
                            textAnchor="middle"
                            className="bar-value"
                            style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
                          >
                            {bar.count}
                          </text>

                          {/* Bar rectangle */}
                          <rect
                            x={x}
                            y={y}
                            width="26"
                            height={h}
                            rx="5"
                            ry="5"
                            fill={`url(#${gradId})`}
                            className="chart-bar"
                            style={{ filter: `drop-shadow(0 0 6px ${bar.color}60)` }}
                          />

                          {/* Labels below the bar */}
                          <text
                            x={x + 13}
                            y="155"
                            fill="#94a3b8"
                            fontSize="8.5"
                            fontWeight="700"
                            textAnchor="middle"
                          >
                            {bar.label.split(" ")[0]}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}

              {/* TAB 3: SCORE / RATING DISTRIBUTION GRAPH */}
              {activeTab === "scores" && (
                <div style={styles.chartContainer}>
                  <div style={styles.chartHeading}>
                    <h5>Score Rating Distribution</h5>
                    <p>Histogram of scores given across rated anime entries on MyAnimeList.</p>
                  </div>

                  <div style={styles.scoresListContainer}>
                    {scoresData.map((item) => {
                      const percentage = item.percentage || ((item.count / totalVotes) * 100).toFixed(1);
                      const widthPercent = maxScoreCount > 0 ? (item.count / maxScoreCount) * 100 : 0;

                      return (
                        <div key={item.score} style={styles.scoreRow}>
                          <span style={styles.scoreLabel}>
                            {item.score} <i className="fa-solid fa-star" style={{ fontSize: "9px", color: "#f59e0b" }}></i>
                          </span>

                          <div style={styles.scoreTrack}>
                            <div
                              className="score-bar-fill"
                              style={{
                                ...styles.scoreFill,
                                width: `${widthPercent}%`,
                                background: item.score >= 8 ? "linear-gradient(90deg, #22c55e, #38bdf8)" : item.score >= 5 ? "linear-gradient(90deg, #f59e0b, #eab308)" : "linear-gradient(90deg, #ef4444, #f97316)"
                              }}
                            ></div>
                          </div>

                          <span style={styles.scoreValue}>
                            {item.count} <small style={{ color: "#64748b", fontWeight: "600" }}>({percentage}%)</small>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: DOUGHNUT FORMAT CHART */}
              {activeTab === "formats" && (
                <div style={styles.chartContainer}>
                  <div style={styles.chartHeading}>
                    <h5>Watch Formats Breakdown</h5>
                    <p>Format categories computed dynamically from active watchlist titles.</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "28px", width: "100%" }}>
                    
                    <svg width="150" height="150" viewBox="0 0 150 150" style={{ flexShrink: 0 }}>
                      <defs>
                        <linearGradient id="doughnutTV" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                        <linearGradient id="doughnutMovie" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="doughnutONA" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#6d28d9" />
                        </linearGradient>
                        <linearGradient id="doughnutOVA" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                      </defs>

                      {/* Inner & Outer Rings */}
                      <circle cx="75" cy="75" r="56" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" strokeDasharray="3 3" />
                      <circle cx="75" cy="75" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" strokeDasharray="3 3" />

                      <g className="doughnut-group">
                        
                        {/* Background ring */}
                        <circle
                          cx="75"
                          cy="75"
                          r="45"
                          fill="none"
                          stroke="rgba(255,255,255,0.04)"
                          strokeWidth="12"
                        />

                        {/* Doughnut segment circles */}
                        {doughnutSegments.map((seg, i) => {
                          const percent = seg.count / totalDoughnutCount;
                          const dash = percent * 282.74; // 2 * PI * r (r=45)
                          const offset = accumulatedOffset;
                          accumulatedOffset -= dash;

                          let gradId = "doughnutTV";
                          if (seg.label === "Movie") gradId = "doughnutMovie";
                          else if (seg.label === "ONA") gradId = "doughnutONA";
                          else if (seg.label === "OVA/Sp") gradId = "doughnutOVA";

                          return (
                            <circle
                              key={i}
                              cx="75"
                              cy="75"
                              r="45"
                              fill="none"
                              stroke={`url(#${gradId})`}
                              strokeWidth="12"
                              strokeDasharray={`${dash} 282.74`}
                              strokeDashoffset="282.74"
                              data-target-offset={offset}
                              className="doughnut-segment"
                              transform="rotate(-90 75 75)"
                              strokeLinecap="round"
                              style={{
                                filter: `drop-shadow(0 0 6px ${seg.color}60)`,
                                transition: "stroke-dashoffset 1s ease-out"
                              }}
                            />
                          );
                        })}
                      </g>

                      {/* Center label */}
                      <g className="doughnut-center" style={{ transformOrigin: "75px 75px" }}>
                        <text
                          x="75"
                          y="72"
                          fill="#f8fafc"
                          fontSize="16"
                          fontWeight="800"
                          textAnchor="middle"
                        >
                          {totalDoughnutCount}
                        </text>
                        <text
                          x="75"
                          y="85"
                          fill="#94a3b8"
                          fontSize="8"
                          fontWeight="700"
                          letterSpacing="0.5px"
                          textAnchor="middle"
                          textTransform="uppercase"
                        >
                          Shows
                        </text>
                      </g>
                    </svg>

                    {/* Chart Legend list */}
                    <div style={styles.legendList}>
                      {doughnutSegments.map((seg, idx) => (
                        <div key={idx} style={styles.legendRow}>
                          <span style={{ ...styles.legendDot, background: seg.color }}></span>
                          <span style={styles.legendLabel}>{seg.label}</span>
                          <span style={styles.legendVal}>{seg.count} ({Math.round((seg.count / totalDoughnutCount) * 100)}%)</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(6, 10, 20, 0.82)",
    backdropFilter: "blur(12px)",
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    overflowY: "auto",
    animation: "fadeIn 0.28s ease-out"
  },
  modal: {
    background: "linear-gradient(145deg, #0e172a 0%, #0a1122 100%)",
    border: "1px solid #1e293b",
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "940px",
    maxHeight: "90vh",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    position: "relative",
    padding: "32px 28px",
    boxSizing: "border-box",
    margin: "auto"
  },
  closeBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    color: "#94a3b8",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    zIndex: 10
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "310px 1fr",
    gap: "36px",
    alignItems: "start"
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #1e293b",
    paddingRight: "36px"
  },
  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "18px"
  },
  avatarContainer: {
    position: "relative",
    width: "52px",
    height: "52px",
    flexShrink: 0
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #2e51a2"
  },
  badge: {
    position: "absolute",
    bottom: "-2px",
    right: "-4px",
    background: "#2e51a2",
    color: "#ffffff",
    fontSize: "8.5px",
    fontWeight: "800",
    padding: "1px 5px",
    borderRadius: "3px",
    border: "1px solid #0f172a"
  },
  headerInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  usernameLink: {
    color: "#f8fafc",
    textDecoration: "none",
    outline: "none",
    margin: "0"
  },
  statusBadge: {
    alignSelf: "flex-start",
    fontSize: "9.5px",
    fontWeight: "700",
    color: "#22c55e",
    background: "rgba(34, 197, 94, 0.12)",
    padding: "2px 8px",
    borderRadius: "20px",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  sourceBadge: {
    alignSelf: "flex-start",
    fontSize: "9px",
    fontWeight: "700",
    color: "#38bdf8",
    background: "rgba(56, 189, 248, 0.12)",
    padding: "2px 8px",
    borderRadius: "20px",
    border: "1px solid rgba(56, 189, 248, 0.25)",
    letterSpacing: "0.4px"
  },
  mockWarning: {
    background: "rgba(245, 158, 11, 0.1)",
    border: "1px solid rgba(245, 158, 11, 0.25)",
    color: "#f59e0b",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "10.5px",
    lineHeight: "1.4",
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "18px"
  },
  sidebarStats: {
    display: "flex",
    flexDirection: "column",
    gap: "11px",
    background: "#131c2e",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    padding: "16px"
  },
  sidebarStatRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "500"
  },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: "750",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    margin: "0 0 12px 0",
    display: "flex",
    alignItems: "center"
  },
  emptyText: {
    fontSize: "11px",
    color: "#64748b",
    textAlign: "center",
    margin: "12px 0"
  },
  scrollShelf: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "220px",
    overflowY: "auto",
    paddingRight: "4px"
  },
  shelfCard: {
    width: "100%",
    background: "#131c2e",
    border: "1px solid #1e293b",
    borderRadius: "8px",
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    boxSizing: "border-box"
  },
  shelfPosterWrap: {
    position: "relative",
    width: "100%",
    height: "104px"
  },
  shelfPoster: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  shelfProgress: {
    position: "absolute",
    bottom: "2px",
    left: "2px",
    right: "2px",
    background: "rgba(0, 0, 0, 0.82)",
    color: "#f8fafc",
    fontSize: "8px",
    padding: "1px 3px",
    borderRadius: "3px",
    textAlign: "center",
    fontWeight: "700"
  },
  shelfInfo: {
    padding: "5px",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  shelfTitle: {
    fontSize: "9.5px",
    fontWeight: "650",
    color: "#f1f5f9",
    lineHeight: "1.2",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    height: "23px"
  },
  localWatchBtn: {
    background: "#2e51a2",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "8.5px",
    fontWeight: "750",
    padding: "4px 0",
    borderRadius: "4px",
    textAlign: "center",
    display: "block",
    transition: "background 0.2s"
  },
  malDetailsLink: {
    color: "#94a3b8",
    textDecoration: "none",
    fontSize: "8.5px",
    textAlign: "center",
    padding: "3px 0",
    border: "1px solid #1e293b",
    borderRadius: "4px",
    display: "block"
  },
  syncAlert: {
    background: "rgba(56, 189, 248, 0.12)",
    border: "1px solid rgba(56, 189, 248, 0.25)",
    color: "#38bdf8",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "11px",
    marginTop: "16px",
    display: "flex",
    alignItems: "center"
  },
  footer: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
    borderTop: "1px solid #1e293b",
    paddingTop: "20px"
  },
  syncBtn: {
    flexGrow: 1,
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#f8fafc",
    borderRadius: "8px",
    padding: "9px 12px",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s"
  },
  unlinkBtn: {
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    color: "#ef4444",
    borderRadius: "8px",
    padding: "9px 12px",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s"
  },
  tabBar: {
    display: "flex",
    background: "#0b1120",
    border: "1px solid #1e293b",
    borderRadius: "10px",
    padding: "4px",
    gap: "4px"
  },
  tabBtn: {
    flexGrow: 1,
    background: "none",
    border: "none",
    color: "#94a3b8",
    padding: "8px 12px",
    fontSize: "11.5px",
    fontWeight: "600",
    borderRadius: "7px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  tabBtnActive: {
    background: "linear-gradient(135deg, #1e293b 0%, #172033 100%)",
    color: "#38bdf8",
    border: "1px solid #334155",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
  },
  chartViewport: {
    background: "#0b1120",
    border: "1px solid #1e293b",
    borderRadius: "14px",
    padding: "24px 20px",
    minHeight: "310px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  chartContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%"
  },
  chartHeading: {
    textAlign: "center",
    marginBottom: "20px",
    "h5": {
      fontSize: "14px",
      fontWeight: "750",
      color: "#f8fafc",
      margin: "0 0 4px 0"
    },
    "p": {
      fontSize: "11px",
      color: "#94a3b8",
      margin: "0"
    }
  },
  svgCanvas: {
    overflow: "visible",
    display: "block"
  },
  scoresListContainer: {
    width: "100%",
    maxWidth: "460px",
    display: "flex",
    flexDirection: "column",
    gap: "7px"
  },
  scoreRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "11.5px"
  },
  scoreLabel: {
    width: "42px",
    fontWeight: "750",
    color: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  scoreTrack: {
    flexGrow: 1,
    height: "12px",
    background: "rgba(255, 255, 255, 0.04)",
    borderRadius: "6px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    overflow: "hidden"
  },
  scoreFill: {
    height: "100%",
    borderRadius: "6px",
    transition: "width 0.8s ease-out"
  },
  scoreValue: {
    width: "75px",
    textAlign: "right",
    fontWeight: "700",
    color: "#f8fafc",
    fontSize: "11px"
  },
  legendList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  legendRow: {
    display: "flex",
    alignItems: "center",
    fontSize: "11.5px"
  },
  legendDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    marginRight: "8px",
    display: "inline-block"
  },
  legendLabel: {
    color: "#94a3b8",
    fontWeight: "600",
    width: "64px"
  },
  legendVal: {
    color: "#f8fafc",
    fontWeight: "700"
  }
};

export default MalProfileModal;
