import mongoose, {isValidObjectId} from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Vedio } from "../models/vedio.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVedioComments = asyncHandler( async (req, res) => {
    const { vedioId } = req.params;
    const { page = 1, limit= 10 } = req.query;

    if(!isValidObjectId(vedioId)){
        throw new ApiError(400, "Invalid vedio Id.")
    }

    const vedio = await Vedio.findById(vedioId);

    if(!vedio){
        throw new ApiError(400, "Vedio not found.")
    }

    const comment = await Comment.aggregate([
        {
            $match: {
                vedio: new mongoose.Types.ObjectId(vedioId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likedBy"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likedBy"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likedBy.likedBy"]},
                        then: true,
                        else: false,
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                owner:{
                    username: 1,
                    fullName: 1,
                    avatar: 1
                },
                likesCount: 1,
                isLiked: 1
            }
        }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const allComments = await Comment.aggregatePaginate(comment, options);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            allComments,
            "Vedio comment fetched successfully."
        )
    )
});

const addComment = asyncHandler( async( req, res) => {
    const { vedioId } = req.params;

    if(!isValidObjectId(vedioId)){
        throw new ApiError(400, "Invalid vedio Id.")
    }

    const {content} = req.body;

    if(!content){
        throw new ApiError(400, "All fields are required.")
    }

    const createdComment = await Comment.create({
        content,
        vedio: vedioId,
        owner: req.user?._id,
    })

    if(!createdComment){
        throw new ApiError(400, "Something went wrong while adding comment.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Comment added successfully",
            createdComment
        )
    )
});

const updateComment = asyncHandler(async (req, res) =>{
    const { commentId } = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment Id.")
    }

    const { content } = req.body;

    if(!content){
        throw new ApiError(400, "Fields are empty.")
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(400, "comment does not found.")
    }

    const udpatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {new: true}
    );

    if(!udpatedComment){
        throw new ApiError(400, "Something went wrong while updating comment.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            udpatedComment,
            "comment updated successfully."
        )
    )
});

const deleteComment = asyncHandler( async (req, res) =>{
    const { commentId } = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment Id")
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(400, "comment does not exist.")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deletedComment,
            "comment deleted successfully."
        )
    )
})

export {
    getVedioComments,
    addComment,
    updateComment,
    deleteComment
}