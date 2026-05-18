import { useRef, useEffect, useCallback, useState } from 'react';
import { Howl } from 'howler';
import { usePlayerStore } from '../stores/player';
import { useSettingsStore } from '../stores/settings';
import { usePlaylistStore } from '../stores/playlist';
import { recordPlay, rateSong as dbRateSong, getRecentRatings } from '../db';
import * as api from '../api/client';

export default function PlayerBar() {
  const {
    status,
    currentSong,
    queue,
    queueIndex,
    volume,
    radioMode,
    toggleRadioMode,
    nextTrack,
    prevTrack,
    setStatus,
    setVolume,
    setLoading,
  } = usePlayerStore();

  const { selectedPresetId } = useSettingsStore();
  const { rateSong } = usePlaylistStore();

  const howlRef = useRef<Howl | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mcText, setMcText] = useState<string | null>(null);
  const mcHowlRef = useRef<Howl | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPlaying = status === 'playing';
  const canPrev = queue.length > 1 && queueIndex > 0;
  const canNext = queue.length > 1 && queueIndex < queue.length - 1;

  const stopProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const startProgress = useCallback(() => {
    stopProgress();
    progressIntervalRef.current = setInterval(() => {
      const h = howlRef.current;
      if (h && h.playing()) {
        setProgress(h.seek() as number);
        setDuration(h.duration());
      }
    }, 250);
  }, [stopProgress]);

  const playAudio = useCallback(
    (song: { videoId: string; title: string; author: string }) => {
      setLoading(true);
      stopProgress();

      if (howlRef.current) {
        howlRef.current.unload();
      }

      const howl = new Howl({
        src: [`https://www.youtube.com/watch?v=${song.videoId}`],
        html5: true,
        volume,
        format: ['mp4'],
        onload: () => {
          setLoading(false);
          setDuration(howl.duration());
          howl.play();
          setStatus('playing');
          startProgress();
          recordPlay(song.videoId, false, false);
        },
        onend: () => {
          recordPlay(song.videoId, true, false);
          if (radioMode) {
            generateAndPlayMc('outro', song, () => {
              const next = nextTrack();
              if (next) playAudio(next);
            });
          } else {
            const next = nextTrack();
            if (next) playAudio(next);
            else setStatus('idle');
          }
        },
        onloaderror: () => {
          setLoading(false);
          setStatus('idle');
        },
        onplayerror: () => {
          setLoading(false);
          setStatus('idle');
        },
      });

      howlRef.current = howl;
    },
    [volume, radioMode, nextTrack, setStatus, setLoading, startProgress, stopProgress]
  );

  const generateAndPlayMc = useCallback(
    async (
      _type: 'intro' | 'outro',
      song: { videoId: string; title: string; author: string },
      onComplete: () => void
    ) => {
      try {
        const nextInQueue = queue[queueIndex + 1];
        const mc = await api.generateMcAudio(
          selectedPresetId,
          { title: song.title, author: song.author, analysis: null },
          nextInQueue
            ? { title: nextInQueue.title, author: nextInQueue.author, analysis: null }
            : { title: '次の曲', author: '未定', analysis: null }
        );

        setMcText(mc.script.intro);

        if (mcHowlRef.current) mcHowlRef.current.unload();

        const mcHowl = new Howl({
          src: [mc.audio.intro],
          html5: true,
          volume,
          format: ['wav'],
          onend: () => {
            setMcText(null);
            onComplete();
          },
          onloaderror: () => {
            setMcText(null);
            onComplete();
          },
        });

        mcHowlRef.current = mcHowl;
        mcHowl.play();
      } catch {
        onComplete();
      }
    },
    [selectedPresetId, queue, queueIndex, volume]
  );

  useEffect(() => {
    return () => {
      stopProgress();
      if (howlRef.current) howlRef.current.unload();
      if (mcHowlRef.current) mcHowlRef.current.unload();
    };
  }, [stopProgress]);

  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.volume(volume);
    }
    if (mcHowlRef.current) {
      mcHowlRef.current.volume(volume);
    }
  }, [volume]);

  useEffect(() => {
    if (currentSong && status === 'playing') {
      playAudio(currentSong);
    }
  }, [currentSong?.videoId]);

  const handlePlayPause = () => {
    if (howlRef.current) {
      if (howlRef.current.playing()) {
        howlRef.current.pause();
        stopProgress();
        setStatus('paused');
      } else {
        howlRef.current.play();
        startProgress();
        setStatus('playing');
      }
    }
  };

  const handleNext = () => {
    const next = nextTrack();
    if (next) playAudio(next);
  };

  const handlePrev = () => {
    const prev = prevTrack();
    if (prev) playAudio(prev);
  };

  const handleRate = (score: -1 | 0 | 1) => {
    if (currentSong) {
      rateSong(currentSong.videoId, score);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-14 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-40 pb-safe">
      <div className="max-w-2xl mx-auto">
        <div className="h-0.5 bg-slate-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: duration > 0 ? `${(progress / duration) * 100}%` : '0%' }}
          />
        </div>

        {mcText && (
          <div className="px-3 py-1 bg-purple-900/30 border-b border-purple-800/30">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-purple-400 font-medium">🎙️ MC</span>
              <p className="text-xs text-purple-200 truncate">{mcText}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-slate-100">
              {currentSong.title}
            </p>
            <p className="text-xs text-slate-500 truncate">{currentSong.author}</p>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleRate(-1)}
              className="p-1 rounded hover:bg-slate-800 text-slate-600 hover:text-red-400 transition-colors"
              title="Dislike"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
            </button>
            <button
              onClick={() => handleRate(1)}
              className="p-1 rounded hover:bg-slate-800 text-slate-600 hover:text-green-400 transition-colors"
              title="Like"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={!canPrev}
              className="p-1.5 rounded-full disabled:opacity-30 hover:bg-slate-800 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button
              onClick={handlePlayPause}
              className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button
              onClick={handleNext}
              disabled={!canNext}
              className="p-1.5 rounded-full disabled:opacity-30 hover:bg-slate-800 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>

          <button
            onClick={toggleRadioMode}
            className={`p-1.5 rounded-lg transition-colors ${
              radioMode
                ? 'bg-purple-600/30 text-purple-300'
                : 'text-slate-600 hover:text-slate-400'
            }`}
            title="ラジオモード"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
