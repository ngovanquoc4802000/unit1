import { Router } from 'express';
const router = Router();
import { startSTT, stopSTT } from '../controllers/sttController.js';

export default (wss) => {
  router.post('/stt/start', startSTT(wss));
  router.post('/stt/stop', stopSTT);
  return router;
};