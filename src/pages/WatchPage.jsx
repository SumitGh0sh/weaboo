import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { fetchAnimeDetails, fetchStreamingSources } from "../services/api";
import { animeCatalog } from "../data/animeData";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, Bookmark, ChevronLeft, ChevronRight, MessageSquare, Star } from "lucide-react";
import gsap from "gsap";

export const WatchPage = () => {
  const { id, num } = useParams();
  const navigate = useNavigate();
  const {
    lang,
    toggleWatchlist,
    isInWatchlist,
    updateContinueWatching,
    comments,
    addComment,
    user
  } = useApp();

  const epNum = parseInt(num.replace("ep-", ""), 10) || 1;

  // Live data states
  const [anime, setAnime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Custom Video Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Live streaming states
  const [videoSrc, setVideoSrc] = useState("");
  const [isEmbed, setIsEmbed] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);

  // Settings
  const [selectedServer, setSelectedServer] = useState("server1-sub");
  const [lightsOff, setLightsOff] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [autoSkip, setAutoSkip] = useState(false);

  // Comment fields
  const [commentName, setCommentName] = useState(user ? user.username : "");
  const [commentText, setCommentText] = useState("");

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // 1. Fetch Anime details on mount
  useEffect(() => {
    let active = true;
    const loadDetails = async () => {
      try {
        setIsLoading(true);
        const data = await fetchAnimeDetails(id);
        if (active) {
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
        console.error("Error loading watch page details", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadDetails();
    return () => { active = false; };
  }, [id]);

  // 2. Fetch streaming sources when title or episode changes
  useEffect(() => {
    if (!anime) return;
    let active = true;

    const fetchStreams = async () => {
      try {
        setVideoLoading(true);
        setIsPlaying(false);
        const streamData = await fetchStreamingSources(anime.titleEn, epNum);
        if (active) {
          setVideoSrc(streamData.videoUrl);
          setIsEmbed(streamData.isEmbed);
          updateContinueWatching(anime.id, epNum);
        }
      } catch (err) {
        console.error("Error loading video stream sources", err);
      } finally {
        if (active) setVideoLoading(false);
      }
    };

    fetchStreams();
    return () => { active = false; };
  }, [anime, epNum, selectedServer]);

  // Video play end handler for Auto-Next
  const handleVideoEnded = () => {
    if (!anime) return;
    const totalEpisodes = anime.episodes ? anime.episodes.length : 0;
    if (autoNext && epNum < totalEpisodes) {
      navigate(`/watch/${anime.id}/ep-${epNum + 1}`);
    } else {
      setIsPlaying(false);
    }
  };

  // Toggle Video Playback
  const togglePlay = () => {
    if (isEmbed || !videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => console.log("Play failed: ", e));
    }
  };

  // Time Updates
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  // Seek Progress
  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value);
    if (!videoRef.current) return;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Volume Changes
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  // Fullscreen controller
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!isFullscreen) {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Handle Fullscreen Event Changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Show/Hide controls overlay on mouse movements
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  // Format Time Display (e.g. 02:45)
  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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

  if (!anime) {
    return (
      <div className="page" style={{ padding: "40px", textAlign: "center" }}>
        <h2>Anime Not Found</h2>
        <Link to="/home" className="btn btn-primary" style={{ marginTop: "20px" }}>Go Home</Link>
      </div>
    );
  }

  const totalEpisodes = anime.episodes ? anime.episodes.length : 0;
  const currentEpisode = anime.episodes ? anime.episodes.find((ep) => ep.num === epNum) : null;

  const servers = [
    { id: "server1-sub", label: "Server 1 (Sub)" },
    { id: "server2-sub", label: "Server 2 (Sub)" },
    ...(anime.dubEps > 0 ? [{ id: "server1-dub", label: "Server 1 (Dub)" }] : [])
  ];

  const watchKey = `${anime.id}-${epNum}`;
  const episodeComments = comments[watchKey] || [];

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const finalName = user ? user.username : (commentName.trim() || "Anonymous");
    addComment(watchKey, finalName, commentText.trim());
    setCommentText("");
  };

  const title = lang === "en" ? anime.titleEn : anime.titleJp;
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="watch-page-container">
      {/* Light box overlay */}
      {lightsOff && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.94)",
            zIndex: 999,
            cursor: "pointer"
          }}
          onClick={() => setLightsOff(false)}
        >
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              color: "white",
              fontSize: "14px",
              fontWeight: "600",
              background: "rgba(255,255,255,0.15)",
              padding: "8px 16px",
              borderRadius: "20px",
              backdropFilter: "blur(4px)"
            }}
          >
            Click anywhere to turn lights back on
          </div>
        </div>
      )}

      <main className="page page-wide watch-page" style={{ position: "relative", zIndex: lightsOff ? 1000 : 1 }}>
        <div className="watch-layout" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: "24px" }} className="watch-grid-split">
            
            {/* Primary player column */}
            <div className="watch-primary" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* custom HTML5 Video Player */}
              <section
                ref={playerContainerRef}
                className="media-box"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => isPlaying && setControlsVisible(false)}
                style={{
                  background: "black",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                  position: "relative"
                }}
              >
                <div className="media-wrap" id="w-player" style={{ position: "relative", paddingTop: "56.25%", background: "black" }}>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%"
                    }}
                  >
                    {videoLoading ? (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--muted)",
                          fontSize: "14px",
                          gap: "12px",
                          background: "var(--bg3)"
                        }}
                      >
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            border: "2px solid var(--border)",
                            borderTopColor: "var(--accent)",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite"
                          }}
                        ></div>
                        <span>Locating streaming sources...</span>
                      </div>
                    ) : currentEpisode ? (
                      isEmbed ? (
                        <iframe
                          src={videoSrc}
                          style={{ width: "100%", height: "100%", border: "none" }}
                          allowFullScreen
                          scrolling="no"
                          title="Stream Player"
                        />
                      ) : (
                        <video
                          ref={videoRef}
                          key={videoSrc}
                          src={videoSrc}
                          autoPlay={autoPlay || autoNext}
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                          onEnded={handleVideoEnded}
                          onClick={togglePlay}
                          style={{ width: "100%", height: "100%", objectFit: "contain", cursor: "pointer" }}
                        />
                      )
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--muted)",
                          fontSize: "16px",
                          fontWeight: "600"
                        }}
                      >
                        No streaming source available.
                      </div>
                    )}
                  </div>

                  {/* 1. Large play/pause center trigger on hover (Only for video elements, not embeds) */}
                  {!isPlaying && currentEpisode && !videoLoading && !isEmbed && (
                    <div
                      onClick={togglePlay}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "68px",
                        height: "68px",
                        borderRadius: "50%",
                        background: "hsl(192 100% 52% / 0.85)",
                        boxShadow: "0 0 20px hsl(192 100% 52% / 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        cursor: "pointer",
                        zIndex: 5,
                        transition: "all 0.2s ease"
                      }}
                      className="hover:scale-110"
                    >
                      <Play fill="white" size={32} />
                    </div>
                  )}

                  {/* 2. Custom Player Controls Panel overlay */}
                  {currentEpisode && !videoLoading && !isEmbed && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        width: "100%",
                        padding: "24px 16px 14px",
                        background: "linear-gradient(to top, rgba(9,7,14,0.95) 0%, rgba(9,7,14,0.7) 60%, transparent 100%)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        opacity: controlsVisible ? 1 : 0,
                        visibility: controlsVisible ? "visible" : "hidden",
                        transition: "opacity 0.3s ease, visibility 0.3s ease",
                        zIndex: 10
                      }}
                    >
                      {/* Timeline progress slider matching shadcn style */}
                      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                        <input
                          type="range"
                          min="0"
                          max={duration || 100}
                          value={currentTime}
                          onChange={handleProgressChange}
                          style={{
                            width: "100%",
                            height: "5px",
                            borderRadius: "4px",
                            outline: "none",
                            cursor: "pointer",
                            background: `linear-gradient(to right, var(--accent) ${progressPercent}%, rgba(255,255,255,0.15) ${progressPercent}%)`,
                            WebkitAppearance: "none",
                            appearance: "none"
                          }}
                          className="video-progress-slider"
                        />
                      </div>

                      {/* Control buttons layer */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          {/* Play/Pause icon toggle */}
                          <button
                            type="button"
                            onClick={togglePlay}
                            style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}
                          >
                            {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                          </button>

                          {/* Skip 10s button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (videoRef.current) videoRef.current.currentTime = Math.max(0, currentTime - 10);
                            }}
                            style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center" }}
                            title="Rewind 10s"
                          >
                            <RotateCcw size={18} />
                          </button>

                          {/* Volume controls */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={toggleMute}
                              style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}
                            >
                              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={isMuted ? 0 : volume}
                              onChange={handleVolumeChange}
                              style={{
                                width: "60px",
                                height: "4px",
                                borderRadius: "2px",
                                background: `linear-gradient(to right, white ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%)`,
                                WebkitAppearance: "none",
                                appearance: "none",
                                outline: "none",
                                cursor: "pointer"
                              }}
                            />
                          </div>

                          {/* Timer indicators */}
                          <div style={{ fontSize: "12px", color: "var(--text-meta)", fontFamily: "var(--font-mono)" }}>
                            <span>{formatTime(currentTime)}</span>
                            <span style={{ margin: "0 4px" }}>/</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          {/* Fullscreen icon */}
                          <button
                            type="button"
                            onClick={toggleFullscreen}
                            style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}
                            title="Fullscreen"
                          >
                            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* Media checkboxes controllers panel */}
                <div className="media-controls" style={{ display: "flex", flexWrap: "wrap", gap: "10px", padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--bg2)", fontSize: "12px", alignItems: "center" }}>
                  <button
                    type="button"
                    className={`ctrl ${autoPlay ? "on" : ""}`}
                    onClick={() => setAutoPlay(!autoPlay)}
                    style={{ background: "none", border: "none", color: autoPlay ? "var(--accent)" : "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <i className={autoPlay ? "fa-solid fa-check" : "fa-regular fa-square"}></i> Auto Play
                  </button>
                  <button
                    type="button"
                    className={`ctrl ${autoNext ? "on" : ""}`}
                    onClick={() => setAutoNext(!autoNext)}
                    style={{ background: "none", border: "none", color: autoNext ? "var(--accent)" : "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <i className={autoNext ? "fa-solid fa-check" : "fa-regular fa-square"}></i> Auto Next
                  </button>
                  <button
                    type="button"
                    className={`ctrl ${autoSkip ? "on" : ""}`}
                    onClick={() => setAutoSkip(!autoSkip)}
                    style={{ background: "none", border: "none", color: autoSkip ? "var(--accent)" : "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <i className={autoSkip ? "fa-solid fa-check" : "fa-regular fa-square"}></i> Auto Skip
                  </button>
                  <button
                    type="button"
                    className="ctrl"
                    onClick={() => setLightsOff(!lightsOff)}
                    style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <i className="fa-regular fa-lightbulb"></i> Light
                  </button>

                  <button
                    type="button"
                    className="ctrl"
                    onClick={() => toggleWatchlist(anime.id)}
                    style={{ background: "none", border: "none", color: isInWatchlist(anime.id) ? "var(--accent)" : "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", marginLeft: "auto" }}
                  >
                    <Bookmark size={14} style={{ fill: isInWatchlist(anime.id) ? "var(--accent)" : "none" }} />
                    <span>{isInWatchlist(anime.id) ? "Bookmarked" : "Bookmark"}</span>
                  </button>

                  <button
                    type="button"
                    className="ctrl"
                    disabled={epNum <= 1}
                    onClick={() => navigate(`/watch/${anime.id}/ep-${epNum - 1}`)}
                    style={{ background: "none", border: "none", color: epNum <= 1 ? "var(--border)" : "var(--text)", cursor: epNum <= 1 ? "default" : "pointer", display: "flex", alignItems: "center" }}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    type="button"
                    className="ctrl"
                    disabled={epNum >= totalEpisodes}
                    onClick={() => navigate(`/watch/${anime.id}/ep-${epNum + 1}`)}
                    style={{ background: "none", border: "none", color: epNum >= totalEpisodes ? "var(--border)" : "var(--text)", cursor: epNum >= totalEpisodes ? "default" : "pointer", display: "flex", alignItems: "center" }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>

                {/* Server selectors node list */}
                <div className="player-server-host" style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--bg3)", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: "700", color: "var(--muted)", letterSpacing: "0.08em", marginRight: "10px" }}>Servers:</span>
                  {servers.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`btn btn-ghost ${selectedServer === s.id ? "active" : ""}`}
                      onClick={() => setSelectedServer(s.id)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background: selectedServer === s.id ? "var(--accent)" : "var(--bg2)",
                        color: selectedServer === s.id ? "hsl(220 25% 5%)" : "var(--text)",
                        borderColor: selectedServer === s.id ? "var(--accent)" : "var(--border)",
                        borderRadius: "4px"
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Share banner below player */}
              <div className="card share-banner watch-share">
                <div className="share-banner__inner">
                  <div className="share-banner__info">
                    <img className="share-banner__gif" src="/logo.png" alt="" width="38" height="38" onError={(e) => { e.target.style.display = "none"; }} />
                    <div className="share-banner__text">
                      <strong className="share-banner__title">Enjoying this anime?</strong>
                      <span className="share-banner__sub">Share with friends</span>
                    </div>
                  </div>
                  <div className="share-banner__buttons">
                    <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => alert("Link copied!")}>Copy URL</button>
                  </div>
                </div>
              </div>

              {/* Detailed info metadata info card */}
              <section id="media-info" className="media-info card" style={{ padding: "20px", display: "flex", gap: "20px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
                <div className="media-info-poster" style={{ width: "90px", height: "130px", flexShrink: 0, overflow: "hidden", borderRadius: "6px" }}>
                  <img src={anime.poster} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div className="media-info-body" style={{ flexGrow: 1 }}>
                  {anime.nativeName && <p className="media-jp" style={{ color: "var(--muted)", fontSize: "12px", margin: "0 0 2px" }}>{anime.nativeName}</p>}
                  <h1 className="media-title" style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 8px" }}>
                    <Link to={`/anime/${anime.id}`} style={{ color: "var(--text)" }}>{title}</Link>
                  </h1>
                  <div className="media-badges" style={{ display: "flex", flexWrap: "wrap", gap: "6px", fontSize: "11px", marginBottom: "12px" }}>
                    <span className="mini-badge" style={{ background: "var(--bg3)", padding: "2px 6px", border: "1px solid var(--border)" }}>{anime.type}</span>
                    <span className="mini-badge" style={{ background: "var(--bg3)", padding: "2px 6px", border: "1px solid var(--border)" }}>PG-13</span>
                    <span className="mini-badge accent" style={{ background: "rgba(255, 45, 131, 0.12)", color: "var(--accent)", padding: "2px 6px", border: "1px solid rgba(255, 45, 131, 0.25)" }}>HD</span>
                    {anime.subEps > 0 && <span className="mini-badge" style={{ background: "var(--bg3)", padding: "2px 6px", border: "1px solid var(--border)" }}><i className="fa-solid fa-closed-captioning"></i> Sub {anime.subEps}</span>}
                    {anime.dubEps > 0 && <span className="mini-badge" style={{ background: "var(--bg3)", padding: "2px 6px", border: "1px solid var(--border)" }}><i className="fa-solid fa-microphone"></i> Dub {anime.dubEps}</span>}
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-label)", lineHeight: "1.5" }}>{anime.synopsis}</p>
                </div>
              </section>

              {/* Comments Roster */}
              <section className="watch-comments card" style={{ padding: "20px" }}>
                <h2 className="watch-panel-title" style={{ fontSize: "16px", fontWeight: "700", borderBottom: "1px solid var(--border)", paddingBottom: "10px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <MessageSquare size={18} />
                  <span>Comments</span>
                  <span className="watch-comments-ep" style={{ color: "var(--accent)", fontSize: "13px", fontWeight: "500" }}>{`[Episode ${epNum}]`}</span>
                </h2>
                
                {/* Add Comment Form */}
                <form onSubmit={handleCommentSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  {!user && (
                    <input
                      type="text"
                      placeholder="Your Name (optional)"
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        background: "var(--bg3)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        fontSize: "13px",
                        maxWidth: "200px",
                        borderRadius: "6px"
                      }}
                    />
                  )}
                  <textarea
                    placeholder="Join the discussion on this episode..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    required
                    style={{
                      padding: "10px 12px",
                      background: "var(--bg3)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      fontSize: "13px",
                      minHeight: "70px",
                      resize: "vertical",
                      width: "100%",
                      borderRadius: "6px"
                    }}
                  />
                  <button className="btn btn-primary" type="submit" style={{ alignSelf: "flex-end", borderRadius: "6px" }}>
                    Submit
                  </button>
                </form>

                {/* Comments List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {episodeComments.length > 0 ? (
                    episodeComments.map((c, idx) => (
                      <div key={idx} style={{ background: "var(--bg3)", padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <strong style={{ color: "var(--accent)", fontSize: "13px" }}>{c.name}</strong>
                          <span style={{ color: "var(--muted)", fontSize: "11px" }}>{c.date}</span>
                        </div>
                        <p style={{ color: "var(--text)", fontSize: "13px", margin: 0 }}>{c.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="muted" style={{ textAlign: "center", padding: "16px 0", fontSize: "13px" }}>Be the first to comment on this episode!</p>
                  )}
                </div>
              </section>

            </div>

            {/* Right rail sidebar column */}
            <aside className="watch-side-rail" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Side rail episodes box list */}
              <section className="watch-episodes-panel card" style={{ padding: "18px 20px" }}>
                <h2 className="watch-panel-title" style={{ fontSize: "14px", fontWeight: "700", borderBottom: "1px solid var(--border)", paddingBottom: "10px", marginBottom: "12px" }}>
                  Episodes
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))",
                    gap: "6px",
                    maxHeight: "350px",
                    overflowY: "auto",
                    paddingRight: "4px"
                  }}
                >
                  {anime.episodes && anime.episodes.map((ep) => {
                    const activeEp = ep.num === epNum;
                    return (
                      <Link
                        key={ep.num}
                        to={`/watch/${anime.id}/ep-${ep.num}`}
                        className="btn btn-ghost"
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          fontWeight: "700",
                          fontSize: "12px",
                          border: "1px solid var(--border)",
                          borderRadius: "4px",
                          background: activeEp ? "var(--accent)" : "transparent",
                          color: activeEp ? "hsl(220 25% 5%)" : "var(--text)",
                          borderColor: activeEp ? "var(--accent)" : "var(--border)"
                        }}
                      >
                        {ep.num}
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* Side Rail recommendations */}
              <section className="reco-section card" style={{ padding: "18px 20px" }}>
                <h2 className="watch-panel-title" style={{ fontSize: "14px", fontWeight: "700", borderBottom: "1px solid var(--border)", paddingBottom: "10px", marginBottom: "12px" }}>
                  Recommended
                </h2>
                <div className="aitem-wrapper mini compact" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {animeCatalog
                    .filter((a) => a.id !== anime.id)
                    .slice(0, 5)
                    .map((a) => (
                      <Link key={a.id} className="aitem tip" to={`/anime/${a.id}`} style={{ display: "flex", gap: "10px", textDecoration: "none" }}>
                        <img src={a.poster} alt="" style={{ width: "40px", height: "55px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <h6 style={{ fontSize: "12px", fontWeight: "600", color: "var(--text)", margin: "0 0 2px" }}>
                            {lang === "en" ? a.titleEn : a.titleJp}
                          </h6>
                          <div style={{ color: "var(--muted)", fontSize: "10px", display: "flex", gap: "4px", alignItems: "center" }}>
                            <span>{a.type}</span>
                            <span>•</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><Star size={8} fill="var(--accent)" stroke="none" /> {a.malScore}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </section>

            </aside>
            
          </div>

        </div>
      </main>
    </div>
  );
};
export default WatchPage;
