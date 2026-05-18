import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePlaylistStore } from '../stores/playlist';
import { usePlayerStore } from '../stores/player';
import type { Song } from '../types';

export default function PlaylistDetail() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const {
    songs,
    isAnalyzing,
    loadSongs,
    analyzeAllUnanalyzed,
    analyzeSongs,
  } = usePlaylistStore();

  const { playSong, playQueue } = usePlayerStore();
  const [expandedSong, setExpandedSong] = useState<string | null>(null);

  useEffect(() => {
    if (playlistId) {
      loadSongs(playlistId);
    }
  }, [playlistId, loadSongs]);

  const unanalyzedCount = songs.filter((s) => !s.analysis).length;

  const handlePlaySong = (song: Song, index: number) => {
    playQueue(songs, index);
  };

  const handleAnalyzeOne = async (index: number) => {
    await analyzeSongs([index]);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const tempoEmoji: Record<string, string> = {
    'very slow': '🐌',
    slow: '🐢',
    medium: '🚶',
    fast: '🏃',
    'very fast': '🚀',
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">
            {songs[0]?.title ? `${songs.length}曲` : '楽曲一覧'}
          </h1>
          <p className="text-xs text-slate-500">
            {unanalyzedCount > 0
              ? `${unanalyzedCount}曲未分析`
              : '全曲分析済み'}
          </p>
        </div>
        {unanalyzedCount > 0 && (
          <button
            onClick={analyzeAllUnanalyzed}
            disabled={isAnalyzing}
            className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? '分析中...' : '全曲AI分析'}
          </button>
        )}
      </header>

      <div className="space-y-1">
        {songs.map((song, i) => (
          <div
            key={song.videoId}
            className={`bg-slate-900 rounded-xl border transition-colors ${
              expandedSong === song.videoId
                ? 'border-blue-500/30'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div
              className="flex items-center gap-3 p-3 cursor-pointer"
              onClick={() => handlePlaySong(song, i)}
            >
              <span className="text-xs text-slate-600 w-6 text-right shrink-0">
                {i + 1}
              </span>
              {song.thumbnail && (
                <img
                  src={song.thumbnail}
                  alt=""
                  className="w-10 h-10 rounded object-cover bg-slate-800 shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-slate-200">
                  {song.analysis?.songTitle || song.title}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {song.analysis?.artist || song.author}
                </p>
              </div>
              <span className="text-xs text-slate-600 shrink-0">
                {formatDuration(song.durationSec)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedSong(
                    expandedSong === song.videoId ? null : song.videoId
                  );
                }}
                className="p-1 rounded hover:bg-slate-800 text-slate-600 hover:text-slate-400 shrink-0"
              >
                {expandedSong === song.videoId ? '▲' : '▼'}
              </button>
            </div>

            {expandedSong === song.videoId && (
              <div className="px-3 pb-3 pt-0 border-t border-slate-800/50">
                {song.analysis ? (
                  <div className="space-y-2 mt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {song.analysis.genre.map((g) => (
                        <span
                          key={g}
                          className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded text-xs"
                        >
                          {g}
                        </span>
                      ))}
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded text-xs">
                        {tempoEmoji[song.analysis.tempo] || ''}{' '}
                        {song.analysis.tempo}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {song.analysis.mood.map((m) => (
                        <span
                          key={m}
                          className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-xs"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                    {song.analysis.notableFeatures && (
                      <p className="text-xs text-slate-500">
                        {song.analysis.notableFeatures}
                      </p>
                    )}
                    <p className="text-xs text-slate-600">
                      時代: {song.analysis.era} · 言語: {song.analysis.language}
                      {song.analysis.theme.length > 0 &&
                        ` · テーマ: ${song.analysis.theme.join(', ')}`}
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-600">未分析</span>
                    <button
                      onClick={() => handleAnalyzeOne(i)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      AIで分析する
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {songs.length === 0 && (
        <div className="text-center py-16 text-slate-600">
          <p className="text-4xl mb-3">🎶</p>
          <p className="text-sm">曲がありません</p>
        </div>
      )}
    </div>
  );
}
