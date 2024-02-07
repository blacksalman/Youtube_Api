import { Router } from "express";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.model.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"



const router = Router();
router.use(verifyJWT);


export default router;