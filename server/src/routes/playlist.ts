import { Router, Request, Response } from 'express';
import { fetchPlaylist, computeDiff } from '../services/youtube.js';

const router = Router();

interface ImportRequestBody {
  url: string;
  previous?: { videoId: string; title: string }[];
}

router.post('/import', async (req: Request, res: Response) => {
  try {
    const { url, previous } = req.body as ImportRequestBody;
    if (!url) {
      res.status(400).json({ error: 'プレイリストURLが必要です' });
      return;
    }

    const { meta, videos } = await fetchPlaylist(url);

    const result = {
      meta,
      videos,
    };

    if (previous && previous.length > 0) {
      const diff = computeDiff(videos, previous);
      res.json({ ...result, diff });
      return;
    }

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
