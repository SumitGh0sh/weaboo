import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { genresList, typesList, animeCatalog } from "../data/animeData";
import {
  Home,
  Calendar,
  SlidersHorizontal,
  Layers,
  Tv,
  Clock,
  Sparkles,
  Flame,
  CalendarRange,
  Activity,
  CheckCircle2,
  Shuffle,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

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
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <button
            type="button"
            className="sidebar-close"
            onClick={() => setSidebarCollapsed(true)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="site-sidebar__nav">
          <Link to="/home" className={`sidebar-link ${isActive("/home")}`}>
            <Home size={18} />
            <span>Home</span>
          </Link>
          
          <Link to="/schedule" className={`sidebar-link ${isActive("/schedule")}`}>
            <Calendar size={18} />
            <span>Schedule</span>
          </Link>
          
          <Link to="/filter" className={`sidebar-link ${isActive("/filter")}`}>
            <SlidersHorizontal size={18} />
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
              <Layers size={18} />
              <span>Genre</span>
              {genresExpanded ? <ChevronUp size={14} className="sidebar-caret" /> : <ChevronDown size={14} className="sidebar-caret" />}
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
              <Tv size={18} />
              <span>Types</span>
              {typesExpanded ? <ChevronUp size={14} className="sidebar-caret" /> : <ChevronDown size={14} className="sidebar-caret" />}
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
            <Clock size={18} />
            <span>Updated</span>
          </Link>

          <Link to="/filter?sort=new" className={`sidebar-link ${isActive("/filter?sort=new")}`}>
            <Sparkles size={18} />
            <span>New Release</span>
          </Link>

          <Link to="/filter?sort=popular" className={`sidebar-link ${isActive("/filter?sort=popular")}`}>
            <Flame size={18} />
            <span>Popular</span>
          </Link>

          <Link to="/filter?status=upcoming" className={`sidebar-link ${isActive("/filter?status=upcoming")}`}>
            <CalendarRange size={18} />
            <span>Upcoming</span>
          </Link>

          <Link to="/filter?status=ongoing" className={`sidebar-link ${isActive("/filter?status=ongoing")}`}>
            <Activity size={18} />
            <span>Ongoing</span>
          </Link>

          <Link to="/filter?status=completed" className={`sidebar-link ${isActive("/filter?status=completed")}`}>
            <CheckCircle2 size={18} />
            <span>Completed</span>
          </Link>

          <button type="button" className="sidebar-link" onClick={handleRandom} style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}>
            <Shuffle size={18} />
            <span>Random</span>
          </button>

          <Link to="/filter?letter=all" className={`sidebar-link ${isActive("/filter?letter=all")}`}>
            <ListOrdered size={18} />
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
