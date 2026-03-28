import { Router } from 'express';
import {
    deleteVideo,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();

// This applies the Auth Bouncer to ALL routes in this file automatically!
router.use(verifyJWT); 

// Route: /api/v1/videos
router.route("/")
    .post(
        upload.fields([
            { name: "videoFile", maxCount: 1 },
            { name: "thumbnail", maxCount: 1 },
        ]),
        publishAVideo
    );

// Route: /api/v1/videos/:videoId
router.route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);

// Route: /api/v1/videos/toggle/publish/:videoId
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router