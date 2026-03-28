import { SongBrowser } from "../components/SongBrowser/SongBrowser";
import type { Song } from "../types/music";
import builtInSongs from "../data/songs.json";

interface BrowseViewProps {
  userSongs: Song[];
  onSelectSong: (song: Song) => void;
  onDeleteUserSong: (id: string) => void;
}

export function BrowseView({
  userSongs,
  onSelectSong,
  onDeleteUserSong,
}: BrowseViewProps) {
  return (
    <SongBrowser
      builtInSongs={builtInSongs as Song[]}
      userSongs={userSongs}
      onSelectSong={onSelectSong}
      onDeleteUserSong={onDeleteUserSong}
    />
  );
}
