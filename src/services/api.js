import { animeCatalog } from "../data/animeData";

const JIKAN_BASE = import.meta.env.VITE_JIKAN_BASE || "https://api.jikan.moe/v4";
const CONSUMET_BASE = import.meta.env.VITE_CONSUMET_BASE || "https://api.consumet.org/anime/gogoanime";

// Hardcoded Jikan Genre Name to ID mappings
const GENRE_MAPPINGS = {
  action: 1,
  adventure: 2,
  comedy: 4,
  drama: 8,
  ecchi: 9,
  fantasy: 10,
  horror: 14,
  mystery: 7,
  romance: 22,
  "sci-fi": 24,
  sports: 30,
  supernatural: 37,
  isekai: 62
};

// Helper for delaying requests (Jikan rate limits: 3 req/sec)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// fetchWithRetry wrapper for robust rate-limit handling
export const fetchWithRetry = async (url, options = {}, retries = 3, backoff = 1200) => {
  try {
    const res = await fetch(url, options);
    if (res.status === 429) {
      if (retries > 0) {
        console.warn(`Jikan 429 Rate Limited. Retrying in ${backoff}ms... (${retries} left)`);
        await delay(backoff);
        return fetchWithRetry(url, options, retries - 1, backoff * 1.5);
      }
    }
    return res;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Fetch error. Retrying in ${backoff}ms... (${retries} left)`, error);
      await delay(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 1.5);
    }
    throw error;
  }
};

// Mappings from Jikan structures to Weaboo structures
const mapJikanAnime = (item) => ({
  id: item.mal_id.toString(), // Keep string IDs for route matching
  titleEn: item.title_english || item.title || "Unknown Title",
  titleJp: item.title_japanese || item.title || "Unknown Title",
  synonyms: item.title_synonyms ? item.title_synonyms.join(", ") : "",
  nativeName: item.title_japanese || "",
  type: item.type || "TV",
  subEps: item.episodes || 12,
  dubEps: Math.floor((item.episodes || 12) * 0.8), // Mock dub episodes
  totalEps: item.episodes || 12,
  poster: item.images?.jpg?.image_url || "https://placehold.co/200x300/141824/50e3c2?text=No+Poster",
  banner: item.images?.jpg?.large_image_url || "https://placehold.co/1200x600/141824/50e3c2?text=No+Banner",
  malScore: item.score ? item.score.toString() : "8.0",
  synopsis: item.synopsis || "No description available for this show.",
  status: item.status || "Finished Airing",
  aired: item.aired?.string || "Unknown",
  duration: item.duration || "24 min",
  premiered: item.season && item.year ? `${item.season} ${item.year}` : "N/A",
  studio: item.studios?.[0]?.name || "Unknown Studio",
  producers: item.producers ? item.producers.map((p) => p.name) : ["Unknown Producer"],
  genres: item.genres ? item.genres.map((g) => g.name) : ["Action"],
  schedule: item.broadcast?.day || "Sunday"
});

// 1. Fetch Top Airing Anime (Featured slider)
export const fetchTrending = async () => {
  try {
    const res = await fetchWithRetry(`${JIKAN_BASE}/top/anime?filter=airing&limit=8`);
    if (!res.ok) throw new Error("API Limit reached");
    const data = await res.json();
    return data.data.map(mapJikanAnime);
  } catch (error) {
    console.warn("Jikan API failed. Falling back to local data.", error);
    return animeCatalog.slice(0, 5); // Fallback
  }
};

// 2. Fetch Popular Anime (Sidebar rails)
export const fetchPopular = async () => {
  try {
    const res = await fetchWithRetry(`${JIKAN_BASE}/top/anime?filter=bypopularity&limit=10`);
    if (!res.ok) throw new Error("API Limit reached");
    const data = await res.json();
    return data.data.map(mapJikanAnime);
  } catch (error) {
    console.warn("Jikan API failed. Falling back to popular local data.", error);
    return [...animeCatalog].sort((a, b) => parseFloat(b.malScore) - parseFloat(a.malScore)).slice(0, 7);
  }
};

// 3. Search and Catalog Filters
export const fetchSearch = async (filters = {}) => {
  const { keyword, genre, type, status, letter, page = 1 } = filters;
  
  let queryParts = [`page=${page}`, "limit=24"];

  if (keyword) {
    queryParts.push(`q=${encodeURIComponent(keyword)}`);
  }
  if (genre) {
    const genreId = GENRE_MAPPINGS[genre.toLowerCase()];
    if (genreId) queryParts.push(`genres=${genreId}`);
  }
  if (type) {
    queryParts.push(`type=${type.toLowerCase()}`);
  }
  if (status) {
    // MAL status values: "airing", "complete", "upcoming"
    let malStatus = "complete";
    if (status.toLowerCase().includes("airing") || status.toLowerCase() === "ongoing") malStatus = "airing";
    else if (status.toLowerCase().includes("yet") || status.toLowerCase() === "upcoming") malStatus = "upcoming";
    queryParts.push(`status=${malStatus}`);
  }
  if (letter && letter !== "all") {
    queryParts.push(`letter=${letter}`);
  }

  const queryUrl = `${JIKAN_BASE}/anime?${queryParts.join("&")}`;
  
  try {
    await delay(300); // Prevent hitting Jikan limits too quickly
    const res = await fetchWithRetry(queryUrl);
    if (!res.ok) throw new Error("API Error");
    const data = await res.json();
    return data.data.map(mapJikanAnime);
  } catch (error) {
    console.warn("Jikan search query failed. Filtering local data.", error);
    // Simple local filtering fallback
    let list = [...animeCatalog];
    if (keyword) {
      list = list.filter(a => a.titleEn.toLowerCase().includes(keyword.toLowerCase()));
    }
    if (genre) {
      list = list.filter(a => a.genres.includes(genre));
    }
    return list;
  }
};

// 4. Get Full Anime Details (Full page metadata)
export const fetchAnimeDetails = async (id) => {
  try {
    // If it's a numeric ID, it's likely a real MAL ID
    if (isNaN(parseInt(id, 10))) {
      // Fallback if the route uses mock text IDs like 'solo-leveling-ilh08'
      const matched = animeCatalog.find(a => a.id === id);
      if (matched) return matched;
      throw new Error("Text ID lookup");
    }

    const res = await fetchWithRetry(`${JIKAN_BASE}/anime/${id}`);
    if (!res.ok) throw new Error("Jikan detail error");
    const data = await res.json();
    return mapJikanAnime(data.data);
  } catch (error) {
    console.warn("Jikan details lookup failed. Falling back to local data entry.", error);
    return animeCatalog.find(a => a.id === id) || animeCatalog[0];
  }
};

// 5. Fetch Weekly Schedule Airings
export const fetchWeeklySchedule = async (dayName) => {
  try {
    const malDay = dayName.toLowerCase();
    const res = await fetchWithRetry(`${JIKAN_BASE}/schedules?filter=${malDay}&limit=12`);
    if (!res.ok) throw new Error("Jikan schedule limit");
    const data = await res.json();
    return data.data.map(mapJikanAnime);
  } catch (error) {
    console.warn("Jikan weekly schedule failed. Filtering local data.", error);
    return animeCatalog.filter(a => a.schedule.toLowerCase() === dayName.toLowerCase());
  }
};

// 6. Fetch Video Stream Links (using Consumet)
// Searches Consumet for matched show, then queries sources for requested episode
export const fetchStreamingSources = async (animeTitle, episodeNum) => {
  const defaultVideo = {
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    isEmbed: false
  };

  try {
    // Step 1: Search Gogoanime for title
    const searchRes = await fetch(`${CONSUMET_BASE}/${encodeURIComponent(animeTitle)}`);
    if (!searchRes.ok) throw new Error("Search failed");
    const searchData = await searchRes.json();
    
    if (!searchData.results || searchData.results.length === 0) {
      throw new Error("No search results on Consumet");
    }

    const animeId = searchData.results[0].id; // Pick first result match

    // Step 2: Fetch episodes info list
    const infoRes = await fetch(`${CONSUMET_BASE}/info/${animeId}`);
    if (!infoRes.ok) throw new Error("Info failed");
    const infoData = await infoRes.json();

    if (!infoData.episodes || infoData.episodes.length === 0) {
      throw new Error("No episodes found on Consumet");
    }

    // Match exact episode number
    const episode = infoData.episodes.find((ep) => ep.number === episodeNum) || infoData.episodes[0];
    const episodeId = episode.id;

    // Step 3: Fetch watch streams
    const watchRes = await fetch(`${CONSUMET_BASE}/watch/${episodeId}`);
    if (!watchRes.ok) throw new Error("Watch sources failed");
    const watchData = await watchRes.json();

    // Check for direct video streams (HLS/M3U8) or iframe embeds
    if (watchData.sources && watchData.sources.length > 0) {
      // Find default quality or pick first source file
      const stream = watchData.sources.find(s => s.quality === "default" || s.quality === "720p") || watchData.sources[0];
      return {
        videoUrl: stream.url,
        isEmbed: false
      };
    } else if (watchData.headers && watchData.headers.Referer) {
      // Fallback to iframe embed links if available
      return {
        videoUrl: watchData.headers.Referer,
        isEmbed: true
      };
    }

    return defaultVideo;
  } catch (error) {
    console.warn("Consumet video stream fetch failed. Falling back to default test stream.", error);
    return defaultVideo;
  }
};
