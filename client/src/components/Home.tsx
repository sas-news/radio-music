import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaylistStore } from '../stores/playlist';
import { usePlayerStore } from '../stores/player';
import type { Playlist } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const {
    playlists,
    songs,
    selectedPlaylistId,
    isImporting,
    importError,
    loadPlaylists,
    loadSongs,
    importPlaylist,
    syncPlaylist,
    selectPlaylist,
  } = usePlaylistStore();

  const { playQueue } = usePlayerStore();

  const [url, setUrl] = useState('');

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  useEffect(() => {
    if (selectedPlaylistId) {
      loadSongs(selectedPlaylistId);
    }
  }, [selectedPlaylistId, loadSongs]);

  const handleImport = async () => {
    if (!url.trim()) return;
    await importPlaylist(url.trim());
    setUrl('');
  };

  const handleSync = async (playlistId: string) => {
    await syncPlaylist(`https://www.youtube.com/playlist?list=${playlistId}`);
  };

  const handlePlayAll = async (playlist: Playlist) => {
    selectPlaylist(playlist.playlistId);
    await loadSongs(playlist.playlistId);
    const { songs: currentSongs } = usePlaylistStore.getState();
    if (currentSongs.length > 0) {
      playQueue(currentSongs);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">🎵 Radio Music</h1>
        <p className="text-sm text-slate-500 mt-1">AIが選曲するラジオ型ミュージックプレイヤー</p>
      </header>

      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <h2 className="text-sm font-medium text-slate-400 mb-3">YouTubeプレイリストをインポート</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="プレイリストのURLをペースト..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleImport()}
          />
          <button
            onClick={handleImport}
            disabled={isImporting || !url.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            {isImporting ? '読込中...' : 'インポート'}
          </button>
        </div>
        {importError && (
          <p className="text-red-400 text-xs mt-2">{importError}</p>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">プレイリスト一覧</h2>
        {playlists.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <p className="text-4xl mb-3">📂</p>
            <p className="text-sm">プレイリストがまだありません</p>
            <p className="text-xs mt-1">YouTubeのプレイリストURLをインポートしてください</p>
          </div>
        ) : (
          <div className="space-y-2">
            {playlists.map((pl) => (
              <div
                key={pl.playlistId}
                className={`bg-slate-900 rounded-xl p-4 border cursor-pointer transition-colors ${
                  selectedPlaylistId === pl.playlistId
                    ? 'border-blue-500/50 bg-blue-500/5'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {pl.thumbnail && (
                    <img
                      src={pl.thumbnail}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover bg-slate-800 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate text-slate-100 cursor-pointer hover:text-blue-400"
                      onClick={() => navigate(`/playlist/${pl.playlistId}`)}
                    >
                      {pl.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {pl.author} · {pl.videoCount}曲
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAll(pl);
                      }}
                      className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg text-xs font-medium transition-colors"
                    >
                      再生
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSync(pl.playlistId);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-medium transition-colors"
                    >
                      同期
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
