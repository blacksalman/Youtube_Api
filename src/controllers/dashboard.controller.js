import mongoose from "mongoose";
import { Vedio } from "../models/vedio.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler( async (req, res) => {
    const vedioStats = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "vedios",
                localField: "_id",
                foreignField: "owner",
                as: "vedios"
            }
        },
        {
            $unwind: "$vedios"
        },
        {
            $lookup: {
                from: "likes",
                localField: "vedios._id",
                foreignField: "vedio",
                as: "likes"
            }
        },
        {
            $group: {
                _id: "$_id",
                username: {$first: "$username"},
                fullName: {$first: "$fullName"},
                avatar: {$first: "$avatar"},
                vedioCount: {$sum: 1},
                viewCount: {$sum: "$vedios.view"},
                likeCount: {$sum:{$size: "$likes"}},
            }
        },
        {
            $project: {
                _id: 1,
                username: 1,
                fullName: 1,
                avatar: 1,
                viewCount: "$viewCount",
                likeCount: "$likeCount",
                vedioCount: 1
            }
        }
    ]);

    const subscriberStats = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $group: {
                _id: null,
                subscriberCount: {$sum: 1}
            }
        },
        {
            $project: {
                _id: 0,
                subscriberCount: 1
            }
        }
    ]);

    const stats = {
        _id: vedioStats[0]?._id,
        username: vedioStats[0]?.username,
        fullName: vedioStats[0]?.fullName,
        avatar: vedioStats[0]?.avatar,
        totalLikes: vedioStats[0]?.likeCount || 0,
        totalViews: vedioStats[0]?.viewCount || 0,
        totalVedios: vedioStats[0]?.vedioCount || 0,
        totalSubscribers: vedioStats[0]?.subscriberCount || 0,
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            stats,
            "Channel stats fetched successfully"
        )
    )
});

const getChannelVedios = asyncHandler( async (req, res) => {
    const channelVedios = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "vedios",
                localField: "_id",
                foreignField: "owner",
                as: "vedios"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribers"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                vedioCount: {
                    $size: "$vedios"
                }
            }
        },
        {
            $project: {
                _id: 1,
                username: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                vedioCount: 1,
                vedios: {
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    views: 1,
                    createAt: 1
                }
            }
        }
    ]);

    return res
    .stats(200)
    .json(
        new mongoose(
            200,
            channelVedios,
            "Channel vedios fetched successfully."
        )
    )
});

export {
    getChannelStats,
    getChannelVedios
}