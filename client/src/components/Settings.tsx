import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settings';

export default function Settings() {
  const { presets, selectedPresetId, presetsLoaded, loadPresets, selectPreset } =
    useSettingsStore();

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">⚙️ 設定</h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-400">MCキャラクター選択</h2>
        <p className="text-xs text-slate-600">
          ラジオモードで曲紹介をするキャラクターを選びます。
          キャラクターの性格に合わせた口調でMCトークを行います。
        </p>

        {!presetsLoaded && (
          <div className="text-center py-6 text-slate-600">
            <p className="animate-pulse">読み込み中...</p>
          </div>
        )}

        <div className="space-y-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => selectPreset(preset.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedPresetId === preset.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-800 bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{preset.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200">
                      {preset.name}
                    </p>
                    {selectedPresetId === preset.id && (
                      <span className="px-1.5 py-0.5 bg-blue-600/20 text-blue-300 rounded text-xs">
                        選択中
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {preset.description}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 italic truncate">
                    「{preset.catchphrase}」
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs text-slate-600">
                      話速: {preset.speedScale}x
                    </span>
                    <span className="text-xs text-slate-600">
                      音高: {preset.pitchScale > 0 ? '+' : ''}
                      {preset.pitchScale.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {presets.length === 0 && presetsLoaded && (
          <div className="text-center py-8 bg-slate-900 rounded-xl border border-slate-800">
            <p className="text-4xl mb-3">🎙️</p>
            <p className="text-sm text-slate-500">
              VOICEVOXサーバーに接続できません
            </p>
            <p className="text-xs text-slate-600 mt-1">
              サーバーが起動しているか確認してください（localhost:50021）
            </p>
          </div>
        )}
      </section>

      <section className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3">
        <h2 className="text-sm font-medium text-slate-400">情報</h2>
        <div className="space-y-2 text-xs text-slate-600">
          <p>
            VOICEVOX Engine が localhost:50021 で起動している必要があります。
          </p>
          <p>
            Arch Linux: <code className="text-slate-500 bg-slate-800 px-1 rounded">yay -S voicevox-engine</code>
          </p>
          <p>
            Docker: <code className="text-slate-500 bg-slate-800 px-1 rounded">docker run -p 50021:50021 voicevox/voicevox_engine:cpu-latest</code>
          </p>
        </div>
      </section>

      <section className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <h2 className="text-sm font-medium text-slate-400 mb-3">環境変数設定</h2>
        <p className="text-xs text-slate-600">
          サーバー側の <code className="text-slate-500 bg-slate-800 px-1 rounded">.env</code> ファイルで設定：
        </p>
        <div className="mt-2 space-y-1 text-xs font-mono text-slate-500 bg-slate-800 rounded-lg p-3">
          <p>OPENAI_BASE_URL=https://api.openai.com/v1</p>
          <p>OPENAI_API_KEY=sk-...</p>
          <p>OPENAI_MODEL=gpt-4o-mini</p>
          <p>VOICEVOX_URL=http://localhost:50021</p>
        </div>
      </section>
    </div>
  );
}
