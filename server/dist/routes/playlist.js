import { Router } from 'express';
import { fetchPlaylist, computeDiff } from '../services/youtube.js';
const router = Router();
router.post('/import', async (req, res) => {
    try {
        const { url, previous } = req.body;
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
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});
export default router;
//# sourceMappingURL=playlist.js.map