import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { fetchTrending, fetchPopular, fetchSearch } from "../services/api";
import { animeCatalog } from "../data/animeData";
import gsap from "gsap";

export const HomePage = () => {
  const { lang, watchlist, toggleWatchlist, isInWatchlist, continueWatching } = useApp();
  const navigate = useNavigate();

  // Carousel slider state
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  // Live data states
  const [featuredAnime, setFeaturedAnime] = useState([]);
  const [popularList, setPopularList] = useState([]);
  const [latestList, setLatestList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Latest Episode filter tab: "all" | "sub" | "dub" | "trending"
  const [latestTab, setLatestTab] = useState("all");
  const [latestPage, setLatestPage] = useState(0);
  const itemsPerPage = 6;

  const carouselRef = useRef(null);

  // Load live data from Jikan with safe fallbacks
  useEffect(() => {
    let active = true;
    const loadHomeData = async () => {
      try {
        setIsLoading(true);
        const [trending, pop, latest] = await Promise.all([
          fetchTrending(),
          fetchPopular(),
          fetchSearch({ page: 1 })
        ]);
        if (active) {
          const finalTrending = trending && trending.length > 0 ? trending.slice(0, 5) : animeCatalog.slice(0, 5);
          const finalPopular = pop && pop.length > 0 ? pop.slice(0, 7) : [...animeCatalog].sort((a, b) => parseFloat(b.malScore) - parseFloat(a.malScore)).slice(0, 7);
          const finalLatest = latest && latest.length > 0 ? latest : animeCatalog;

          setFeaturedAnime(finalTrending);
          setPopularList(finalPopular);
          setLatestList(finalLatest);
        }
      } catch (err) {
        console.error("Error fetching home data", err);
        if (active) {
          setFeaturedAnime(animeCatalog.slice(0, 5));
          setPopularList([...animeCatalog].sort((a, b) => parseFloat(b.malScore) - parseFloat(a.malScore)).slice(0, 7));
          setLatestList(animeCatalog);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadHomeData();
    return () => { active = false; };
  }, []);

  // Carousel Autoplay
  useEffect(() => {
    if (featuredAnime.length === 0) return;
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % featuredAnime.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredAnime]);

  // GSAP - Slide Change Animation
  useEffect(() => {
    if (!carouselRef.current || featuredAnime.length === 0) return;
    
    const activeSlide = carouselRef.current.querySelector(".hero-slide.active");
    if (activeSlide) {
      gsap.fromTo(
        activeSlide.querySelector(".hero-slide__title"),
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
      gsap.fromTo(
        activeSlide.querySelector(".hero-slide__meta"),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, delay: 0.15, ease: "power3.out" }
      );
      gsap.fromTo(
        activeSlide.querySelector(".hero-slide__synopsis"),
        { opacity: 0 },
        { opacity: 1, duration: 1, delay: 0.3, ease: "power2.out" }
      );
      gsap.fromTo(
        activeSlide.querySelector(".btn"),
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, duration: 0.5, delay: 0.45, ease: "back.out(1.5)" }
      );
    }
  }, [carouselIndex, featuredAnime]);

  // GSAP - Grid Card Entrance Animation
  useEffect(() => {
    if (latestList.length === 0) return;
    gsap.fromTo(
      "#latest-grid .item",
      { opacity: 0, y: 40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.05, ease: "power2.out" }
    );
  }, [latestTab, latestPage, latestList]);

  // Filter shows for Latest Episodes
  const getLatestEpisodes = () => {
    let list = [...latestList];
    if (latestTab === "sub") {
      list = list.filter((a) => a.subEps > 0);
    } else if (latestTab === "dub") {
      list = list.filter((a) => a.dubEps > 0);
    } else if (latestTab === "trending") {
      list = [...list].sort((a, b) => parseFloat(b.malScore) - parseFloat(a.malScore));
    }
    return list;
  };

  const latestListFiltered = getLatestEpisodes();
  const pageCount = Math.ceil(latestListFiltered.length / itemsPerPage);
  const paginatedLatest = latestListFiltered.slice(
    latestPage * itemsPerPage,
    (latestPage + 1) * itemsPerPage
  );

  // Upcoming list from static local backup
  const upcomingList = animeCatalog.filter((a) => a.status === "Currently Airing").slice(0, 6);

  const handleNextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % featuredAnime.length);
  };

  const handlePrevSlide = () => {
    setCarouselIndex((prev) => (prev - 1 + featuredAnime.length) % featuredAnime.length);
  };

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

  return (
    <div className="home-page-container">
      
      {/* 1. Hero Banners Carousel (Full width above the columns grid) */}
      {featuredAnime.length > 0 && (
        <section className="hero" aria-label="Featured anime" ref={carouselRef}>
          <div className="hero-track">
            {featuredAnime.map((anime, index) => {
              const activeClass = index === carouselIndex ? "active" : "";
              return (
                <div key={anime.id} className={`hero-slide ${activeClass}`}>
                  <div
                    className="hero-slide__bg"
                    style={{ backgroundImage: `url('${anime.banner}')` }}
                  ></div>
                  <div className="hero-slide__shade"></div>
                  <div className="hero-slide__content">
                    <div className="page page-wide">
                      <div className="hero-slide__info">
                        <h2 className="hero-slide__title d-title">
                          {lang === "en" ? anime.titleEn : anime.titleJp}
                        </h2>
                        <div className="hero-slide__meta">
                          {anime.subEps > 0 && (
                            <span className="hero-badge sub">
                              <i className="fa-solid fa-closed-captioning"></i> {anime.subEps}
                            </span>
                          )}
                          {anime.dubEps > 0 && (
                            <span className="hero-badge dub">
                              <i className="fa-solid fa-microphone"></i> {anime.dubEps}
                            </span>
                          )}
                          <span className="hero-badge">{anime.type}</span>
                        </div>
                        <p className="hero-slide__synopsis">
                          {anime.synopsis.slice(0, 160)}...
                        </p>
                        <RouterLink to={`/watch/${anime.id}/ep-1`} className="btn btn-primary">
                          Watch now
                        </RouterLink>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hero-dots">
            {featuredAnime.map((_, index) => (
              <button
                key={index}
                className={`hero-dot ${index === carouselIndex ? "active" : ""}`}
                onClick={() => setCarouselIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              ></button>
            ))}
          </div>

          <div className="hero-nav">
            <button type="button" className="hero-arrow" id="hero-prev" onClick={handlePrevSlide}>
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button type="button" className="hero-arrow" id="hero-next" onClick={handleNextSlide}>
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </section>
      )}

      {/* 2. Page Content Split Layout (Uses stylesheet column divisions) */}
      <div className="home-layout">
        
        {/* Main Feed Column (Left Grid Side) */}
        <div className="home-main" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          {/* Domain notice banner */}
          {!noticeDismissed && (
            <div className="alert alert-ok home-bookmark-alert site-notice site-notice--home is-dismissible" role="status" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="home-bookmark-alert__body">
                <i className="fa-solid fa-bookmark" aria-hidden="true" style={{ marginRight: "8px" }}></i>
                <span>Bookmark Weaboo.to to stay updated about our domains.</span>
              </div>
              <button
                type="button"
                className="home-bookmark-alert__close site-notice__close"
                onClick={() => setNoticeDismissed(true)}
                aria-label="Dismiss"
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
              >
                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </div>
          )}

          {/* Share Banner */}
          <div className="card share-banner">
            <div className="share-banner__inner">
              <div className="share-banner__info">
                <img
                  className="share-banner__gif"
                  src="/logo.png"
                  alt=""
                  width="38"
                  height="38"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <div className="share-banner__text">
                  <strong className="share-banner__title">Enjoying the site?</strong>
                  <span className="share-banner__sub">Share with friends</span>
                </div>
              </div>
              <div className="share-banner__buttons" style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => alert("Copied link to clipboard!")}>
                  <i className="fa-solid fa-link"></i> Copy Link
                </button>
              </div>
            </div>
          </div>

          {/* Continue Watching Section (only if history exists) */}
          {continueWatching.length > 0 && (
            <section className="stream-section">
              <div className="section-head">
                <h2>Continue Watching</h2>
              </div>
              <div className="ani items" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                {continueWatching.map((item) => (
                  <div key={item.id} className="item">
                    <div className="ani poster">
                      <RouterLink to={`/watch/${item.id}/ep-${item.epNum}`}>
                        <img src={item.poster} alt={lang === "en" ? item.titleEn : item.titleJp} />
                        <div className="meta">
                          <div className="inner">
                            <div className="left">
                              <span className="ep-status sub" title={`Episode ${item.epNum}`}>
                                <span>Ep {item.epNum}</span>
                              </span>
                            </div>
                            <div className="right">
                              {animeCatalog.find((a) => a.id === item.id)?.type || "TV"}
                            </div>
                          </div>
                        </div>
                      </RouterLink>
                    </div>
                    <div className="info">
                      <RouterLink className="name d-title" to={`/watch/${item.id}/ep-${item.epNum}`}>
                        {lang === "en" ? item.titleEn : item.titleJp}
                      </RouterLink>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Latest Episode Grid */}
          <section className="stream-section">
            <div className="section-head" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
              <h2>Latest Episode</h2>
              <div className="section-head-right" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div className="section-tabs" style={{ display: "flex", gap: "4px" }}>
                  {["all", "sub", "dub", "trending"].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={latestTab === tab ? "active" : ""}
                      onClick={() => { setLatestTab(tab); setLatestPage(0); }}
                      style={{
                        background: latestTab === tab ? "var(--accent)" : "var(--bg2)",
                        color: latestTab === tab ? "hsl(220 25% 5%)" : "var(--muted)",
                        border: "1px solid var(--border)",
                        padding: "4px 10px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        textTransform: "capitalize"
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="section-paging" style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    className={`page-prev ${latestPage === 0 ? "disabled" : ""}`}
                    onClick={() => setLatestPage((p) => Math.max(0, p - 1))}
                    disabled={latestPage === 0}
                  >
                    <i className="fa-solid fa-angle-left"></i>
                  </button>
                  <button
                    type="button"
                    className={`page-next ${latestPage >= pageCount - 1 ? "disabled" : ""}`}
                    onClick={() => setLatestPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={latestPage >= pageCount - 1}
                  >
                    <i className="fa-solid fa-angle-right"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid cards */}
            <div className="ani items" id="latest-grid">
              {paginatedLatest.map((anime) => (
                <div key={anime.id} className="item">
                  <div className="ani poster">
                    <div className="poster-actions">
                      <RouterLink to={`/anime/${anime.id}`} className="card-act card-act--info" aria-label="Anime info" style={{ display: "grid", placeItems: "center" }}>
                        <i className="fa-solid fa-circle-info"></i>
                      </RouterLink>
                      <button
                        type="button"
                        className="card-act card-act--list"
                        onClick={() => toggleWatchlist(anime.id)}
                        aria-label="Add to list"
                      >
                        <i className={`fa-solid ${isInWatchlist(anime.id) ? "fa-check" : "fa-plus"}`} style={{ color: isInWatchlist(anime.id) ? "var(--accent)" : "inherit" }}></i>
                      </button>
                    </div>
                    <RouterLink to={`/watch/${anime.id}/ep-1`}>
                      <img src={anime.poster} alt={lang === "en" ? anime.titleEn : anime.titleJp} />
                      <div className="meta">
                        <div className="inner">
                          <div className="left">
                            {anime.subEps > 0 && <span className="ep-status sub" title="Sub"><span>{anime.subEps}</span></span>}
                            {anime.dubEps > 0 && <span className="ep-status dub" title="Dub"><span>{anime.dubEps}</span></span>}
                          </div>
                          <div className="right">{anime.type}</div>
                        </div>
                      </div>
                    </RouterLink>
                  </div>
                  <div className="info">
                    <RouterLink className="name d-title" to={`/anime/${anime.id}`}>
                      {lang === "en" ? anime.titleEn : anime.titleJp}
                    </RouterLink>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Anime Grid */}
          <section className="stream-section" id="upcoming-anime">
            <div className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2>Upcoming Anime</h2>
              <RouterLink to="/filter?status=upcoming" className="section-more">
                View more <i className="fa-solid fa-arrow-right"></i>
              </RouterLink>
            </div>
            <div className="ani items">
              {upcomingList.map((anime) => (
                <div key={anime.id} className="item">
                  <div className="ani poster">
                    <div className="poster-actions">
                      <RouterLink to={`/anime/${anime.id}`} className="card-act card-act--info" style={{ display: "grid", placeItems: "center" }}>
                        <i className="fa-solid fa-circle-info"></i>
                      </RouterLink>
                      <button
                        type="button"
                        className="card-act card-act--list"
                        onClick={() => toggleWatchlist(anime.id)}
                      >
                        <i className={`fa-solid ${isInWatchlist(anime.id) ? "fa-check" : "fa-plus"}`}></i>
                      </button>
                    </div>
                    <RouterLink to={`/anime/${anime.id}`}>
                      <img src={anime.poster} alt={lang === "en" ? anime.titleEn : anime.titleJp} />
                      <div className="meta">
                        <div className="inner">
                          <div className="left">
                            <span className="ep-status total"><span>{anime.totalEps} eps</span></span>
                          </div>
                          <div className="right">{anime.type}</div>
                        </div>
                      </div>
                    </RouterLink>
                  </div>
                  <div className="info">
                    <RouterLink className="name d-title" to={`/anime/${anime.id}`}>
                      {lang === "en" ? anime.titleEn : anime.titleJp}
                    </RouterLink>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Popular Column Sticky Sidebar (Right Grid Side) */}
        <aside className="home-sidebar">
          <section className="series-trending card">
            <header className="section-head" style={{ marginBottom: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
              <h2>Most Popular</h2>
            </header>
            <div className="aitem-wrapper mini compact" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {popularList.map((anime, index) => (
                <RouterLink key={anime.id} className="aitem tip" to={`/anime/${anime.id}`} style={{ display: "flex", gap: "12px", textDecoration: "none" }}>
                  <div className="poster" style={{ position: "relative", width: "55px", height: "75px", flexShrink: 0 }}>
                    <img
                      src={anime.poster}
                      alt=""
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: "2px",
                        left: "2px",
                        width: "20px",
                        height: "20px",
                        background: index < 3 ? "var(--accent)" : "rgba(0,0,0,0.6)",
                        color: index < 3 ? "hsl(220 25% 5%)" : "white",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "bold"
                      }}
                    >
                      {index + 1}
                    </span>
                  </div>
                  <div className="detail" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <h6 className="title d-title" style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)", margin: "0 0 4px", lineHeight: "1.3" }}>
                      {lang === "en" ? anime.titleEn : anime.titleJp}
                    </h6>
                    <div className="info" style={{ fontSize: "11px", color: "var(--muted)", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                      {anime.subEps > 0 && <span className="sub"><i className="fa-solid fa-closed-captioning" style={{ marginRight: "3px" }}></i>{anime.subEps}</span>}
                      {anime.dubEps > 0 && <span className="dub"><i className="fa-solid fa-microphone" style={{ marginRight: "3px" }}></i>{anime.dubEps}</span>}
                      <span>{anime.type}</span>
                      <span>{anime.premiered?.split(" ")[1] || "TV"}</span>
                    </div>
                  </div>
                </RouterLink>
              ))}
            </div>
          </section>
        </aside>

      </div>
    </div>
  );
};
export default HomePage;
