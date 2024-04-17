import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Vedio } from "../models/vedio.model.js";


const createPlaylist = asyncHandler( async (req, res) =>{
    const { name, description } = req.body;

    if(!name || !description){
        throw new ApiError(400, "All fields are required.")
    }


    const createdPlaylist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    });


    if(!createdPlaylist){
        throw new ApiError(400, "Something went wrong while creating playlist.")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            createdPlaylist,
            "playlist created successfully"
        )
    )
});

const getUserPlaylists = asyncHandler( async (req, res) => {
    const { userId } = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id.")
    }

    const userPlaylist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },

        {
            $lookup: {
                from: "vedios",
                localField: "vedios",
                foreignField: "_id",
                as: "vedios"
            }
        },
        {
            $addFields: {
                videoCount: {
                    $size: "$vedios"
                },
                vedios: {
                    $first: "$vedios"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                vedios: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                videoCount: 1,
                updatedAt: 1,
                createdAt: 1
            }
        }

    ]);



    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            userPlaylist,
            "user playlist fetched successfully."
        )
    )


});

const getPlaylistById = asyncHandler( async (req, res) =>{
    const { playlistId } = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id.")
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "vedios",
                localField: "vedios",
                foreignField: "_id",
                as: "vedios"
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
            $addFields: {
                videoCount: {
                    $size: "$vedios"
                },
                viewCount: {
                    $sum: "$vedios.views"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                owner: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1
                },
                vedios: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                videoCount: 1,
                viewCount: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlists,
            "playlist videos fetched successfully."
        )
    )
});

const addVideoToPlaylist = asyncHandler( async (req, res) =>{
    const { playlistId, videoId } = req.params;


    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist Id.")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video Id.")
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400, "playlist not found.")
    }

    const video = await Vedio.findById(videoId);
    if(!video){
        throw new ApiError(400, "video not found.")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push:{
                vedios: [videoId],
            }
        }
    );

    if(!updatedPlaylist){
        throw new ApiError(400, "something went wrong while adding video.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Video added successfully on playlist."
        )
    )
});

const removeVideoFromPlaylist = asyncHandler( async (req, res) =>{
    const { playlistId, videoId } = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist Id.");
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video Id.");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(400, "Playlist not found.")
    }

    const video = await Vedio.findById(videoId);

    if(!video){
        throw new ApiError(400, "Video not found.");
    }

    const deletePlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                vedios: videoId
            }
        },
        {new: true}
    );

    if(!deletePlaylist){
        throw new ApiError(400, "Something went wrong while deleting video.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deletePlaylist,
            "Video deleted from playlist Successfully"
        )
    )
});

const deletePlaylist = asyncHandler( async (req, res) => {
    const { playlistId } = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id.")
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId);

    if(!playlist){
        throw new ApiError(400, "Something went wrong while deleting playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "playlist deleted successfully."
        )
    )
});

const updatePlaylist = asyncHandler( async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id.")
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(400, "Playlist does not exist.")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name, description
            }
        },
        {new: true}
    );

    if(!updatedPlaylist){
        throw new ApiError(400, "playlist not udpated")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "playlist updated successfully."
        )
    )


});


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}