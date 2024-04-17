import { Router } from "express";
import { getChannelStats,getChannelVedios } from "../controllers/dashboard.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/stats").get(getChannelStats);
router.route("/vedios").get(getChannelVedios);


export default router;