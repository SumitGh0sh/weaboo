import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { animeCatalog } from "../data/animeData";

export const SiteHeader = () => {
  const {
    lang,
    setLang,
    user,
    setUser,
    setShowLoginModal,
    setLoginModalTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    malUser,
    setShowMalLinkModal,
    setShowMalProfileModal
  } = useApp();

  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const autocompleteRef = useRef(null);

  const inputRef = useRef(null);

  // Sync body.search-open class for mobile search overlay styling
  useEffect(() => {
    if (searchOpen) {
      document.body.classList.add("search-open");
    } else {
      document.body.classList.remove("search-open");
    }
  }, [searchOpen]);

  // Close search box and suggestions on click/touch outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target)) {
        setSuggestions([]);
        setSearchOpen(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Update search suggestions in real-time
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const filtered = animeCatalog.filter((anime) => {
      const matchQuery = query.toLowerCase();
      const title = lang === "en" ? anime.titleEn : anime.titleJp;
      return (
        title.toLowerCase().includes(matchQuery) ||
        (anime.synonyms && anime.synonyms.toLowerCase().includes(matchQuery))
      );
    });
    setSuggestions(filtered.slice(0, 5));
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/filter?keyword=${encodeURIComponent(query)}`);
    } else {
      navigate(`/filter`);
    }
    setSuggestions([]);
    setSearchOpen(false);
    setSearchFocused(false);
    if (inputRef.current) inputRef.current.blur();
  };

  const handleSuggestionClick = (id) => {
    setSuggestions([]);
    setSearchQuery("");
    setSearchOpen(false);
    setSearchFocused(false);
    navigate(`/anime/${id}`);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      setUser(null);
    }
  };

  return (
    <header className={`site-header ${searchOpen ? "search-open" : ""}`}>
      <div className="site-header__inner">

        {/* Brand Logo */}
        <Link
          to="/home"
          className="brand"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            transform: "translateY(-4px)",
            transition: "opacity 0.2s ease",
            marginRight: "16px"
          }}
        >
          <img
            src="/logo.png"
            alt="Weaboo"
            className="brand-logo"
            style={{ height: "40px", width: "auto", objectFit: "contain" }}
          />
        </Link>

        {/* Search Bar Container */}
        <div
          id="search"
          className={`header-search-wrap ${searchOpen || searchFocused ? "active" : ""}`}
          ref={autocompleteRef}
          style={{
            flex: searchFocused ? "1 1 100%" : "1 1 320px",
            maxWidth: searchFocused ? "680px" : "480px",
            transition: "all 0.28s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          <div className="search-inner">
            <form className="header-search" onSubmit={handleSearchSubmit}>
              <input
                ref={inputRef}
                type="search"
                placeholder="Search anime on Weaboo…"
                autoComplete="off"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => {
                  setTimeout(() => {
                    if (!searchQuery) setSearchFocused(false);
                  }, 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchSubmit(e);
                  }
                }}
              />

              {searchFocused && (
                <button
                  type="button"
                  className="search-close-active"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchFocused(false);
                    setSuggestions([]);
                  }}
                  aria-label="Close search"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    cursor: "pointer",
                    padding: "0 6px",
                    display: "grid",
                    placeItems: "center"
                  }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}

              <button
                type="submit"
                className="search-submit-btn"
                aria-label="Search"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSearchSubmit}
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  boxShadow: "none",
                  padding: "0 8px",
                  cursor: "pointer",
                  color: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </form>

            {/* Autocomplete suggestions */}
            {suggestions.length > 0 && (
              <div className="search-autocomplete" style={{ display: "block" }}>
                <div id="search-results">
                  {suggestions.map((anime) => (
                    <div
                      key={anime.id}
                      className="search-result-item"
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px"
                      }}
                      onClick={() => handleSuggestionClick(anime.id)}
                    >
                      <img
                        src={anime.poster}
                        alt=""
                        style={{ width: "32px", height: "45px", objectFit: "cover", borderRadius: "4px" }}
                      />
                      <div>
                        <div style={{ color: "var(--text)", fontWeight: "600", fontSize: "13px" }}>
                          {lang === "en" ? anime.titleEn : anime.titleJp}
                        </div>
                        <div style={{ color: "var(--muted)", fontSize: "11px" }}>
                          {anime.type} • {anime.malScore}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="header-spacer"></div>

        {/* Header Right Actions */}
        <div className="header-actions">
          {/* Mobile Search Toggle */}
          <button
            type="button"
            className="search-toggle"
            onClick={(e) => {
              e.stopPropagation();
              const nextState = !searchOpen;
              setSearchOpen(nextState);
              if (nextState) {
                setSearchFocused(true);
                setTimeout(() => inputRef.current?.focus(), 100);
              } else {
                setSearchFocused(false);
                setSuggestions([]);
              }
            }}
            aria-label="Toggle search"
          >
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>

          {/* Lang Toggle EN/JP */}
          <div className="lang-switch">
            <button
              type="button"
              className={lang === "en" ? "active" : ""}
              onClick={() => setLang("en")}
              style={{
                background: lang === "en" ? "var(--accent)" : "transparent",
                color: lang === "en" ? "hsl(220 25% 5%)" : "var(--muted)",
                border: "none",
                fontWeight: lang === "en" ? "600" : "500",
                cursor: "pointer"
              }}
            >
              EN
            </button>
            <button
              type="button"
              className={lang === "jp" ? "active" : ""}
              onClick={() => setLang("jp")}
              style={{
                background: lang === "jp" ? "var(--accent)" : "transparent",
                color: lang === "jp" ? "hsl(220 25% 5%)" : "var(--muted)",
                border: "none",
                fontWeight: lang === "jp" ? "600" : "500",
                cursor: "pointer"
              }}
            >
              JP
            </button>
          </div>

          {/* MAL Account Slot */}
          <div id="mal-slot" style={{ display: "flex", alignItems: "center", marginRight: "8px" }}>
            {malUser ? (
              <div
                style={{
                  position: "relative",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  border: "2px solid var(--accent)",
                  boxShadow: "0 0 8px hsl(192 100% 52% / 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                onClick={() => setShowMalProfileModal(true)}
                title={`MAL Profile: ${malUser.username}`}
              >
                <img
                  src={malUser.avatar}
                  alt=""
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: "-4px",
                    right: "-4px",
                    background: "#2e51a2",
                    color: "white",
                    fontSize: "7px",
                    fontWeight: "800",
                    padding: "1px 3px",
                    borderRadius: "3px",
                    transform: "scale(0.85)"
                  }}
                >
                  MAL
                </span>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  border: "none",
                  fontSize: "12px",
                  color: "var(--text)",
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
                onClick={() => setShowMalLinkModal(true)}
              >
                <i className="fa-solid fa-link" style={{ color: "var(--accent)" }}></i>
                <span className="d-none d-md-inline" style={{ fontSize: "11px", fontWeight: "600" }}>Link MAL</span>
              </button>
            )}
          </div>

          {/* User slot */}
          <div id="user-slot">
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--accent)",
                    color: "hsl(220 25% 5%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                  title={user.username}
                  onClick={handleLogout}
                >
                  {user.username.substring(0, 2).toUpperCase()}
                </span>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  border: "none",
                  fontSize: "12px",
                  color: "var(--text)",
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
                onClick={() => {
                  setShowLoginModal(true);
                  setLoginModalTab("login");
                }}
              >
                <i className="fa-regular fa-user"></i>
                <span className="d-none d-md-inline">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
