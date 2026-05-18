import { useState, useEffect } from 'react';
import { usePlaylistStore } from '../stores/playlist';
import { usePlayerStore } from '../stores/player';
import * as api from '../api/client';
import { getListeningStats } from '../db';
import type { SelectSongsResult } from '../types';

export default function AISelect() {
  const { songs, playlists, loadPlaylists, loadSongs, selectPlaylist, selectedPlaylistId } =
    usePlaylistStore();
  const { playQueue, setLoading, isLoading } = usePlayerStore();

  const [instruction, setInstruction] = useState('');
  const [result, setResult] = useState<SelectSongsResult | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  useEffect(() => {
    if (selectedPlaylistId) {
      loadSongs(selectedPlaylistId);
    }
  }, [selectedPlaylistId, loadSongs]);

  const handleSelect = async () => {
    if (!instruction.trim()) return;

    setIsSelecting(true);
    setError(null);
    setResult(null);

    try {
      const history = await getListeningStats();

      const res = await api.selectSongs(
        instruction.trim(),
        songs.map((s) => ({
          videoId: s.videoId,
          title: s.title,
          author: s.author,
          analysis: s.analysis,
        })),
        history,
        10
      );

      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : '選曲に失敗しました');
    } finally {
      setIsSelecting(false);
    }
  };

  const handlePlaySelected = () => {
    if (!result) return;
    const selectedSongs = result.videoIds
      .map((vid) => songs.find((s) => s.videoId === vid))
      .filter(Boolean);
    if (selectedSongs.length > 0) {
      playQueue(selectedSongs as typeof songs);
    }
  };

  const getSongTitle = (videoId: string) => {
    const song = songs.find((s) => s.videoId === videoId);
    return song
      ? `${song.analysis?.songTitle || song.title} — ${song.analysis?.artist || song.author}`
      : videoId;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">🤖 AI選曲</h1>
        <p className="text-sm text-slate-500 mt-1">気分やシチュエーションに合わせてAIが曲を選びます</p>
      </header>

      {playlists.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => { selectPlaylist(null); loadSongs(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
              !selectedPlaylistId
                ? 'bg-blue-600/20 text-blue-300'
                : 'bg-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            すべて
          </button>
          {playlists.map((pl) => (
            <button
              key={pl.playlistId}
              onClick={() => selectPlaylist(pl.playlistId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                selectedPlaylistId === pl.playlistId
                  ? 'bg-blue-600/20 text-blue-300'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              {pl.title}
            </button>
          ))}
        </div>
      )}

      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="例：雨の日に合うしっとりした曲 / テンション上がる曲 / 作業用BGM"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleSelect()}
          />
          <button
            onClick={handleSelect}
            disabled={isSelecting || !instruction.trim() || songs.length === 0}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            {isSelecting ? '選曲中...' : '選曲'}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {[
            'テンション上がる曲',
            '落ち着いた曲',
            '作業用BGM',
            '雨の日に合う曲',
            '寝る前に聴きたい曲',
            'ドライブ向け',
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInstruction(suggestion)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-400 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800/50 rounded-lg p-3">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-400">選曲結果</h2>
            <button
              onClick={handlePlaySelected}
              className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-300 rounded-lg text-xs font-medium transition-colors"
            >
              このリストを再生
            </button>
          </div>

          <p className="text-xs text-slate-500 bg-slate-900 rounded-lg p-3 border border-slate-800">
            {result.reasoning}
          </p>

          <div className="space-y-1">
            {result.videoIds.map((vid, i) => (
              <div
                key={vid}
                className="flex items-center gap-3 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800"
              >
                <span className="text-xs text-slate-600 w-5 text-right">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-200 truncate">
                  {getSongTitle(vid)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {songs.length === 0 && (
        <div className="text-center py-12 text-slate-600">
          <p className="text-4xl mb-3">📂</p>
          <p className="text-sm">まずプレイリストをインポートしてください</p>
        </div>
      )}
    </div>
  );
}
