import mongoose, {isValidObjectId, model} from "mongoose";
import { Vedio } from "../models/vedio.model.js";
import{ User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadCloudinary } from "../utils/cloudinary.js";

const getAllVedios = asyncHandler( async (req, res) => {
    const { page=1, limit=10, query, sortBy, sortType, userId } = req.query;
    let pipeline = [];

    if(query){
        pipeline.push({
            $search: {
                $index: "search-vedio",
                $text: {
                    query: query,
                    path:["title", "description"]
                }
            }
        });
    }

    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(400, "Invalid user Id.")
        }

        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    pipeline.push({
        $match: {
            isPublished: true
        }
    });

    if(sortBy && sortType){
        pipeline.push({
            $sort: {
                [sortBy]: sortBy === "asc" ? 1 : -1
            }
        })
    }else {
        pipeline.push({
            $sort: { createdAt : -1}
        })
    }

    const option = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    }

    const allVedios = await Vedio.aggregatePaginate(pipeline, option)

    return res.status(200).json(
        new ApiResponse(
            200,
            allVedios,
            "All vedios fetched sccessfully"
        )
    )

})

const publishedAVideo = asyncHandler( async (req, res) => {
    const { title, description } = req.body;

    if(!title || !description){
        throw new ApiError(400, "All fields are required")
    }

    const videoLocalFilePath = req.files?.video[0].path;
    const thumbnailFilePath = req.files?.thumbnail[0].path;

    if(!videoLocalFilePath){
        throw new ApiError(400, "video file path is not found...")
    }

    if(!thumbnailFilePath){
        throw new ApiError(400, "thumbnail path is not found...")
    }


    const videoFile = await uploadCloudinary(videoLocalFilePath);
    const thumbnail = await uploadCloudinary(thumbnailFilePath);

    if(!videoFile){
        throw new ApiError(400, "video file is uploaded")
    }
    if(!thumbnail){
        throw new ApiError(400, "thumbnail is not uploaded")
    }

    const duration = Math.floor(videoFile?.duration)
    const isPublished = true;
    const owner = req.user?._id;


    const video = await Vedio.create({
        videoFile: videoFile?.url,
        thumbnail: thumbnail?.url,
        title, 
        description,
        duration,
        isPublished,
        owner
    })

    const createdVedio = await Vedio.findById(video._id)

    return res
    .status(200)
    .json(
        new ApiResponse(200, createdVedio, "video upload successfully")
    )
});

const getVideoById = asyncHandler( async (req, res) => {
    const { videoId } = req.params;

    if(!videoId){
        throw new ApiError(400, "Video id is not found")
    }

    const getVideo = await Vedio.findById(videoId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            getVideo,
            "video fetched successfully"

        )
    )
});

const updateVideo = asyncHandler( async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if(!videoId){
        throw new ApiError(400, "Video Id not found...")
    }

    const thumbnailLocalPath = req.file.path;

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Video file path not found...")
    }
    const thumbnail = await uploadCloudinary(thumbnailLocalPath)
    if(!thumbnail){
        throw new ApiError(400, "thumbnail is not uploaded")
    }

    const upatedVideo = await Vedio.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: thumbnail?.url,
                title,
                description,
            }
        },
        {new: true}
    ).select("-updatedAt");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            upatedVideo,
            "video updated successfully"
        )
    )
});

const deleteVideo = asyncHandler( async (req, res) => {
    const { videoId } = req.params;

    if(!videoId){
        throw new ApiError(400, "Video Id not found...")
    }
    
    const upatedVideo = await Vedio.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            upatedVideo,
            "video deleted successfully"
        )
    )
});

const toggelPublishStatus = asyncHandler( async (req, res) => {
    const { videoId } = req.params;

    if(!videoId){
        throw new ApiError(400, "Video Id not found...")
    }

    const currentVideo = await Vedio.findById(videoId)

    if(!currentVideo){
        throw new ApiError(400, "current video not found...")
    }

    const togglePublish = await Vedio.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !currentVideo.isPublished
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            togglePublish,
            "video deleted successfully"
        )
    )
});


export {
    publishedAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    toggelPublishStatus
};