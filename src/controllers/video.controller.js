import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

// 1. Publish a Video (Uploads to Cloudinary & saves to DB)
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    
    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required")
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile) {
        throw new ApiError(400, "Video upload failed")
    }

    const video = await Video.create({
        title,
        description,
        // Cloudinary automatically returns the duration of a video file!
        duration: videoFile.duration,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        owner: req.user._id,
        isPublished: true
    })

    return res.status(200).json(new ApiResponse(200, video, "Video published successfully"))
})

// 2. Get a single video by its ID
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID")

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"))
})

// 3. Update Video Details (Title, Desc, or Thumbnail)
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID")

    const thumbnailLocalPath = req.file?.path
    let thumbnailUrl;

    if (thumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnail) throw new ApiError(400, "Error uploading thumbnail")
        thumbnailUrl = thumbnail.url
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                ...(title && { title }),
                ...(description && { description }),
                ...(thumbnailUrl && { thumbnail: thumbnailUrl })
            }
        },
        { new: true }
    )

    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"))
})

// 4. Delete a Video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID")

    await Video.findByIdAndDelete(videoId)

    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"))
})

// 5. Toggle Publish Status (Make it private/public)
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID")

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")

    video.isPublished = !video.isPublished
    await video.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, video, "Video publish status toggled"))
})

export {
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}