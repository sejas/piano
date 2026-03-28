import { useState, useMemo } from "react";
import type { Song } from "../../types/music";

interface SongBrowserProps {
  builtInSongs: Song[];
  userSongs: Song[];
  onSelectSong: (song: Song) => void;
  onDeleteUserSong?: (id: string) => void;
}

type Tab = "browse" | "my-songs";

export function SongBrowser({
  builtInSongs,
  userSongs,
  onSelectSong,
  onDeleteUserSong,
}: SongBrowserProps) {
  const [tab, setTab] = useState<Tab>("browse");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(
      builtInSongs.map((s) => s.category).filter(Boolean) as string[],
    );
    return Array.from(cats).sort();
  }, [builtInSongs]);

  const filteredSongs = useMemo(() => {
    const songs = tab === "browse" ? builtInSongs : userSongs;
    return songs.filter((song) => {
      const matchesSearch =
        !search || song.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || song.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [tab, builtInSongs, userSongs, search, category]);

  const difficultyStars = (d?: number) => "⭐".repeat(d || 1);

  return (
    <div style={{ padding: 16 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setTab("browse")}
          style={{
            background: "none",
            border: "none",
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: tab === "browse" ? "bold" : "normal",
            borderBottom:
              tab === "browse" ? "2px solid #333" : "2px solid transparent",
          }}
        >
          Browse Songs
        </button>
        <button
          onClick={() => setTab("my-songs")}
          style={{
            background: "none",
            border: "none",
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: tab === "my-songs" ? "bold" : "normal",
            borderBottom:
              tab === "my-songs" ? "2px solid #333" : "2px solid transparent",
          }}
        >
          My Partituras ({userSongs.length})
        </button>
      </div>

      {/* Search + filters */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search songs..."
          style={{
            flex: 1,
            minWidth: 200,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            outline: "none",
          }}
        />
        {tab === "browse" && (
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => setCategory(null)}
              style={{
                padding: "4px 12px",
                borderRadius: 16,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                background: !category ? "#333" : "#f0f0f0",
                color: !category ? "white" : "#333",
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === category ? null : cat)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 16,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  background: cat === category ? "#333" : "#f0f0f0",
                  color: cat === category ? "white" : "#333",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Song cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 12,
        }}
      >
        {filteredSongs.map((song) => (
          <div
            key={song.id}
            onClick={() => onSelectSong(song)}
            style={{
              padding: 16,
              border: "1px solid #eee",
              borderRadius: 12,
              cursor: "pointer",
              transition: "box-shadow 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
          >
            <h3 style={{ margin: 0, fontSize: 16 }}>{song.title}</h3>
            {song.author && (
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
                {song.author}
              </p>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              {song.category && (
                <span style={{ fontSize: 12, color: "#666" }}>
                  {song.category}
                </span>
              )}
              {song.difficulty && (
                <span style={{ fontSize: 12 }}>
                  {difficultyStars(song.difficulty)}
                </span>
              )}
            </div>
            {tab === "my-songs" && onDeleteUserSong && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteUserSong(song.id);
                }}
                style={{
                  marginTop: 8,
                  padding: "2px 8px",
                  fontSize: 12,
                  color: "#e74c3c",
                  border: "1px solid #e74c3c",
                  borderRadius: 4,
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      {filteredSongs.length === 0 && (
        <div style={{ textAlign: "center", color: "#999", padding: 40 }}>
          {tab === "my-songs"
            ? "No saved partituras yet. Create one in the editor!"
            : "No songs match your search."}
        </div>
      )}
    </div>
  );
}
