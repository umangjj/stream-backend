import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const likedAlready = await Like.findOne({ video: videoId, likedBy: req.user._id });

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready._id);
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Removed like from video"));
    } else {
        await Like.create({ video: videoId, likedBy: req.user._id });
        return res.status(200).json(new ApiResponse(200, { isLiked: true }, "Liked video"));
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment ID");

    const likedAlready = await Like.findOne({ comment: commentId, likedBy: req.user._id });

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready._id);
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Removed like from comment"));
    } else {
        await Like.create({ comment: commentId, likedBy: req.user._id });
        return res.status(200).json(new ApiResponse(200, { isLiked: true }, "Liked comment"));
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet ID");

    const likedAlready = await Like.findOne({ tweet: tweetId, likedBy: req.user._id });

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready._id);
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Removed like from tweet"));
    } else {
        await Like.create({ tweet: tweetId, likedBy: req.user._id });
        return res.status(200).json(new ApiResponse(200, { isLiked: true }, "Liked tweet"));
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    // This pipeline finds all likes by the user, then looks up the actual video details
    const likedVideosAggregate = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true, $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo"
            }
        },
        {
            $unwind: "$likedVideo"
        },
        {
            $project: {
                _id: 0,
                likedVideo: {
                    _id: 1,
                    "videoFile": 1,
                    "thumbnail": 1,
                    "title": 1,
                    "duration": 1,
                    "views": 1
                }
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, likedVideosAggregate, "Liked videos fetched"));
})

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos }