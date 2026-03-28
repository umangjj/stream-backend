import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    if (!content) throw new ApiError(400, "Tweet content is required");

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    });

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet created successfully"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");

    const tweets = await Tweet.find({ owner: userId });

    return res.status(200).json(new ApiResponse(200, tweets, "User tweets fetched"));
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    const {content} = req.body;
    if (!content) throw new ApiError(400, "Content is required");

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $set: { content } },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    await Tweet.findByIdAndDelete(tweetId);
    return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted"));
})

export { createTweet, getUserTweets, updateTweet, deleteTweet }