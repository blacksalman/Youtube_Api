import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const toggelVedioLike = asyncHandler( async (req, res) => {
    const { vedioId } = req.params;

    if(!isValidObjectId(vedioId)){
        throw new ApiError(400, "Invalid vedio Id.");
    }

    const likedVedio = await Like.findOne({
        vedio: vedioId,
        likedBy: req.user?._id
    })

    if(likedVedio){
        await Like.findByIdAndDelete(likedVedio?._id)

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Vedio unlike successfully",
                {},
            )
        )
    }

    const vedioLike = await Like.create({
        vedio: vedioId,
        likedBy: req.user?._id,
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Vedio liked successfully",
            vedioLike
        )
    )
});

const toggleCommentLike = asyncHandler( async (req, res) => {
    const { commentId } = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment Id.")
    }

    const likedComment = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id,
    })

    if(likedComment){
        await Like.findByIdAndDelete(likedComment?._id);

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Comment unliked successfully",
                {}
            )
        )
    }

    const commentLiked = await Like.create({
        comment: commentId,
        likedBy: req.user?._id,
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            commentLiked,
            "Comment liked successfully"
        )
    )
});

const toggleTweetLike = asyncHandler( async (req, res) => {
    const { tweetId } = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid comment Id.")
    }

    const likedTweet = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id,
    })

    if(likedTweet){
        await Like.findByIdAndDelete(likedTweet?._id);

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Comment unliked successfully",
                {}
            )
        )
    }

    const tweetLiked = await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id,
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweetLiked,
            "Comment liked successfully"
        )
    )
});

const getLikedVedios = asyncHandler( async (req, res) => {
    const likedVedios = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "vedios",
                localField: "vedios",
                foreignField: "_id",
                as: "vedios",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner"
                        }
                    },
                ]
            }
        },
        {
            $addFields: {
                vedioCount: {
                    $size: "$vedios"
                }
            }
        },
        {
            $unwind: "$vedios"
        },
        {
            $project: {
                vedios: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    updatedAt: 1,
                    views: 1,
                    owner: {
                        username: 1,
                        avatar: 1,
                    },
                    vedioCount: 1,
                    updatedAt: 1
                }
            }
        }
    ]);

    console.log('likedVedios', likedVedios);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVedios,
            "Liked vedio fetched successfully."
        )
    )
});

export {
    toggelVedioLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVedios
}