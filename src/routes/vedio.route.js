import { Router } from 'express';
import {
    publishedAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    toggelPublishStatus
} from "../controllers/vedio.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT)


router.route("/").post(
    upload.fields([
        {
            name: "video",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
        
    ]),
    publishedAVideo
);

router.route("/:videoId")
   .get(getVideoById)
   .patch(
        upload.single("thumbnail"),
        updateVideo
    )
    .delete(deleteVideo)


router.route("/toggle/publish/:videoId").patch(toggelPublishStatus)


export default router;