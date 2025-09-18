import { Router } from 'express';
import { ask, transper, summarizeAndSave } from '../controllers/apiController.js';
const router = Router();

router.post('/ask', ask);
router.post('/transper', transper);
router.post('/summarize-and-save', summarizeAndSave);

export default router;