import React, { createContext, useContext, useState, useEffect } from "react";
import { animeCatalog } from "../data/animeData";
import { fetchWithRetry } from "../services/api";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Title language: "en" or "jp"
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("weaboo_lang") || "en";
  });

  // User auth state
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("weaboo_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Watchlist: array of anime IDs
  const [watchlist, setWatchlist] = useState(() => {
    const savedList = localStorage.getItem("weaboo_watchlist");
    return savedList ? JSON.parse(savedList) : [];
  });

  // Continue watching: array of { id, epNum, progressPercent, timestamp }
  const [continueWatching, setContinueWatching] = useState(() => {
    const savedHistory = localStorage.getItem("weaboo_history");
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  // Comments: { [watchId]: Array<{ name, text, date }> }
  const [comments, setComments] = useState(() => {
    const savedComments = localStorage.getItem("weaboo_comments");
    return savedComments ? JSON.parse(savedComments) : {};
  });

  // Sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("ku_sidebar_collapsed") === "1";
  });

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalTab, setLoginModalTab] = useState("login"); // "login", "register", "forgot"

  // MAL profile states
  const [malUser, setMalUser] = useState(() => {
    const saved = localStorage.getItem("weaboo_mal_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [malWatching, setMalWatching] = useState(() => {
    const saved = localStorage.getItem("weaboo_mal_watching");
    return saved ? JSON.parse(saved) : [];
  });
  const [showMalLinkModal, setShowMalLinkModal] = useState(false);
  const [showMalProfileModal, setShowMalProfileModal] = useState(false);

  useEffect(() => {
    localStorage.setItem("weaboo_lang", lang);
  }, [lang]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("weaboo_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("weaboo_user");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("weaboo_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem("weaboo_history", JSON.stringify(continueWatching));
  }, [continueWatching]);

  useEffect(() => {
    localStorage.setItem("weaboo_comments", JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    if (malUser) {
      localStorage.setItem("weaboo_mal_user", JSON.stringify(malUser));
    } else {
      localStorage.removeItem("weaboo_mal_user");
    }
  }, [malUser]);

  useEffect(() => {
    localStorage.setItem("weaboo_mal_watching", JSON.stringify(malWatching));
  }, [malWatching]);

  useEffect(() => {
    localStorage.setItem("ku_sidebar_collapsed", sidebarCollapsed ? "1" : "0");
    if (sidebarCollapsed) {
      document.body.classList.add("sidebar-collapsed");
    } else {
      document.body.classList.remove("sidebar-collapsed");
    }
  }, [sidebarCollapsed]);

  // Watchlist functions
  const toggleWatchlist = (animeId) => {
    setWatchlist((prev) => {
      if (prev.includes(animeId)) {
        return prev.filter((id) => id !== animeId);
      } else {
        return [...prev, animeId];
      }
    });
  };

  const isInWatchlist = (animeId) => watchlist.includes(animeId);

  // Continue Watching functions
  const updateContinueWatching = (animeId, epNum) => {
    const anime = animeCatalog.find((a) => a.id === animeId);
    if (!anime) return;

    setContinueWatching((prev) => {
      const filtered = prev.filter((item) => item.id !== animeId);
      const newItem = {
        id: animeId,
        titleEn: anime.titleEn,
        titleJp: anime.titleJp,
        poster: anime.poster,
        epNum,
        timestamp: Date.now()
      };
      return [newItem, ...filtered].slice(0, 8); // Keep up to 8 items
    });
  };

  // Add Comment function
  const addComment = (watchId, name, text) => {
    setComments((prev) => {
      const episodeComments = prev[watchId] || [];
      const newComment = {
        name,
        text,
        date: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      };
      return {
        ...prev,
        [watchId]: [newComment, ...episodeComments]
      };
    });
  };

  // MAL link methods
  // MAL & AniList hybrid profile link method
  const linkMalUser = async (rawUsername) => {
    const username = rawUsername.trim();
    if (!username) return { success: false, error: "Username cannot be empty" };

    // 1. Try Jikan API v4 for MyAnimeList
    try {
      const resProfile = await fetchWithRetry(`https://api.jikan.moe/v4/users/${encodeURIComponent(username)}/full`);
      
      if (resProfile.ok) {
        const profileJson = await resProfile.json();
        if (profileJson && profileJson.data) {
          const profile = profileJson.data;

          // Fetch watching list
          const resWatching = await fetchWithRetry(`https://api.jikan.moe/v4/users/${encodeURIComponent(username)}/animelist?status=watching`);
          let watchingData = [];
          if (resWatching.ok) {
            const watchingJson = await resWatching.json();
            watchingData = watchingJson.data || [];
          }

          const mappedUser = {
            username: profile.username,
            url: profile.url || `https://myanimelist.net/profile/${profile.username}`,
            avatar: profile.images?.jpg?.image_url || profile.images?.webp?.image_url || "https://placehold.co/150/141824/3cd6ff?text=MAL",
            daysWatched: profile.statistics?.anime?.days_watched || 0,
            meanScore: profile.statistics?.anime?.mean_score || 0,
            watchingCount: profile.statistics?.anime?.watching || 0,
            completedCount: profile.statistics?.anime?.completed || 0,
            onHoldCount: profile.statistics?.anime?.on_hold || 0,
            droppedCount: profile.statistics?.anime?.dropped || 0,
            planToWatchCount: profile.statistics?.anime?.plan_to_watch || 0,
            episodesWatched: profile.statistics?.anime?.episodes_watched || 0,
            totalEntries: profile.statistics?.anime?.total_entries || 0,
            rewatchedCount: profile.statistics?.anime?.rewatched || 0,
            scores: profile.statistics?.anime?.scores || [
              { score: 10, count: 0, percentage: 0 },
              { score: 9, count: 0, percentage: 0 },
              { score: 8, count: 0, percentage: 0 },
              { score: 7, count: 0, percentage: 0 },
              { score: 6, count: 0, percentage: 0 },
              { score: 5, count: 0, percentage: 0 },
              { score: 4, count: 0, percentage: 0 },
              { score: 3, count: 0, percentage: 0 },
              { score: 2, count: 0, percentage: 0 },
              { score: 1, count: 0, percentage: 0 }
            ],
            source: "MyAnimeList",
            isMocked: false
          };

          setMalUser(mappedUser);
          setMalWatching(watchingData);
          return { success: true, source: "MyAnimeList" };
        }
      }
    } catch (jikanErr) {
      console.warn("Jikan v4 API unavailable or limited. Switching to AniList GraphQL fallback...", jikanErr);
    }

    // 2. Try AniList GraphQL API (100% reliable, zero rate limit timeouts)
    try {
      const query = `
        query ($userName: String) {
          MediaListCollection(userName: $userName, type: ANIME) {
            user {
              id
              name
              avatar { large }
              stats {
                watchedTime
              }
            }
            lists {
              name
              status
              entries {
                progress
                score(format: POINT_10)
                media {
                  id
                  idMal
                  title { english romaji native }
                  episodes
                  coverImage { large }
                  format
                  meanScore
                }
              }
            }
          }
        }
      `;

      const resAni = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { userName: username } })
      });

      if (resAni.ok) {
        const aniJson = await resAni.json();
        const collection = aniJson.data?.MediaListCollection;
        if (collection && collection.user) {
          const user = collection.user;
          const lists = collection.lists || [];

          let watchingCount = 0;
          let completedCount = 0;
          let onHoldCount = 0;
          let droppedCount = 0;
          let planToWatchCount = 0;
          let episodesWatched = 0;
          let totalEntries = 0;

          const scoresMap = {};
          for (let i = 1; i <= 10; i++) scoresMap[i] = 0;

          const watchingData = [];

          lists.forEach((list) => {
            const statusName = (list.status || list.name || "").toUpperCase();
            list.entries.forEach((entry) => {
              totalEntries++;
              const eps = entry.progress || 0;
              episodesWatched += eps;

              if (entry.score > 0) {
                const roundedScore = Math.min(10, Math.max(1, Math.round(entry.score)));
                scoresMap[roundedScore] = (scoresMap[roundedScore] || 0) + 1;
              }

              if (statusName.includes("CURRENT") || statusName.includes("WATCHING")) {
                watchingCount++;
                watchingData.push({
                  anime: {
                    mal_id: entry.media?.idMal || entry.media?.id,
                    title: entry.media?.title?.english || entry.media?.title?.romaji || entry.media?.title?.native || "Anime",
                    type: entry.media?.format || "TV",
                    images: {
                      jpg: {
                        image_url: entry.media?.coverImage?.large || "https://placehold.co/200x300/141824/50e3c2?text=Poster"
                      }
                    },
                    url: `https://myanimelist.net/anime/${entry.media?.idMal || entry.media?.id}`
                  },
                  episodes_watched: entry.progress || 0,
                  episodes_total: entry.media?.episodes || 0
                });
              } else if (statusName.includes("COMPLETED")) {
                completedCount++;
              } else if (statusName.includes("PAUSED") || statusName.includes("HOLD")) {
                onHoldCount++;
              } else if (statusName.includes("DROPPED")) {
                droppedCount++;
              } else if (statusName.includes("PLANNING") || statusName.includes("PLAN")) {
                planToWatchCount++;
              }
            });
          });

          const totalScoredEntries = Object.values(scoresMap).reduce((a, b) => a + b, 0);
          let sumScores = 0;
          Object.entries(scoresMap).forEach(([score, cnt]) => {
            sumScores += Number(score) * cnt;
          });
          const meanScore = totalScoredEntries > 0 ? Number((sumScores / totalScoredEntries).toFixed(2)) : 0;
          const daysWatched = user.stats?.watchedTime ? Number((user.stats.watchedTime / 1440).toFixed(1)) : Number(((episodesWatched * 24) / 1440).toFixed(1));

          const scoresArray = [];
          for (let s = 10; s >= 1; s--) {
            const cnt = scoresMap[s] || 0;
            const pct = totalScoredEntries > 0 ? Number(((cnt / totalScoredEntries) * 100).toFixed(1)) : 0;
            scoresArray.push({ score: s, count: cnt, percentage: pct });
          }

          const mappedUser = {
            username: user.name,
            url: `https://anilist.co/user/${user.name}`,
            avatar: user.avatar?.large || "https://placehold.co/150/141824/3cd6ff?text=MAL",
            daysWatched,
            meanScore,
            watchingCount,
            completedCount,
            onHoldCount,
            droppedCount,
            planToWatchCount,
            episodesWatched,
            totalEntries,
            rewatchedCount: 0,
            scores: scoresArray,
            source: "AniList Live API",
            isMocked: false
          };

          setMalUser(mappedUser);
          setMalWatching(watchingData);
          return { success: true, source: "AniList" };
        }
      }
    } catch (aniErr) {
      console.warn("AniList API error:", aniErr);
    }

    return {
      success: false,
      error: `Could not find anime user "${username}". Please verify your username on MyAnimeList or AniList.`
    };
  };

  const unlinkMalUser = () => {
    setMalUser(null);
    setMalWatching([]);
  };

  const syncMalWatchlist = () => {
    if (!malWatching || malWatching.length === 0) return 0;
    let addedCount = 0;
    const newItems = [];

    malWatching.forEach((item) => {
      const title = item.anime?.title?.toLowerCase();
      if (!title) return;

      const match = animeCatalog.find(
        (local) =>
          local.titleEn?.toLowerCase().includes(title) ||
          title?.includes(local.titleEn?.toLowerCase()) ||
          local.titleJp?.toLowerCase().includes(title) ||
          title?.includes(local.titleJp?.toLowerCase())
      );

      if (match && !watchlist.includes(match.id) && !newItems.includes(match.id)) {
        newItems.push(match.id);
        addedCount++;
      }
    });

    if (newItems.length > 0) {
      setWatchlist((prev) => [...prev, ...newItems]);
    }
    return addedCount;
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        user,
        setUser,
        watchlist,
        toggleWatchlist,
        isInWatchlist,
        continueWatching,
        updateContinueWatching,
        comments,
        addComment,
        sidebarCollapsed,
        setSidebarCollapsed,
        showLoginModal,
        setShowLoginModal,
        loginModalTab,
        setLoginModalTab,
        malUser,
        malWatching,
        showMalLinkModal,
        setShowMalLinkModal,
        showMalProfileModal,
        setShowMalProfileModal,
        linkMalUser,
        unlinkMalUser,
        syncMalWatchlist
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
