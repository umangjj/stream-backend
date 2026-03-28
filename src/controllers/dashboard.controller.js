import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // We need: Total Subscribers, Total Videos, Total Views, Total Likes
    const userId = req.user._id;

    // 1. Total Subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: userId });

    // 2. Total Videos & Total Views (Using a quick pipeline)
    const videoStats = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        { 
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ]);

    // 3. Total Likes on all videos owned by this user
    // We find all the user's videos, then count how many likes those specific videos have
    const userVideos = await Video.find({ owner: userId }).select("_id");
    const userVideoIds = userVideos.map(video => video._id);
    
    const totalLikes = await Like.countDocuments({ video: { $in: userVideoIds } });

    // Format the stats to send back
    const stats = {
        totalSubscribers,
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalLikes
    };

    return res.status(200).json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // Get all videos uploaded by the logged-in user
    const userId = req.user._id;

    const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 }); // Newest first

    return res.status(200).json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
})

export {
    getChannelStats, 
    getChannelVideos
}