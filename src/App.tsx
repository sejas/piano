import { useCallback, useMemo } from "react";
import { EditorView } from "./views/EditorView";
import { BrowseView } from "./views/BrowseView";
import { SongView } from "./views/SongView";
import { ColorSettings } from "./components/ColorSettings/ColorSettings";
import { DEFAULT_COLORS } from "./constants/colors";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useRouter } from "./hooks/useRouter";
import type { Song, ColorMap } from "./types/music";
import builtInSongs from "./data/songs.json";
import "./App.css";

function App() {
  const { path, params, navigate } = useRouter();
  const [colors, setColors] = useLocalStorage<ColorMap>(
    "partituras:settings",
    DEFAULT_COLORS,
  );
  const [userSongs, setUserSongs] = useLocalStorage<Song[]>(
    "partituras:songs",
    [],
  );

  const allSongs = useMemo(
    () => [...(builtInSongs as Song[]), ...userSongs],
    [userSongs],
  );

  const findSong = useCallback(
    (id: string) => allSongs.find((s) => s.id === id),
    [allSongs],
  );

  const handleSelectSong = useCallback(
    (song: Song) => {
      navigate(`/song/${song.id}`);
    },
    [navigate],
  );

  const handleSave = useCallback(
    (song: Omit<Song, "createdAt" | "updatedAt">) => {
      setUserSongs((prev) => {
        const now = Date.now();
        const existing = prev.find((s) => s.id === song.id);
        if (existing) {
          return prev.map((s) =>
            s.id === song.id ? { ...s, ...song, updatedAt: now } : s,
          );
        }
        return [...prev, { ...song, createdAt: now, updatedAt: now } as Song];
      });
      // Navigate to the song view after saving
      navigate(`/song/${song.id}`);
    },
    [setUserSongs, navigate],
  );

  const handleDeleteUserSong = useCallback(
    (id: string) => {
      setUserSongs((prev) => prev.filter((s) => s.id !== id));
    },
    [setUserSongs],
  );

  // Resolve current song for song/song-edit routes
  const currentSong = params.id ? findSong(params.id) : undefined;

  return (
    <div className="app">
      <nav className="nav">
        <a
          href="/"
          className="nav-title"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          🎹 Piano Partituras
        </a>
        <div className="nav-links">
          <button
            className={`nav-link ${path === "new" ? "active" : ""}`}
            onClick={() => navigate("/new")}
          >
            + New
          </button>
          <button
            className={`nav-link ${path === "browse" ? "active" : ""}`}
            onClick={() => navigate("/")}
          >
            Browse
          </button>
          <button
            className={`nav-link ${path === "settings" ? "active" : ""}`}
            onClick={() => navigate("/settings")}
          >
            Settings
          </button>
        </div>
      </nav>
      <main className="main">
        {path === "browse" && (
          <BrowseView
            userSongs={userSongs}
            onSelectSong={handleSelectSong}
            onDeleteUserSong={handleDeleteUserSong}
          />
        )}
        {path === "new" && <EditorView colors={colors} onSave={handleSave} />}
        {path === "song" &&
          (currentSong ? (
            <SongView
              song={currentSong}
              colors={colors}
              onEdit={() => navigate(`/song/${params.id}/edit`)}
            />
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "#999" }}>
              Song not found.{" "}
              <button
                onClick={() => navigate("/")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8e44ad",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Go to Browse
              </button>
            </div>
          ))}
        {path === "song-edit" &&
          (currentSong ? (
            <EditorView
              key={params.id}
              colors={colors}
              initialTitle={currentSong.title}
              initialNotes={currentSong.notes}
              editingSongId={currentSong.id}
              onSave={handleSave}
            />
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "#999" }}>
              Song not found.{" "}
              <button
                onClick={() => navigate("/")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8e44ad",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Go to Browse
              </button>
            </div>
          ))}
        {path === "settings" && (
          <ColorSettings colors={colors} onChange={setColors} />
        )}
      </main>
    </div>
  );
}

export default App;
