import { Router } from 'express';
import { analyzeSong, analyzeBatch, generatePlaylistSummary } from '../services/ai.js';
const router = Router();
router.post('/analyze', async (req, res) => {
    try {
        const { videos, batch } = req.body;
        if (!videos || videos.length === 0) {
            res.status(400).json({ error: '分析する曲が指定されていません' });
            return;
        }
        if (batch) {
            const analyses = await analyzeBatch(videos.map((v) => ({ title: v.title, author: v.author })));
            const result = videos.map((v, i) => ({
                videoId: v.videoId,
                analysis: analyses[i],
            }));
            res.json({ analyses: result });
            return;
        }
        const song = videos[0];
        const analysis = await analyzeSong(song.title, song.author);
        res.json({ videoId: song.videoId, analysis });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});
router.post('/summary', async (req, res) => {
    try {
        const { analyses } = req.body;
        if (!analyses || analyses.length === 0) {
            res.status(400).json({ error: '分析データがありません' });
            return;
        }
        const summary = await generatePlaylistSummary(analyses);
        res.json(summary);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});
export default router;
//# sourceMappingURL=analyze.js.map