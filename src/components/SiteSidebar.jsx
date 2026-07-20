import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { genresList, typesList, animeCatalog } from "../data/animeData";

export const SiteSidebar = () => {
  const { lang, setLang, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [genresExpanded, setGenresExpanded] = useState(false);
  const [typesExpanded, setTypesExpanded] = useState(false);

  // Sync body class for mobile drawer scroll lock and styles
  useEffect(() => {
    if (!sidebarCollapsed) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }
    return () => {
      document.body.classList.remove("sidebar-open");
    };
  }, [sidebarCollapsed]);

  // Check if current route is active
  const isActive = (path) => {
    return location.pathname + location.search === path ? "active" : "";
  };

  const handleRandom = () => {
    if (animeCatalog.length === 0) return;
    const randomIndex = Math.floor(Math.random() * animeCatalog.length);
    const randomAnime = animeCatalog[randomIndex];
    navigate(`/anime/${randomAnime.id}`);
  };

  return (
    <>
      {/* Sidebar backdrop for mobile view */}
      {!sidebarCollapsed && (
        <div
          className="sidebar-backdrop"
          style={{ display: "block" }}
          onClick={() => setSidebarCollapsed(true)}
        ></div>
      )}

      <aside className={`site-sidebar ${sidebarCollapsed ? "collapsed" : ""}`} id="site-sidebar">
        <div className="site-sidebar__head">
          <span className="site-sidebar__title">Browse</span>
          
          <div className="sidebar-lang sidebar-lang--head">
            <span className="sidebar-lang__label">Title language</span>
            <div className="lang-switch lang-switch--sidebar">
              <button
                type="button"
                className={lang === "en" ? "active" : ""}
                onClick={() => setLang("en")}
              >
                EN
              </button>
              <button
                type="button"
                className={lang === "jp" ? "active" : ""}
                onClick={() => setLang("jp")}
              >
                JP
              </button>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-collapse"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Collapse sidebar"
          >
            <i className={`fa-solid ${sidebarCollapsed ? "fa-angles-right" : "fa-angles-left"}`}></i>
          </button>

          <button
            type="button"
            className="sidebar-close"
            onClick={() => setSidebarCollapsed(true)}
            aria-label="Close menu"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <nav className="site-sidebar__nav">
          <Link to="/home" className={`sidebar-link ${isActive("/home")}`}>
            <i className="fa-solid fa-house"></i>
            <span>Home</span>
          </Link>
          
          <Link to="/schedule" className={`sidebar-link ${isActive("/schedule")}`}>
            <i className="fa-solid fa-calendar-days"></i>
            <span>Schedule</span>
          </Link>
          
          <Link to="/filter" className={`sidebar-link ${isActive("/filter")}`}>
            <i className="fa-solid fa-filter"></i>
            <span>Filter</span>
          </Link>

          {/* Genre Dropdown */}
          <div className="sidebar-group">
            <button
              type="button"
              className={`sidebar-link sidebar-link--toggle ${genresExpanded ? "expanded" : ""}`}
              onClick={() => setGenresExpanded(!genresExpanded)}
              aria-expanded={genresExpanded}
            >
              <i className="fa-solid fa-layer-group"></i>
              <span>Genre</span>
              <i className={`fa-solid fa-chevron-${genresExpanded ? "up" : "down"} sidebar-caret`}></i>
            </button>
            <div className="sidebar-submenu" style={{ display: genresExpanded ? "grid" : "none" }}>
              {genresList.map((genre) => (
                <Link
                  key={genre}
                  to={`/filter?genre=${encodeURIComponent(genre)}`}
                  className="sidebar-sublink"
                >
                  {genre}
                </Link>
              ))}
            </div>
          </div>

          {/* Types Dropdown */}
          <div className="sidebar-group">
            <button
              type="button"
              className={`sidebar-link sidebar-link--toggle ${typesExpanded ? "expanded" : ""}`}
              onClick={() => setTypesExpanded(!typesExpanded)}
              aria-expanded={typesExpanded}
            >
              <i className="fa-solid fa-tv"></i>
              <span>Types</span>
              <i className={`fa-solid fa-chevron-${typesExpanded ? "up" : "down"} sidebar-caret`}></i>
            </button>
            <div className="sidebar-submenu" style={{ display: typesExpanded ? "grid" : "none" }}>
              {typesList.map((type) => (
                <Link
                  key={type}
                  to={`/filter?type=${encodeURIComponent(type)}`}
                  className="sidebar-sublink"
                >
                  {type}
                </Link>
              ))}
            </div>
          </div>

          <Link to="/filter?sort=updated" className={`sidebar-link ${isActive("/filter?sort=updated")}`}>
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>Updated</span>
          </Link>

          <Link to="/filter?sort=new" className={`sidebar-link ${isActive("/filter?sort=new")}`}>
            <i className="fa-solid fa-bolt"></i>
            <span>New Release</span>
          </Link>

          <Link to="/filter?sort=popular" className={`sidebar-link ${isActive("/filter?sort=popular")}`}>
            <i className="fa-solid fa-fire"></i>
            <span>Popular</span>
          </Link>

          <Link to="/filter?status=upcoming" className={`sidebar-link ${isActive("/filter?status=upcoming")}`}>
            <i className="fa-solid fa-calendar"></i>
            <span>Upcoming</span>
          </Link>

          <Link to="/filter?status=ongoing" className={`sidebar-link ${isActive("/filter?status=ongoing")}`}>
            <i className="fa-solid fa-signal"></i>
            <span>Ongoing</span>
          </Link>

          <Link to="/filter?status=completed" className={`sidebar-link ${isActive("/filter?status=completed")}`}>
            <i className="fa-solid fa-circle-check"></i>
            <span>Completed</span>
          </Link>

          <button type="button" className="sidebar-link" onClick={handleRandom} style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}>
            <i className="fa-solid fa-shuffle"></i>
            <span>Random</span>
          </button>

          <Link to="/filter?letter=all" className={`sidebar-link ${isActive("/filter?letter=all")}`}>
            <i className="fa-solid fa-list-ol"></i>
            <span>A-Z List</span>
          </Link>
        </nav>

        <div className="sidebar-lang sidebar-lang--foot">
          <span className="sidebar-lang__label">Title language</span>
          <div className="lang-switch lang-switch--sidebar">
            <button
              type="button"
              className={lang === "en" ? "active" : ""}
              onClick={() => setLang("en")}
            >
              EN
            </button>
            <button
              type="button"
              className={lang === "jp" ? "active" : ""}
              onClick={() => setLang("jp")}
            >
              JP
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
