import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggelVedioLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVedios,
} from "../controllers/like.controller.js";


const router = Router();
router.use(verifyJWT);

router.route("/toggle/v/:vedioId").post(toggelVedioLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/vedios").get(getLikedVedios);


export default router;