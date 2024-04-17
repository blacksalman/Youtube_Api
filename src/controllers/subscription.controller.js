import mongoose, {isValidObjectId} from "mongoose";
import {Subscription} from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler( async (req, res) => {
    const { channelId } = req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel Id.")
    }

    const channelExists = await User.findById(channelId);

    if(!channelExists){
        throw new ApiError(404, "channel not found.")
    }

    const isSubscribed = await Subscription.findOne(
        {
            subscriber: req.user?._id,
            channelId: channelId
        }
    );

    if(isSubscribed){
        await Subscription.findByIdAndDelete(channelId);

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {isSubscribed: false},
                "Channel Unsubscribed successfully."
            )
        )
    }

    await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId
    });

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            {isSubscribed: true},
            "channel subscribed successfully."
        )
    )
});

const getUserChannelSubscribers = asyncHandler( async (req, res) => {
    const { channelId } = req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel Id.")
    }

    const channelExists = await User.findById(channelId);

    if (!channelExists) {
        throw new ApiError(404, "channel not found");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers"
            }
        },
        {
            $unwind: "$subscribers"
        },
        {
            $project: {
                _id: 1,
                subscriber: {
                    _id: 1,
                    username: "$subscribers.username",
                    fullName: "$subscribers.fullName",
                    avatar: "$subscribers.avatar"
                }
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscribers,
            "Subscribers fetched successfully"
        )
    )
});

const getSubscribedChannels = asyncHandler( async (req, res) => {
    const { subscriberId } = req.params;

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid Subscriber Id.");
    }

    const userExists = await User.findById(subscriberId);

    if (!userExists) {
        throw new ApiError(404, "channel not found");
    }

    const subscriberedChannel = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channels",
                pipeline: [
                    {
                        $lookup: {
                            from: "vedios",
                            localField: "_id",
                            foreignField: "owner",
                            as: "channelVideos"
                        }
                    },
                    {
                        $addFields: {
                            latestVideo: {
                                $last: "$channelVideos"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$channels",
        },
        {
            $project: {
                _id: 1,
                subscribedChannel: {
                    _id: "$channels._id",
                    username: "$channels.username",
                    fullName: "$channles.fullName",
                    avatar: "$channels.avatar",
                    latestVideo: {
                        _id: "$channels.latestVideo._id",
                        videoFile: "$channles.latestVideo.videoFile",
                        thumbnail: "$channles.latestVideo.thumbnail",
                        title: "$channles.latestVideo.title",
                        description: "$channles.latestVideo.description",
                        duration: "$channles.latestVideo.duration",
                        views: "$channles.latestVideo.views",
                        owner: "$channles.latestVideo.owner",
                        createdAt: "$channles.latestVideo.createdAt",
                    }
                }
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscriberedChannel,
            "subscribered channel fetched successfully"
        )
    )
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};
