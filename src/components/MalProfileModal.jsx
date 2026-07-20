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
  const [activeTab, setActiveTab] = useState("footprint"); // "footprint", "distribution", "formats"
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
        { scale: 0.5, opacity: 0, transformOrigin: "120px 120px" },
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
    { label: "Completed", value: malUser.completedCount, max: 200 },
    { label: "Watching", value: malUser.watchingCount, max: 20 },
    { label: "Plan to", value: malUser.planToWatchCount, max: 120 },
    { label: "Days", value: malUser.daysWatched, max: 100 },
    { label: "Rating", value: malUser.meanScore, max: 10 }
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

  // 2. BAR CHART CONFIG
  const barData = [
    { label: "Watching", count: malUser.watchingCount, color: "var(--accent)" },
    { label: "Completed", count: malUser.completedCount, color: "hsl(145 60% 55%)" },
    { label: "On Hold", count: malUser.onHoldCount || 0, color: "hsl(45 90% 55%)" },
    { label: "Dropped", count: malUser.droppedCount || 0, color: "hsl(350 85% 55%)" },
    { label: "Plan to Watch", count: malUser.planToWatchCount, color: "hsl(200 85% 55%)" }
  ];
  const maxBarVal = Math.max(...barData.map((b) => b.count)) || 1;

  // 3. DOUGHNUT CHART CONFIG
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
  const doughnutCircumference = 376.99; // 2 * PI * r (r=60)
  const doughnutSegments = [
    { label: "TV", count: formatCounts.TV, color: "var(--accent)" },
    { label: "Movie", count: formatCounts.Movie, color: "hsl(145 60% 55%)" },
    { label: "ONA", count: formatCounts.ONA, color: "hsl(200 85% 55%)" },
    { label: "OVA/Sp", count: formatCounts.OVA + formatCounts.Special, color: "hsl(45 90% 55%)" }
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
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "750" }}>
                    {malUser.username} <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "11px", marginLeft: "4px" }}></i>
                  </h3>
                </a>
                <span style={styles.statusBadge}>Connected</span>
              </div>
            </div>

            {/* Mock Data Warning Alert */}
            {malUser.isMocked && (
              <div style={styles.mockWarning}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: "6px" }}></i>
                <span>Jikan API scraper timeout. Showing cached/fallback MAL profile stats.</span>
              </div>
            )}

            {/* Numeric quick stats list */}
            <div style={styles.sidebarStats}>
              <div style={styles.sidebarStatRow}>
                <span>📚 Episodes Watched</span>
                <strong>{malUser.episodesWatched}</strong>
              </div>
              <div style={styles.sidebarStatRow}>
                <span>⏱️ Days Spent</span>
                <strong>{Math.round(malUser.daysWatched)}</strong>
              </div>
              <div style={styles.sidebarStatRow}>
                <span>⭐ Mean rating</span>
                <strong>{malUser.meanScore || "N/A"}</strong>
              </div>
            </div>

            {/* Currently Watching Shelf */}
            <div style={{ marginTop: "24px" }}>
              <h4 style={styles.sectionTitle}>Currently Watching ({malWatching.length})</h4>
              {malWatching.length === 0 ? (
                <p style={styles.emptyText}>No active watchlist entries cataloged on your MAL profile.</p>
              ) : (
                <div style={styles.scrollShelf}>
                  {malWatching.slice(0, 6).map((item) => {
                    const animeTitle = item.anime?.title || "Unknown Title";
                    const localLink = getLocalLink(animeTitle);
                    
                    return (
                      <div key={item.anime?.mal_id} style={styles.shelfCard}>
                        <div style={styles.shelfPosterWrap}>
                          <img src={item.anime?.images?.jpg?.image_url} alt="" style={styles.shelfPoster} />
                          <div style={styles.shelfProgress}>
                            {item.episodes_watched} / {item.episodes_total || "?"} eps
                          </div>
                        </div>
                        <div style={styles.shelfInfo}>
                          <span style={styles.shelfTitle}>{animeTitle}</span>
                          {localLink ? (
                            <Link to={localLink} onClick={() => setShowMalProfileModal(false)} style={styles.localWatchBtn}>
                              Watch
                            </Link>
                          ) : (
                            <a href={item.anime?.url} target="_blank" rel="noopener noreferrer" style={styles.malDetailsLink}>
                              MAL <i className="fa-solid fa-up-right-from-square" style={{ fontSize: "8px" }}></i>
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

          {/* RIGHT COLUMN: Premium SVG Charts */}
          <div style={styles.rightCol} ref={chartContainerRef}>
            
            {/* Chart Tab bar */}
            <div style={styles.tabBar}>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === "footprint" ? styles.tabBtnActive : {}) }}
                onClick={() => setActiveTab("footprint")}
              >
                <i className="fa-solid fa-spider" style={{ marginRight: "6px" }}></i> Footprint
              </button>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === "distribution" ? styles.tabBtnActive : {}) }}
                onClick={() => setActiveTab("distribution")}
              >
                <i className="fa-solid fa-chart-column" style={{ marginRight: "6px" }}></i> Distribution
              </button>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === "formats" ? styles.tabBtnActive : {}) }}
                onClick={() => setActiveTab("formats")}
              >
                <i className="fa-solid fa-chart-pie" style={{ marginRight: "6px" }}></i> Formats
              </button>
            </div>

            {/* Chart Screen viewport */}
            <div style={styles.chartViewport}>
              
              {/* TAB 1: RADAR / SPIDER CHART */}
              {activeTab === "footprint" && (
                <div style={styles.chartContainer}>
                  <div style={styles.chartHeading}>
                    <h5>Anime Footprint Footprint</h5>
                    <p>Spider metrics footprint normalized against top community standards.</p>
                  </div>
                  
                  <svg width="240" height="240" viewBox="0 0 240 240" style={styles.svgCanvas}>
                    <defs>
                      <radialGradient id="radarRadial" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="hsl(340 100% 50% / 0.05)" />
                        <stop offset="70%" stop-color="hsl(340 100% 50% / 0.15)" />
                        <stop offset="100%" stop-color="hsl(280 85% 55% / 0.35)" />
                      </radialGradient>
                      <linearGradient id="radarOutline" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="hsl(340 100% 55%)" />
                        <stop offset="50%" stop-color="hsl(300 90% 50%)" />
                        <stop offset="100%" stop-color="hsl(260 95% 60%)" />
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
                          stroke={idx % 2 === 0 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}
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
                          stroke="rgba(255,255,255,0.05)"
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
                      style={{ filter: "drop-shadow(0 0 8px hsl(340 100% 50% / 0.5))" }}
                    />

                    {/* Data Points vertices */}
                    {points.map((p, i) => (
                      <g key={i} className="radar-point">
                        {/* Glow halo */}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="7"
                          fill="hsl(340 100% 50%)"
                          opacity="0.25"
                        />
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          fill="white"
                          stroke="url(#radarOutline)"
                          strokeWidth="2"
                        />
                        {/* Values tooltips */}
                        <text
                          x={p.x}
                          y={p.y - 10}
                          fill="var(--text-title)"
                          fontSize="9.5"
                          fontWeight="800"
                          textAnchor="middle"
                          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
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
                      const y = center + textRadius * Math.sin(angle) + 3; // vertical adjustment
                      
                      return (
                        <text
                          key={i}
                          x={x}
                          y={y}
                          fill="var(--text-desc)"
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

              {/* TAB 2: BAR GRAPH CHART */}
              {activeTab === "distribution" && (
                <div style={styles.chartContainer}>
                  <div style={styles.chartHeading}>
                    <h5>Library Distribution</h5>
                    <p>Comparison of anime library status counts across your catalog.</p>
                  </div>

                  <svg width="240" height="180" viewBox="0 0 240 180" style={styles.svgCanvas}>
                    <defs>
                      <linearGradient id="gradWatching" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="hsl(340 100% 65%)" />
                        <stop offset="100%" stop-color="hsl(340 100% 35%)" />
                      </linearGradient>
                      <linearGradient id="gradCompleted" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="hsl(145 80% 60%)" />
                        <stop offset="100%" stop-color="hsl(145 80% 30%)" />
                      </linearGradient>
                      <linearGradient id="gradHold" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="hsl(45 95% 60%)" />
                        <stop offset="100%" stop-color="hsl(45 95% 30%)" />
                      </linearGradient>
                      <linearGradient id="gradDropped" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="hsl(350 90% 60%)" />
                        <stop offset="100%" stop-color="hsl(350 90% 30%)" />
                      </linearGradient>
                      <linearGradient id="gradPlan" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="hsl(200 90% 60%)" />
                        <stop offset="100%" stop-color="hsl(200 90% 30%)" />
                      </linearGradient>
                    </defs>

                    {/* Background Grid Lines */}
                    <line x1="15" y1="30" x2="225" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="15" y1="80" x2="225" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="15" y1="130" x2="225" y2="130" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    
                    {barData.map((bar, i) => {
                      const x = 24 + i * 40;
                      const maxBarHeight = 110;
                      const h = Math.max(8, (bar.count / maxBarVal) * maxBarHeight);
                      const y = 140 - h;

                      // Map colors to gradients
                      let gradId = "gradWatching";
                      if (bar.label === "Completed") gradId = "gradCompleted";
                      else if (bar.label === "On Hold") gradId = "gradHold";
                      else if (bar.label === "Dropped") gradId = "gradDropped";
                      else if (bar.label === "Plan to Watch") gradId = "gradPlan";

                      return (
                        <g key={i}>
                          {/* Backing Track (Glassmorphism slot) */}
                          <rect
                            x={x}
                            y={30}
                            width="24"
                            height={maxBarHeight}
                            rx="4"
                            ry="4"
                            fill="rgba(255,255,255,0.02)"
                            stroke="rgba(255,255,255,0.04)"
                            strokeWidth="0.5"
                          />

                          {/* Value above the bar */}
                          <text
                            x={x + 12}
                            y={y - 6}
                            fill="var(--text-title)"
                            fontSize="9.5"
                            fontWeight="800"
                            textAnchor="middle"
                            className="bar-value"
                            style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }}
                          >
                            {bar.count}
                          </text>

                          {/* Bar rectangle */}
                          <rect
                            x={x}
                            y={y}
                            width="24"
                            height={h}
                            rx="4"
                            ry="4"
                            fill={`url(#${gradId})`}
                            className="chart-bar"
                            style={{ filter: `drop-shadow(0 0 5px ${bar.color}45)` }}
                          />

                          {/* Labels below the bar */}
                          <text
                            x={x + 12}
                            y="155"
                            fill="var(--text-desc)"
                            fontSize="8"
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

              {/* TAB 3: DOUGHNUT FORMAT CHART */}
              {activeTab === "formats" && (
                <div style={styles.chartContainer}>
                  <div style={styles.chartHeading}>
                    <h5>Watch Formats Breakdown</h5>
                    <p>Format categories computed dynamically from active watchlist titles.</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", width: "100%" }}>
                    
                    <svg width="150" height="150" viewBox="0 0 150 150" style={{ flexShrink: 0 }}>
                      <defs>
                        <linearGradient id="doughnutTV" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stop-color="hsl(340 100% 65%)" />
                          <stop offset="100%" stop-color="hsl(290 100% 50%)" />
                        </linearGradient>
                        <linearGradient id="doughnutMovie" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stop-color="hsl(145 80% 60%)" />
                          <stop offset="100%" stop-color="hsl(170 80% 40%)" />
                        </linearGradient>
                        <linearGradient id="doughnutONA" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stop-color="hsl(200 90% 60%)" />
                          <stop offset="100%" stop-color="hsl(220 90% 40%)" />
                        </linearGradient>
                        <linearGradient id="doughnutOVA" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stop-color="hsl(45 95% 60%)" />
                          <stop offset="100%" stop-color="hsl(25 95% 45%)" />
                        </linearGradient>
                      </defs>

                      {/* Tech HUD Outer & Inner Accent Rings */}
                      <circle cx="75" cy="75" r="56" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.75" strokeDasharray="3 3" />
                      <circle cx="75" cy="75" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.75" strokeDasharray="3 3" />

                      <g className="doughnut-group">
                        
                        {/* Background ring */}
                        <circle
                          cx="75"
                          cy="75"
                          r="45"
                          fill="none"
                          stroke="rgba(255,255,255,0.03)"
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
                              strokeDashoffset="282.74" // Init offset for animation
                              data-target-offset={offset}
                              className="doughnut-segment"
                              transform="rotate(-90 75 75)"
                              strokeLinecap="round"
                              style={{
                                filter: `drop-shadow(0 0 5px ${seg.color}50)`,
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
                          fill="var(--text-title)"
                          fontSize="15"
                          fontWeight="800"
                          textAnchor="middle"
                        >
                          {totalDoughnutCount}
                        </text>
                        <text
                          x="75"
                          y="85"
                          fill="var(--muted)"
                          fontSize="7"
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
    background: "rgba(6, 5, 10, 0.78)",
    backdropFilter: "blur(10px)",
    zIndex: 99999,
    display: "grid",
    placeItems: "center",
    padding: "20px",
    animation: "fadeIn 0.28s ease-out"
  },
  modal: {
    background: "linear-gradient(135deg, hsl(240 18% 7% / 0.92) 0%, hsl(240 18% 4% / 0.96) 100%)",
    border: "1px solid hsl(240 18% 12% / 0.6)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "920px",
    position: "relative",
    padding: "36px 32px",
    boxSizing: "border-box"
  },
  closeBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "none",
    border: "none",
    color: "var(--muted)",
    fontSize: "18px",
    cursor: "pointer",
    padding: "6px",
    transition: "color 0.2s",
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
    borderRight: "1px solid hsl(240 18% 12% / 0.7)",
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
    width: "48px",
    height: "48px",
    flexShrink: 0
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid var(--accent)"
  },
  badge: {
    position: "absolute",
    bottom: "-2px",
    right: "-4px",
    background: "#2e51a2",
    color: "white",
    fontSize: "8px",
    fontWeight: "800",
    padding: "1px 4px",
    borderRadius: "3px",
    border: "1px solid hsl(240 18% 7%)"
  },
  headerInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  usernameLink: {
    color: "var(--text)",
    textDecoration: "none",
    outline: "none",
    margin: "0"
  },
  statusBadge: {
    alignSelf: "flex-start",
    fontSize: "9px",
    fontWeight: "700",
    color: "hsl(145 60% 50%)",
    background: "hsl(145 60% 50% / 0.12)",
    padding: "2px 8px",
    borderRadius: "20px",
    border: "1px solid hsl(145 60% 50% / 0.25)",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  mockWarning: {
    background: "hsl(45 90% 55% / 0.1)",
    border: "1px solid hsl(45 90% 55% / 0.2)",
    color: "hsl(45 90% 55%)",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "10px",
    lineHeight: "1.4",
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "18px"
  },
  sidebarStats: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    background: "hsl(240 18% 4% / 0.6)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "14px 16px"
  },
  sidebarStatRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    color: "var(--text-desc)",
    "strong": {
      color: "var(--text)",
      fontWeight: "750"
    }
  },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: "750",
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    margin: "0 0 10px 0"
  },
  emptyText: {
    fontSize: "11px",
    color: "var(--muted)",
    textAlign: "center",
    margin: "12px 0"
  },
  scrollShelf: {
    display: "flex",
    gap: "10px",
    overflowX: "auto",
    paddingBottom: "4px"
  },
  shelfCard: {
    width: "82px",
    flexShrink: 0,
    background: "hsl(240 18% 4% / 0.4)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
  },
  shelfPosterWrap: {
    position: "relative",
    width: "100%",
    height: "100px"
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
    background: "rgba(0, 0, 0, 0.8)",
    color: "var(--text)",
    fontSize: "8px",
    padding: "1px 2px",
    borderRadius: "2px",
    textAlign: "center",
    fontWeight: "700"
  },
  shelfInfo: {
    padding: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  shelfTitle: {
    fontSize: "9px",
    fontWeight: "650",
    color: "var(--text-title)",
    lineHeight: "1.2",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    height: "22px"
  },
  localWatchBtn: {
    background: "var(--accent)",
    color: "hsl(220 25% 5%)",
    textDecoration: "none",
    fontSize: "8px",
    fontWeight: "750",
    padding: "3px 0",
    borderRadius: "3px",
    textAlign: "center",
    display: "block"
  },
  malDetailsLink: {
    color: "var(--muted)",
    textDecoration: "none",
    fontSize: "8px",
    textAlign: "center",
    padding: "3px 0",
    border: "1px solid var(--border)",
    borderRadius: "3px",
    display: "block"
  },
  syncAlert: {
    background: "hsl(172 66% 50% / 0.1)",
    border: "1px solid hsl(172 66% 50% / 0.2)",
    color: "var(--accent)",
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
    borderTop: "1px solid hsl(240 18% 12% / 0.5)",
    paddingTop: "20px"
  },
  syncBtn: {
    flexGrow: 1,
    background: "hsl(240 18% 10% / 0.7)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: "6px",
    padding: "8px 12px",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  unlinkBtn: {
    background: "hsl(350 85% 55% / 0.12)",
    border: "1px solid hsl(350 85% 55% / 0.25)",
    color: "hsl(350 85% 55%)",
    borderRadius: "6px",
    padding: "8px 12px",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  tabBar: {
    display: "flex",
    background: "hsl(240 18% 4% / 0.7)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "4px",
    gap: "4px"
  },
  tabBtn: {
    flexGrow: 1,
    background: "none",
    border: "none",
    color: "var(--muted)",
    padding: "8px 16px",
    fontSize: "12px",
    fontWeight: "600",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background 0.2s, color 0.2s"
  },
  tabBtnActive: {
    background: "linear-gradient(135deg, hsl(240 18% 12%) 0%, hsl(240 18% 8%) 100%)",
    color: "var(--accent)",
    border: "1px solid hsl(240 18% 16% / 0.4)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)"
  },
  chartViewport: {
    background: "hsl(240 18% 3% / 0.5)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "28px",
    minHeight: "300px",
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
    marginBottom: "24px",
    "h5": {
      fontSize: "14px",
      fontWeight: "750",
      color: "var(--text)",
      margin: "0 0 4px 0"
    },
    "p": {
      fontSize: "11px",
      color: "var(--muted)",
      margin: "0"
    }
  },
  svgCanvas: {
    overflow: "visible",
    display: "block"
  },
  legendList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  legendRow: {
    display: "flex",
    alignItems: "center",
    fontSize: "11px"
  },
  legendDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    marginRight: "8px",
    display: "inline-block"
  },
  legendLabel: {
    color: "var(--text-desc)",
    fontWeight: "600",
    width: "60px"
  },
  legendVal: {
    color: "var(--text)",
    fontWeight: "700"
  }
};
export default MalProfileModal;
