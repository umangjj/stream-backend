import { Router } from 'express';
import { generateVideoSEO } from '../controllers/ai.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// We secure this so random people on the internet can't burn through your AI quota!
router.use(verifyJWT);

router.route("/generate-seo").post(generateVideoSEO);

export default router;