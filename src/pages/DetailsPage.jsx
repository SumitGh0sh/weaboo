import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { fetchAnimeDetails } from "../services/api";
import { animeCatalog } from "../data/animeData";

export const DetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang, toggleWatchlist, isInWatchlist } = useApp();

  const [anime, setAnime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("episodes");
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  // Load details from API
  useEffect(() => {
    let active = true;
    const loadDetails = async () => {
      try {
        setIsLoading(true);
        const data = await fetchAnimeDetails(id);
        if (active) {
          // If the anime has no episodes roster, generate it based on totalEps
          if (!data.episodes) {
            data.episodes = Array.from({ length: data.totalEps || 12 }, (_, i) => ({
              num: i + 1,
              title: `Episode ${i + 1}`,
              videoSub: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            }));
          }
          setAnime(data);
        }
      } catch (err) {
        console.error("Error loading anime details", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadDetails();
    return () => { active = false; };
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ padding: "80px 40px", display: "grid", placeItems: "center", minHeight: "70vh" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "3px solid var(--border)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }}
          className="loading-spinner"
        ></div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="page" style={{ padding: "40px", textAlign: "center" }}>
        <h2>Anime Not Found</h2>
        <p className="muted" style={{ marginTop: "10px" }}>The anime you are looking for does not exist in our catalog.</p>
        <Link to="/home" className="btn btn-primary" style={{ marginTop: "20px" }}>Go Home</Link>
      </div>
    );
  }

  // Related anime from local backup
  const relatedAnime = animeCatalog.filter(
    (a) => a.id !== anime.id && a.genres.some(g => anime.genres.includes(g))
  ).slice(0, 3);

  // Recommendations from local backup
  const recommendedAnime = animeCatalog.filter((a) => a.id !== anime.id).slice(0, 6);

  const title = lang === "en" ? anime.titleEn : anime.titleJp;

  return (
    <main className="page page-wide page-anime series-page" id="series-page">
      
      {/* 1. Intro Top Banner Info */}
      <section className="series-intro">
        <div className="series-intro__poster">
          <img
            src={anime.poster}
            alt={title}
            width="200"
            height="300"
            style={{ objectFit: "cover", borderRadius: "8px" }}
          />
          <div className="series-score" title="MAL score">
            <i className="fa-solid fa-star" aria-hidden="true" style={{ color: "var(--accent)", marginRight: "4px" }}></i>
            <b>{anime.malScore}</b>
          </div>
        </div>

        <div className="series-intro__copy">
          <nav className="series-crumbs" aria-label="Breadcrumb">
            <Link to="/home">Home</Link>
            <span aria-hidden="true">/</span>
            <Link to={`/filter?type=${anime.type}`}>{anime.type}</Link>
            <span aria-hidden="true">/</span>
            <span className="series-crumbs__now">{title}</span>
          </nav>

          <h1 className="series-title">{title}</h1>
          {anime.nativeName && <p className="series-native">{anime.nativeName}</p>}

          <div className="series-pills">
            <span className="series-pill">PG-13</span>
            <span className="series-pill series-pill--accent">HD</span>
            {anime.subEps > 0 && (
              <span className="series-pill series-pill--sub">
                <i className="fa-solid fa-closed-captioning"></i> {anime.subEps}
              </span>
            )}
            {anime.dubEps > 0 && (
              <span className="series-pill series-pill--dub">
                <i className="fa-solid fa-microphone"></i> {anime.dubEps}
              </span>
            )}
            <span className="series-pill">{anime.totalEps} eps</span>
            <span className="series-pill">{anime.type}</span>
            <span className="series-pill">{anime.duration}</span>
            <span className="series-pill">{anime.status}</span>
          </div>

          <div className="series-cta">
            {anime.episodes && anime.episodes.length > 0 ? (
              <Link className="btn btn-primary series-cta__watch" to={`/watch/${anime.id}/ep-1`}>
                <i className="fa-solid fa-play"></i> Watch now
              </Link>
            ) : (
              <button className="btn btn-primary" disabled>
                Coming Soon
              </button>
            )}

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => toggleWatchlist(anime.id)}
              aria-label={isInWatchlist(anime.id) ? "Remove from watchlist" : "Add to watchlist"}
            >
              <i className={isInWatchlist(anime.id) ? "fa-solid fa-check" : "fa-solid fa-plus"} aria-hidden="true" style={{ color: isInWatchlist(anime.id) ? "var(--accent)" : "inherit" }}></i>
              <span>{isInWatchlist(anime.id) ? "Watchlisted" : "Add to list"}</span>
            </button>
          </div>

          {/* Description Section with expand option */}
          <div className="series-desc">
            <div className={`series-desc__text ${synopsisExpanded ? "expanded" : ""}`}>
              <p>{anime.synopsis}</p>
            </div>
            <button
              type="button"
              className="series-desc__more"
              onClick={() => setSynopsisExpanded(!synopsisExpanded)}
            >
              {synopsisExpanded ? "Show less" : "Read more"}
            </button>
          </div>

          <p className="series-desc__disclaimer" style={{ fontSize: "11px", color: "var(--muted)", marginTop: "12px" }}>
            Weaboo is a site that allows users to access and watch anime content online. We do not store any media files directly on our servers; rather, the videos are embedded or parsed from independent third-party sources.
          </p>
        </div>
      </section>

      {/* 2. Content Row: Detail Tabs & Sidebar-rail Info */}
      <div className="series-layout">
        
        {/* Main Details Panel (Left Column) */}
        <div className="series-main" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Tabs selectors header */}
            <div className="series-tabs" style={{ display: "flex", borderBottom: "1px solid var(--border)", gap: "16px" }}>
              <button
                type="button"
                className={`series-tab ${activeTab === "episodes" ? "active" : ""}`}
                onClick={() => setActiveTab("episodes")}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "episodes" ? "2px solid var(--accent)" : "none",
                  color: activeTab === "episodes" ? "var(--text)" : "var(--muted)",
                  padding: "10px 4px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Episodes
              </button>
              <button
                type="button"
                className={`series-tab ${activeTab === "suggest" ? "active" : ""}`}
                onClick={() => setActiveTab("suggest")}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "suggest" ? "2px solid var(--accent)" : "none",
                  color: activeTab === "suggest" ? "var(--text)" : "var(--muted)",
                  padding: "10px 4px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Suggestions
              </button>
            </div>

            {/* TAB CONTENT: Episodes grid list */}
            {activeTab === "episodes" && (
              <div className="tab-pane active" style={{ minHeight: "200px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))",
                    gap: "8px"
                  }}
                >
                  {anime.episodes && anime.episodes.map((ep) => (
                    <Link
                      key={ep.num}
                      to={`/watch/${anime.id}/ep-${ep.num}`}
                      className="btn btn-ghost"
                      style={{
                        padding: "10px",
                        textAlign: "center",
                        fontSize: "13px",
                        fontWeight: "700",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        background: "var(--bg3)"
                      }}
                    >
                      {ep.num}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Suggestions */}
            {activeTab === "suggest" && (
              <div className="tab-pane active">
                <div className="ani items">
                  {recommendedAnime.map((rec) => (
                    <div key={rec.id} className="item">
                      <div className="ani poster">
                        <div className="poster-actions">
                          <Link to={`/anime/${rec.id}`} className="card-act card-act--info" style={{ display: "grid", placeItems: "center" }}>
                            <i className="fa-solid fa-circle-info"></i>
                          </Link>
                        </div>
                        <Link to={`/anime/${rec.id}`}>
                          <img src={rec.poster} alt={lang === "en" ? rec.titleEn : rec.titleJp} />
                          <div className="meta">
                            <div className="inner">
                              <div className="left">
                                <span className="ep-status total"><span>{rec.totalEps} eps</span></span>
                              </div>
                              <div className="right">{rec.type}</div>
                            </div>
                          </div>
                        </Link>
                      </div>
                      <div className="info">
                        <Link className="name d-title" to={`/anime/${rec.id}`}>
                          {lang === "en" ? rec.titleEn : rec.titleJp}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Detail Stats panel */}
          <aside className="series-rail" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Sidebar metadata summary list */}
            <div className="series-facts card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="fact-item" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
                <span className="fact-label" style={{ color: "var(--muted)", fontSize: "11px", textTransform: "uppercase", display: "block" }}>Type</span>
                <span className="fact-value" style={{ fontSize: "13px", fontWeight: "600" }}>{anime.type}</span>
              </div>
              <div className="fact-item" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
                <span className="fact-label" style={{ color: "var(--muted)", fontSize: "11px", textTransform: "uppercase", display: "block" }}>Studios</span>
                <span className="fact-value" style={{ fontSize: "13px", fontWeight: "600", color: "var(--accent)" }}>{anime.studio}</span>
              </div>
              <div className="fact-item" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
                <span className="fact-label" style={{ color: "var(--muted)", fontSize: "11px", textTransform: "uppercase", display: "block" }}>Date Aired</span>
                <span className="fact-value" style={{ fontSize: "13px", fontWeight: "600" }}>{anime.aired}</span>
              </div>
              <div className="fact-item" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
                <span className="fact-label" style={{ color: "var(--muted)", fontSize: "11px", textTransform: "uppercase", display: "block" }}>Status</span>
                <span className="fact-value" style={{ fontSize: "13px", fontWeight: "600" }}>{anime.status}</span>
              </div>
              <div className="fact-item" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
                <span className="fact-label" style={{ color: "var(--muted)", fontSize: "11px", textTransform: "uppercase", display: "block" }}>Genre List</span>
                <div className="fact-genres" style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                  {anime.genres && anime.genres.map((g) => (
                    <Link
                      key={g}
                      to={`/filter?genre=${g}`}
                      className="fact-genre"
                      style={{
                        padding: "2px 6px",
                        background: "var(--bg3)",
                        border: "1px solid var(--border)",
                        fontSize: "11px",
                        color: "var(--text-meta)",
                        textDecoration: "none",
                        borderRadius: "4px"
                      }}
                    >
                      {g}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Related/Seasons panel */}
            {relatedAnime.length > 0 && (
              <div className="series-seasons card" style={{ padding: "16px 20px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted)", marginBottom: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
                  Seasons &amp; Relations
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {relatedAnime.map((rel) => (
                    <Link
                      key={rel.id}
                      to={`/anime/${rel.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "6px",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        background: "var(--bg3)",
                        textDecoration: "none"
                      }}
                    >
                      <img src={rel.poster} alt="" style={{ width: "35px", height: "50px", objectFit: "cover", borderRadius: "4px" }} />
                      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <span className="rel-title" style={{ fontSize: "12px", fontWeight: "600", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "180px" }}>
                          {lang === "en" ? rel.titleEn : rel.titleJp}
                        </span>
                        <span style={{ fontSize: "10px", color: "var(--muted)" }}>{rel.type}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </aside>

      </div>
    </main>
  );
};
export default DetailsPage;
