import { Router } from 'express';
import { selectSongs } from '../services/ai.js';
const router = Router();
router.post('/select', async (req, res) => {
    try {
        const { instruction, songs, history, count } = req.body;
        if (!instruction) {
            res.status(400).json({ error: '選曲の指示を入力してください' });
            return;
        }
        if (!songs || songs.length === 0) {
            res.status(400).json({ error: '選曲対象の曲がありません' });
            return;
        }
        const result = await selectSongs(instruction, songs, history || [], count || 10);
        res.json(result);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});
export default router;
//# sourceMappingURL=select.js.map