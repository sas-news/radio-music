import { Router, Request, Response } from 'express';
import {
  getAllPresets,
  getPresetById,
  generateAudioQuery,
  synthesizeSpeech,
  CHARACTER_PRESETS,
} from '../services/voicevox.js';
import { generateMcScript, type SongAnalysis } from '../services/ai.js';

const router = Router();

router.get('/presets', (_req: Request, res: Response) => {
  res.json(getAllPresets());
});

interface McGenerateRequestBody {
  presetId: string;
  currentSong: { title: string; author: string; analysis: SongAnalysis | null };
  nextSong: { title: string; author: string; analysis: SongAnalysis | null };
}

router.post('/mc-generate', async (req: Request, res: Response) => {
  try {
    const { presetId, currentSong, nextSong } = req.body as McGenerateRequestBody;

    const preset = getPresetById(presetId);
    if (!preset) {
      res.status(400).json({ error: `プリセット "${presetId}" が見つかりません` });
      return;
    }

    const script = await generateMcScript(
      currentSong,
      nextSong,
      preset.name,
      preset.personality
    );

    const introQuery = await generateAudioQuery(script.intro, preset.speakerId);
    const outroQuery = await generateAudioQuery(script.outro, preset.speakerId);

    const [introAudio, outroAudio] = await Promise.all([
      synthesizeSpeech(introQuery, preset.speakerId, preset.speedScale, preset.pitchScale),
      synthesizeSpeech(outroQuery, preset.speakerId, preset.speedScale, preset.pitchScale),
    ]);

    const introBase64 = Buffer.from(introAudio).toString('base64');
    const outroBase64 = Buffer.from(outroAudio).toString('base64');

    res.json({
      script,
      audio: {
        intro: `data:audio/wav;base64,${introBase64}`,
        outro: `data:audio/wav;base64,${outroBase64}`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.post('/tts', async (req: Request, res: Response) => {
  try {
    const { text, presetId } = req.body as { text: string; presetId: string };

    if (!text) {
      res.status(400).json({ error: 'テキストが必要です' });
      return;
    }

    const preset = getPresetById(presetId || 'zundamon-normal') || CHARACTER_PRESETS[0];

    const query = await generateAudioQuery(text, preset.speakerId);
    const audio = await synthesizeSpeech(
      query,
      preset.speakerId,
      preset.speedScale,
      preset.pitchScale
    );

    const base64 = Buffer.from(audio).toString('base64');
    res.json({ audio: `data:audio/wav;base64,${base64}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
