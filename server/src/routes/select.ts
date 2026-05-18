import { Router, Request, Response } from 'express';
import { selectSongs } from '../services/ai.js';

const router = Router();

interface SelectRequestBody {
  instruction: string;
  songs: { videoId: string; title: string; author: string; analysis: Record<string, unknown> | null }[];
  history: { videoId: string; count: number; liked: boolean }[];
  count?: number;
}

router.post('/select', async (req: Request, res: Response) => {
  try {
    const { instruction, songs, history, count } = req.body as SelectRequestBody;

    if (!instruction) {
      res.status(400).json({ error: '選曲の指示を入力してください' });
      return;
    }
    if (!songs || songs.length === 0) {
      res.status(400).json({ error: '選曲対象の曲がありません' });
      return;
    }

    const result = await selectSongs(
      instruction,
      songs as Parameters<typeof selectSongs>[1],
      history || [],
      count || 10
    );

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
