import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { fetchSearch } from "../services/api";
import { genresList, typesList } from "../data/animeData";

export const FilterPage = () => {
  const { lang, toggleWatchlist, isInWatchlist } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to parse query parameters
  const getQueryParam = (name) => {
    return new URLSearchParams(location.search).get(name) || "";
  };

  // Local state reflecting filters
  const [keyword, setKeyword] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSort, setSelectedSort] = useState("popular"); // popular, updated, new
  const [selectedLetter, setSelectedLetter] = useState("all");

  // API Search results state
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync state with URL parameters when route changes
  useEffect(() => {
    setKeyword(getQueryParam("keyword"));
    setSelectedGenre(getQueryParam("genre"));
    setSelectedType(getQueryParam("type"));
    
    const statusParam = getQueryParam("status");
    if (statusParam === "upcoming") setSelectedStatus("Not Yet Aired");
    else if (statusParam === "ongoing") setSelectedStatus("Currently Airing");
    else if (statusParam === "completed") setSelectedStatus("Finished Airing");
    else setSelectedStatus(statusParam);

    const sortParam = getQueryParam("sort") || "popular";
    setSelectedSort(sortParam);

    setSelectedLetter(getQueryParam("letter") || "all");
  }, [location.search]);

  // Query live search when filters change
  useEffect(() => {
    let active = true;
    const executeSearch = async () => {
      try {
        setIsLoading(true);
        const searchResults = await fetchSearch({
          keyword,
          genre: selectedGenre,
          type: selectedType,
          status: selectedStatus,
          letter: selectedLetter
        });
        if (active) {
          // Apply local sorting if necessary
          let sorted = [...searchResults];
          if (selectedSort === "score" || selectedSort === "popular") {
            sorted.sort((a, b) => parseFloat(b.malScore) - parseFloat(a.malScore));
          }
          setResults(sorted);
        }
      } catch (err) {
        console.error("Error executing filter search", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    executeSearch();
    return () => { active = false; };
  }, [keyword, selectedGenre, selectedType, selectedStatus, selectedLetter, selectedSort]);

  // A-Z indices list array
  const alphabet = ["all", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), "0-9"];

  // Handle filter selections and redirect to update URL search parameters
  const updateUrlParam = (name, val) => {
    const params = new URLSearchParams(location.search);
    if (val) {
      params.set(name, val);
    } else {
      params.delete(name);
    }
    navigate(`/filter?${params.toString()}`);
  };

  const handleGenreSelect = (genre) => updateUrlParam("genre", genre);
  const handleTypeSelect = (type) => updateUrlParam("type", type);
  const handleStatusSelect = (status) => updateUrlParam("status", status);
  const handleSortSelect = (sort) => updateUrlParam("sort", sort);
  const handleLetterSelect = (letter) => updateUrlParam("letter", letter);

  const handleFormSearch = (e) => {
    e.preventDefault();
    updateUrlParam("keyword", keyword);
  };

  return (
    <main className="page page-wide catalog-page" id="catalog-page">
      <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text)", marginBottom: "20px" }}>Catalog</h1>
      
      {/* 1. Filter form card */}
      <section className="card filter-form" style={{ padding: "20px", marginBottom: "24px" }}>
        <form onSubmit={handleFormSearch} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
          
          <label className="form-field" style={{ flex: "1 1 200px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", display: "block" }}>Keyword</span>
            <input
              type="text"
              placeholder="Search anime..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", fontSize: "13px" }}
            />
          </label>

          <label className="form-field" style={{ flex: "1 1 120px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", display: "block" }}>Genre</span>
            <select
              value={selectedGenre}
              onChange={(e) => handleGenreSelect(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", fontSize: "13px" }}
            >
              <option value="">All Genres</option>
              {genresList.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>

          <label className="form-field" style={{ flex: "1 1 120px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", display: "block" }}>Type</span>
            <select
              value={selectedType}
              onChange={(e) => handleTypeSelect(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", fontSize: "13px" }}
            >
              <option value="">All Types</option>
              {typesList.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <label className="form-field" style={{ flex: "1 1 120px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", display: "block" }}>Status</span>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusSelect(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", fontSize: "13px" }}
            >
              <option value="">All Status</option>
              <option value="ongoing">Currently Airing</option>
              <option value="completed">Finished Airing</option>
              <option value="upcoming">Not Yet Aired</option>
            </select>
          </label>

          <label className="form-field" style={{ flex: "1 1 120px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", display: "block" }}>Sort</span>
            <select
              value={selectedSort}
              onChange={(e) => handleSortSelect(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", fontSize: "13px" }}
            >
              <option value="popular">Popularity</option>
              <option value="score">Rating Score</option>
              <option value="new">Newly Added</option>
            </select>
          </label>

          <button className="btn btn-primary" type="submit" style={{ padding: "9px 20px", borderRadius: "6px", fontWeight: "600", fontSize: "13px" }}>
            Apply
          </button>
        </form>

        {/* A-Z letter buttons bar */}
        <div className="filter-az" style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "4px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
          {alphabet.map((letter) => {
            const activeLetter = selectedLetter === letter.toLowerCase();
            return (
              <button
                key={letter}
                type="button"
                className={`az-btn ${activeLetter ? "active" : ""}`}
                onClick={() => handleLetterSelect(letter.toLowerCase())}
                style={{
                  background: activeLetter ? "var(--accent)" : "transparent",
                  color: activeLetter ? "hsl(220 25% 5%)" : "var(--muted)",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "700",
                  cursor: "pointer",
                  textTransform: "uppercase"
                }}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Results Section */}
      <section className="catalog-results" style={{ minHeight: "400px", position: "relative" }}>
        
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
        ) : results.length > 0 ? (
          <div className="ani items">
            {results.map((anime) => (
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
                          {anime.subEps > 0 && <span className="ep-status sub"><span>{anime.subEps}</span></span>}
                          {anime.dubEps > 0 && <span className="ep-status dub"><span>{anime.dubEps}</span></span>}
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
            No anime matched your filtering criteria.
          </div>
        )}
      </section>
    </main>
  );
};
export default FilterPage;
