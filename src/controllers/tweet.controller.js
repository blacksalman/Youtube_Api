import mongoose, {isValidObjectId} from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler( async (req, res) => {
    const { content } = req.body;

    if(!content){
        throw new ApiError(400, "Content field are required");
    }

    const createdTweet = await Tweet.create({
        content,
        owner: req.user?._id,
    })

    if(!createTweet){
        throw new ApiError(400, "Something went wrong tweet not created...");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            createdTweet,
            "Tweet created successfully"
        )
    )
});

const getUserTweet = asyncHandler( async (req, res) => {
    const { userId } = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }

    const tweet = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        // {
        //     $lookup: {
        //         from: "likes",
        //         localField: "_id",
        //         foreignField: "tweet",
        //         as: "likedBy",
        //         pipeline: [
        //             {
        //                 $project: {
        //                     likedBy: 1
        //                 }
        //             }
        //         ]
        //     }
        // },
        {
            $addFields: {
                // totalLikes: {
                //     $size: "$likedBy"
                // },
                ownerDetails: {
                    $size: "$owner"
                }
            }
        },
        {
            $project: {
                content: 1,
                ownerDetails: 1,
                // totalLikes: 1,
                createdAd: 1
            }
        }
    ])

    if(!tweet?.length){
        throw new ApiError(400, "User tweet does not exist...")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "User tweet feched successfully..."
        )
    )
});

const updateTweet = asyncHandler( async (req, res) => {
    const { tweetId } = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }

    const { content } = req. body;

    if(!content){
        throw new ApiError(400, "Content field required...")
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(404, "Tweet does not exist...")
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId, 
        {
            $set: {
                content,
            }
        },
        {new: true},
    )

    if(!updatedTweet){
        throw new ApiError(401, "Something went wrong...");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweet updated successfully"
        )
    )
});

const deleteTweet = asyncHandler( async (req, res) => {
    const { tweetId } = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id...");
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(404, "Tweet does not exist...")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if(!deletedTweet){
        throw new ApiError(400, "Something went wrong...")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deletedTweet,
            "Tweet deleted successfully..."
        )
    )
});

export {
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet
}