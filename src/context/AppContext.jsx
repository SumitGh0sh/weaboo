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
  const linkMalUser = async (username) => {
    try {
      // 1. Fetch user summary profile
      const resProfile = await fetchWithRetry(`https://api.jikan.moe/v4/users/${encodeURIComponent(username.trim())}`);
      
      if (!resProfile.ok) {
        if (resProfile.status === 404) throw new Error("MAL profile not found");
        
        console.warn(`Jikan profile scraping failed with status ${resProfile.status}. Triggering MAL mock profile fallback.`);
        const mappedUser = {
          username: username.trim(),
          url: `https://myanimelist.net/profile/${encodeURIComponent(username.trim())}`,
          avatar: "https://placehold.co/150/141824/3cd6ff?text=" + username.substring(0, 3).toUpperCase(),
          daysWatched: 63.8, // Fallback stats representing standard data
          meanScore: 8.15,
          watchingCount: 2,
          completedCount: 140,
          onHoldCount: 21,
          droppedCount: 8,
          planToWatchCount: 85,
          episodesWatched: 4805,
          isMocked: true
        };

        const mockWatching = [
          {
            anime: {
              mal_id: 1,
              title: "One Piece",
              images: { jpg: { image_url: "https://cdn.anipixcdn.co/thumbnail/f899139df5e1059396431415e770c6dd.jpg" } }
            },
            episodes_watched: 1152,
            episodes_total: 1200
          },
          {
            anime: {
              mal_id: 2,
              title: "Solo Leveling Season 2: Arise from the Shadow",
              images: { jpg: { image_url: "https://cdn.anipixcdn.co/thumbnail/4b5ed938de41e4ff532c02c27dfd143a.jpg" } }
            },
            episodes_watched: 6,
            episodes_total: 13
          }
        ];

        setMalUser(mappedUser);
        setMalWatching(mockWatching);
        return { success: true, isMocked: true };
      }

      const profileData = await resProfile.json();
      if (!profileData || !profileData.data) throw new Error("Invalid profile response");

      // 2. Fetch watching list
      const resWatching = await fetchWithRetry(`https://api.jikan.moe/v4/users/${encodeURIComponent(username.trim())}/animelist?status=watching`);
      let watchingData = [];
      if (resWatching.ok) {
        const watchingJson = await resWatching.json();
        watchingData = watchingJson.data || [];
      }

      const profile = profileData.data;
      const mappedUser = {
        username: profile.username,
        url: profile.url,
        avatar: profile.images?.jpg?.image_url || "https://placehold.co/150/141824/3cd6ff?text=MAL",
        daysWatched: profile.statistics?.anime?.days_watched || 0,
        meanScore: profile.statistics?.anime?.mean_score || 0,
        watchingCount: profile.statistics?.anime?.watching || 0,
        completedCount: profile.statistics?.anime?.completed || 0,
        onHoldCount: profile.statistics?.anime?.on_hold || 0,
        droppedCount: profile.statistics?.anime?.dropped || 0,
        planToWatchCount: profile.statistics?.anime?.plan_to_watch || 0,
        episodesWatched: profile.statistics?.anime?.episodes_watched || 0,
        isMocked: false
      };

      setMalUser(mappedUser);
      setMalWatching(watchingData);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
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
