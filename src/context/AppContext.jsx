import React, { createContext, useContext, useState, useEffect } from "react";
import { animeCatalog } from "../data/animeData";
import { fetchWithRetry } from "../services/api";

const AppContext = createContext();

const generateRandomString = (length) => {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

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

  useEffect(() => {
    const token = localStorage.getItem("weaboo_mal_access_token");
    if (token && !malUser) {
      fetchMalUserData(token);
    }

    // Auto-detect OAuth redirect code parameter
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      exchangeMalCodeForToken(code).then((result) => {
        const cleanUrl = window.location.origin + "/home";
        window.history.replaceState({}, document.title, cleanUrl);
        if (result.success) {
          setShowMalProfileModal(true);
          if (window.location.pathname !== "/home") {
            window.location.href = "/home";
          }
        }
      });
    }
  }, []);

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

  // MAL link methods using official OAuth 2.0 with PKCE
  const initiateMalLogin = () => {
    const verifier = generateRandomString(64);
    localStorage.setItem("weaboo_mal_code_verifier", verifier);
    sessionStorage.setItem("mal_code_verifier", verifier);
    
    const clientId = import.meta.env.VITE_MAL_CLIENT_ID || "";
    const redirectUri = window.location.origin.endsWith('/') ? window.location.origin : `${window.location.origin}/`;
    
    const authUrl = `https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=${clientId}&code_challenge=${verifier}&code_challenge_method=plain&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    window.location.href = authUrl;
  };

  const exchangeMalCodeForToken = async (code) => {
    const verifier = localStorage.getItem("weaboo_mal_code_verifier") || sessionStorage.getItem("mal_code_verifier");
    if (!verifier) {
      return { success: false, error: "PKCE verifier code not found in session storage." };
    }
    
    const clientId = import.meta.env.VITE_MAL_CLIENT_ID || "";
    const clientSecret = import.meta.env.VITE_MAL_CLIENT_SECRET || "";
    const redirectUri = window.location.origin.endsWith('/') ? window.location.origin : `${window.location.origin}/`;
    
    try {
      const res = await fetch("/api/mal-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          code_verifier: verifier,
          redirect_uri: redirectUri
        })
      });
      
      if (!res.ok) {
        const errJson = await res.json();
        return { success: false, error: errJson.error || "Token exchange failed" };
      }
      
      const tokenData = await res.json();
      const access = tokenData.access_token;
      const refresh = tokenData.refresh_token;
      
      localStorage.setItem("weaboo_mal_access_token", access);
      localStorage.setItem("weaboo_mal_refresh_token", refresh);
      
      // Fetch profile and watching stats using the real token
      const profileResult = await fetchMalUserData(access);
      return profileResult;
    } catch (err) {
      console.error("Exchange MAL Token Error:", err);
      return { success: false, error: err.message || "Failed to exchange code for token" };
    }
  };

  const fetchMalUserData = async (accessToken) => {
    const token = accessToken || localStorage.getItem("weaboo_mal_access_token");
    if (!token) return { success: false, error: "No active access token" };
    
    try {
      // 1. Fetch MAL user profile via CORS-free serverless proxy
      const resProfile = await fetch(`/api/mal-proxy?endpoint=${encodeURIComponent("/users/@me?fields=anime_statistics")}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!resProfile.ok) {
        if (resProfile.status === 401) {
          unlinkMalUser();
        }
        return { success: false, error: "Failed to fetch user profile" };
      }
      
      const profile = await resProfile.json();
      
      // 2. Fetch User animelist (watching list) via CORS-free serverless proxy
      const resWatching = await fetch(`/api/mal-proxy?endpoint=${encodeURIComponent("/users/@me/animelist?status=watching&limit=100&fields=list_status")}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      let watchingData = [];
      if (resWatching.ok) {
        const watchingJson = await resWatching.json();
        watchingData = (watchingJson.data || []).map(item => ({
          anime: {
            mal_id: item.node.id,
            title: item.node.title,
            images: {
              jpg: {
                image_url: item.node.main_picture?.large || item.node.main_picture?.medium
              }
            }
          },
          score: item.list_status?.score || 0,
          progress: item.list_status?.num_episodes_watched || 0
        }));
      }
      
      const mappedUser = {
        username: profile.name,
        url: `https://myanimelist.net/profile/${profile.name}`,
        avatar: profile.picture || "https://placehold.co/150/141824/3cd6ff?text=MAL",
        daysWatched: profile.anime_statistics?.num_days_watched || 0,
        meanScore: profile.anime_statistics?.mean_score || 0,
        watchingCount: profile.anime_statistics?.num_items_watching || 0,
        completedCount: profile.anime_statistics?.num_items_completed || 0,
        onHoldCount: profile.anime_statistics?.num_items_on_hold || 0,
        droppedCount: profile.anime_statistics?.num_items_dropped || 0,
        planToWatchCount: profile.anime_statistics?.num_items_plan_to_watch || 0,
        episodesWatched: profile.anime_statistics?.num_episodes || 0,
        totalEntries: profile.anime_statistics?.num_items || 0,
        source: "MyAnimeList (Official)",
        isMocked: false
      };
      
      setMalUser(mappedUser);
      setMalWatching(watchingData);
      return { success: true, user: mappedUser };
    } catch (err) {
      console.error("Fetch MAL user data error:", err);
      return { success: false, error: err.message || "Failed to fetch MAL profile" };
    }
  };

  const unlinkMalUser = () => {
    setMalUser(null);
    setMalWatching([]);
    localStorage.removeItem("weaboo_mal_access_token");
    localStorage.removeItem("weaboo_mal_refresh_token");
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
        initiateMalLogin,
        exchangeMalCodeForToken,
        fetchMalUserData,
        unlinkMalUser,
        syncMalWatchlist
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
