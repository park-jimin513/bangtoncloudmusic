import {
  FaFire,
  FaCompactDisc,
  FaUserAlt,
  FaListUl,
  FaCog,
  FaSearch,
  FaPlay,
  FaPause,
  FaForward,
  FaBackward,
  FaVolumeUp,
  FaVolumeMute,
  FaHeart,
  FaDownload,
  FaArrowLeft,
} from "react-icons/fa";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE } from "./api";
// Use Vite env var or localhost fallback (do NOT import API_BASE from App if it's not exported)
// const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
import "./UserDashboard.css";

export default function UserDashboard({ user, onLogout }) {
  // ...existing UI state...
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [songs, setSongs] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);

  // track actually playing song by id so UI filters/changes do not stop or switch playback
  const [playingSongId, setPlayingSongId] = useState(null);

  // Favorites / Downloads / other state...
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [downloads, setDownloads] = useState(() => {
    const saved = localStorage.getItem("downloads");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [profilePic, setProfilePic] = useState(null);

  const audioRef = useRef(null);

  // Fetch songs
  const fetchSongs = async () => {
    try {
      setLoadingSongs(true);
      setFetchError(null);
      const base = API_BASE;
      const res = await axios.get(`${base}/api/admin/songs`);
      console.log("fetchSongs response:", res);
      setSongs(res.data || []);
      console.log("songs set:", (res.data || []).length);
      setLoadingSongs(false);
    } catch (err) {
      console.error("Error fetching songs:", err);
      setFetchError(err?.message || "Fetch failed");
      setLoadingSongs(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  // Displayed songs logic (unchanged)
  let displayedSongs = [];
  if (activeTab === "favorites") displayedSongs = favorites;
  else if (activeTab === "downloads") displayedSongs = downloads;
  else if (activeTab === "albumSongs") displayedSongs = songs.filter(s => s.album === selectedAlbum);
  else if (activeTab === "artistSongs") displayedSongs = songs.filter(s => s.singer === selectedArtist);
  else displayedSongs = songs.filter((song) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (song.title && song.title.toLowerCase().includes(query)) ||
      (song.singer && song.singer.toLowerCase().includes(query)) ||
      (song.album && song.album.toLowerCase().includes(query)) ||
      (song.language && song.language.toLowerCase().includes(query))
    );
  });

  // derive currently playing song object by id (keeps playback stable across filtering)
  const currentlyPlayingSong = songs.find((s) => (s._id || s.id) === playingSongId) || null;

  // When user clicks a card: set playingSongId and currentIndex (for UI highlight) and start playing
  const playSongAtIndex = (index) => {
    const song = displayedSongs[index];
    if (!song) return;
    setCurrentIndex(index);
    setPlayingSongId(song._id || song.id);
    setIsPlaying(true);
  };

  // helper to get playable URL (fixed)
  const getSongUrl = (song) => {
    const fnameRaw = song.filename || song.fileName || song.path || song.url;
    if (!fnameRaw) return null;
    // full URL already
    if (/^https?:\/\//.test(fnameRaw)) return fnameRaw;

    // normalize and remove leading slashes
    let clean = fnameRaw.replace(/^\/+/, "");

    // If stored value already contains uploads/ don't prefix again.
    // Encode each path segment to preserve slashes and handle spaces
    const encodedPath = clean.split("/").map(encodeURIComponent).join("/");

    if (clean.startsWith("uploads/")) {
      return `${API_BASE.replace(/\/$/, "")}/${encodedPath}`;
    }

    return `${API_BASE.replace(/\/$/, "")}/uploads/${encodedPath}`;
  };

  // Control actual playback when playingSongId or isPlaying changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // if no song selected, pause and clear src
    if (!playingSongId) {
      audio.pause();
      audio.removeAttribute("src");
      setProgress(0);
      setDuration(0);
      setIsPlaying(false);
      return;
    }

    const song = currentlyPlayingSong;
    const url = getSongUrl(song);

    // validate URL (HEAD) before setting src to surface 404/CORS/type problems
    (async () => {
      if (!url) {
        console.warn("No URL for song", song);
        setIsPlaying(false);
        return;
      }

      console.log("Validating audio URL:", url);
      try {
        const head = await fetch(url, { method: "HEAD", mode: "cors" });
        const ct = head.headers.get("content-type") || "";
        console.log("HEAD status:", head.status, "content-type:", ct);
        if (!head.ok || !ct.startsWith("audio")) {
          console.warn("Audio validation failed (status/type)", head.status, ct);
          setIsPlaying(false);
          return;
        }
      } catch (err) {
        console.warn("Audio HEAD request failed:", err);
        setIsPlaying(false);
        return;
      }

      // set src and play/pause
      if (url && audio.src !== url) {
        audio.src = url;
        audio.load();
      }

      if (isPlaying) {
        audio.play().catch((err) => {
          console.warn("Play prevented:", err);
          setIsPlaying(false);
        });
      } else {
        audio.pause();
      }
    })();
  }, [playingSongId, isPlaying, currentlyPlayingSong]);

  // Audio progress / duration listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => setProgress(audio.currentTime || 0);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      // auto next
      handleNext();
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [playingSongId]);

  // keep audio volume in sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // Previous / Next should operate based on currently visible list (if user wants)
  const handleNext = () => {
    // find index of playingSong in displayedSongs; if not found pick next in songs
    const list = displayedSongs.length ? displayedSongs : songs;
    const idx = list.findIndex((s) => (s._id || s.id) === playingSongId);
    let nextIdx = 0;
    if (idx >= 0) nextIdx = idx + 1 < list.length ? idx + 1 : 0;
    const nextSong = list[nextIdx];
    if (nextSong) {
      setPlayingSongId(nextSong._id || nextSong.id);
      setCurrentIndex(nextIdx);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    const list = displayedSongs.length ? displayedSongs : songs;
    const idx = list.findIndex((s) => (s._id || s.id) === playingSongId);
    let prevIdx = 0;
    if (idx >= 0) prevIdx = idx - 1 >= 0 ? idx - 1 : list.length - 1;
    const prevSong = list[prevIdx];
    if (prevSong) {
      setPlayingSongId(prevSong._id || prevSong.id);
      setCurrentIndex(prevIdx);
      setIsPlaying(true);
    }
  };

  // Seek
  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const pct = Number(e.target.value);
    const seekTime = (pct / 100) * duration;
    audio.currentTime = seekTime;
    setProgress(seekTime);
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!playingSongId) return;
    setIsPlaying((p) => !p);
  };

  // Toggle favorite / download handlers unchanged...
  const toggleFavorite = (song) => {
    const songId = song._id || song.id;
    setFavorites((prev) => {
      const exists = prev.find((fav) => (fav._id || fav.id) === songId);
      if (exists) return prev.filter((fav) => (fav._id || fav.id) !== songId);
      return [...prev, song];
    });
  };
  const isFavorite = (song) => {
    const songId = song._id || song.id;
    return favorites.some((fav) => (fav._id || fav.id) === songId);
  };

  const handleDownload = (song) => {
    const url = getSongUrl(song);
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${song.title || "song"}.mp3`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (!downloads.find(d => (d._id || d.id) === (song._id || song.id))) {
      setDownloads([...downloads, song]);
    }
  };

  // Save settings handler (prevents ReferenceError)
  // - prevents default form submit
  // - placeholder for API call / local save
  // - returns user to main/home tab after saving
  const handleSaveSettings = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    try {
      // TODO: replace with real API call if you have one, e.g.:
      // await axios.put(`${API_BASE}/api/users/${user._id}/settings`, { ...settings });
      // Fallback: persist current user object into localStorage (safe no-op if user undefined)
      if (typeof localStorage !== "undefined" && user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
    } catch (err) {
      console.error("Save settings failed:", err);
    }
    // close settings view (uses existing activeTab state)
    setActiveTab("home");
  };

  // IMPORTANT: remove any auto-pausing on navigation/search.
  // (Do NOT setIsPlaying(false) in an effect that watches activeTab/searchQuery)
  // This preserves playback unless user pauses or clicks another song.

  // ...render UI (unchanged) ...
  return (
    <div className={`dashboard-wrapper ${darkMode ? "dark-mode" : ""}`}>
      {/* Header, search, sidebar, main content unchanged - use playSongAtIndex to start songs */}
      <header className="dashboard-header">
        <div className="logo">🎵 BTS Music</div>
        <div className="nav-links">
          <span onClick={() => setActiveTab("home")}>Home</span>
          <span onClick={() => setShowSearch(!showSearch)}>
            <FaSearch style={{ marginRight: "6px" }} /> Browse
          </span>
          <span onClick={() => setActiveTab("myMusic")}>My Music</span>
          <span onClick={() => setActiveTab("settings")}>Settings</span>
          <span onClick={() => setActiveTab("favorites")}>❤️ Favorites ({favorites.length})</span>
          <span onClick={() => setActiveTab("downloads")}>⬇️ Downloads ({downloads.length})</span>
        </div>
        <div className="user-actions">
          <span>{user?.username}</span>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      {showSearch && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search songs, singers, albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <ul>
            <li onClick={() => setActiveTab("trending")}><FaFire /> Trending</li>
            <li onClick={() => setActiveTab("albums")}><FaCompactDisc /> Albums</li>
            <li onClick={() => setActiveTab("artists")}><FaUserAlt /> Artists</li>
            <li onClick={() => setActiveTab("playlists")}><FaListUl /> Playlists</li>
            <li onClick={() => setActiveTab("settings")}><FaCog /> Settings</li>
            <li onClick={() => setActiveTab("favorites")}><FaHeart /> Favorites</li>
            <li onClick={() => setActiveTab("downloads")}><FaDownload /> Downloads</li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="content">
          {/* Home / Trending */}
          {(activeTab === "home" || activeTab === "trending") && (
            <div>
              <h2>🔥 {activeTab === "trending" ? "Trending Songs" : "Latest Songs"}</h2>
              {displayedSongs.length === 0 ? (
                <p className="no-results">No matching songs found.</p>
              ) : (
                <div
                  className="song-grid"
                  style={{ display: "flex", flexWrap: "wrap", gap: 12 }} /* force visible layout if CSS hides it */
                >
                   {displayedSongs.map((song, index) => (
                     <div
                       key={song._id || song.id || index}
                       className={`song-card ${index === currentIndex ? "active" : ""}`}
                       onClick={() => playSongAtIndex(index)}
                     >
                       <h3 className="song-title">{song.title} - {song.singer}</h3>
                       <p className="song-meta">{song.album || "N/A"} • {song.year || "N/A"} • {song.language || "N/A"}</p>
                       <div className="song-actions">
                         <button className={`favorite-btn ${isFavorite(song) ? "active" : ""}`}
                           onClick={(e) => { e.stopPropagation(); toggleFavorite(song); }}><FaHeart /></button>
                         <button className="download-btn"
                           onClick={(e) => { e.stopPropagation(); handleDownload(song); }}><FaDownload /></button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}

          {/* Albums */}
          {activeTab === "albums" && (
            <div>
              <h2>📀 Albums</h2>
              <div className="album-list">
                {[...new Set(songs.map(song => song.album))].map((album, idx) => (
                  <div key={idx} className="album-card" onClick={() => { setActiveTab("albumSongs"); setSelectedAlbum(album); }}>
                    {album || "Unknown Album"}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "albumSongs" && (
            <div>
              <button onClick={() => setActiveTab("albums")} className="back-btn"><FaArrowLeft /> Back</button>
              <h2>📀 {selectedAlbum}</h2>
              <div className="song-grid">
                {displayedSongs.map((song, index) => (
                  <div key={song._id || song.id || index} className={`song-card ${index === currentIndex ? "active" : ""}`}
                    onClick={() => playSongAtIndex(index)}>
                    <h3 className="song-title">{song.title} - {song.singer}</h3>
                    <div className="song-actions">
                      <button className={`favorite-btn ${isFavorite(song) ? "active" : ""}`}
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(song); }}><FaHeart /></button>
                      <button className="download-btn"
                        onClick={(e) => { e.stopPropagation(); handleDownload(song); }}><FaDownload /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Artists */}
          {activeTab === "artists" && (
            <div>
              <h2>🎤 Artists</h2>
              <div className="artist-list">
                {[...new Set(songs.map(song => song.singer))].map((artist, idx) => (
                  <div key={idx} className="artist-card" onClick={() => { setActiveTab("artistSongs"); setSelectedArtist(artist); }}>
                    {artist}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "artistSongs" && (
            <div>
              <button onClick={() => setActiveTab("artists")} className="back-btn"><FaArrowLeft /> Back</button>
              <h2>🎤 {selectedArtist}</h2>
              <div className="song-grid">
                {displayedSongs.map((song, index) => (
                  <div key={song._id || song.id || index} className={`song-card ${index === currentIndex ? "active" : ""}`}
                    onClick={() => playSongAtIndex(index)}>
                    <h3 className="song-title">{song.title} - {song.singer}</h3>
                    <div className="song-actions">
                      <button className={`favorite-btn ${isFavorite(song) ? "active" : ""}`}
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(song); }}><FaHeart /></button>
                      <button className="download-btn"
                        onClick={(e) => { e.stopPropagation(); handleDownload(song); }}><FaDownload /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Playlists */}
          {activeTab === "playlists" && (
            <div>
              <h2>🎧 Playlists</h2>
              <div className="playlist-list">
                {["My Favorites", "Top 10", "Chill Hits"].map((playlist, idx) => (
                  <div key={idx} className="playlist-card" onClick={() => setActiveTab("trending")}>
                    {playlist}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Downloads */}
          {activeTab === "downloads" && (
            <div>
              <h2>⬇️ Downloaded Songs</h2>
              {downloads.length === 0 ? <p>No downloaded songs yet.</p> : (
                <div className="song-grid">
                  {downloads.map((song, index) => (
                    <div key={song._id || song.id || index} className={`song-card ${index === currentIndex ? "active" : ""}`}
                      onClick={() => playSongAtIndex(index)}>
                      <h3 className="song-title">{song.title} - {song.singer}</h3>
                      <div className="song-actions">
                        <button className={`favorite-btn ${isFavorite(song) ? "active" : ""}`}
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(song); }}><FaHeart /></button>
                        <button className="download-btn"
                          onClick={(e) => { e.stopPropagation(); handleDownload(song); }}><FaDownload /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Favorites */}
          {activeTab === "favorites" && (
            <div>
              <h2>❤️ My Favorites</h2>
              {favorites.length === 0 ? (
                <p>No favorites yet. Add some songs to your favorites!</p>
              ) : (
                <div className="song-grid">
                  {favorites.map((song, index) => (
                    <div key={song._id || song.id || index} className={`song-card ${index === currentIndex ? "active" : ""}`}
                      onClick={() => playSongAtIndex(index)}>
                      <h3 className="song-title">{song.title} - {song.singer}</h3>
                      <div className="song-actions">
                        <button className={`favorite-btn ${isFavorite(song) ? "active" : ""}`}
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(song); }}><FaHeart /></button>
                        <button className="download-btn"
                          onClick={(e) => { e.stopPropagation(); handleDownload(song); }}><FaDownload /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div>
              <h2>⚙️ Settings</h2>
              <label>
                Dark Mode:
                <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
              </label>
              <div className="settings-form">
                <label>
                  Username:
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                </label>
                <label>
                  Password:
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </label>
                <label>
                  Profile Picture:
                  <input type="file" onChange={(e) => setProfilePic(e.target.files[0])} />
                </label>
                <button onClick={handleSaveSettings}>Save Settings</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Audio Player */}
      {playingSongId && currentlyPlayingSong && (
        <div className="audio-player-bar">
          <audio ref={audioRef} />
          <div className="audio-track-info">{currentlyPlayingSong.title} – {currentlyPlayingSong.singer}</div>
          <div className="audio-controls">
            <button onClick={handlePrev}><FaBackward /></button>
            <button onClick={togglePlay}>{isPlaying ? <FaPause /> : <FaPlay />}</button>
            <button onClick={handleNext}><FaForward /></button>
            <button onClick={() => handleDownload(currentlyPlayingSong)}><FaDownload /></button>
          </div>
          <div className="audio-progress">
            <input
              type="range"
              min="0"
              max="100"
              value={duration ? Math.round((progress / duration) * 100) : 0}
              onChange={handleSeek}
            />
          </div>
          <div className="audio-volume">
            <button onClick={() => setMuted(!muted)}>{muted ? <FaVolumeMute /> : <FaVolumeUp />}</button>
            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} />
          </div>
        </div>
      )}

      <footer className="dashboard-footer">© 2025 BTS Music. All rights reserved.</footer>
    </div>
  );
}