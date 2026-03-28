import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const {page = 1, limit = 10} = req.query;

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const commentsAggregate = Comment.aggregate([
        { $match: { video: new mongoose.Types.ObjectId(videoId) } }
    ]);

    const options = { page: parseInt(page, 10), limit: parseInt(limit, 10) };
    const comments = await Comment.aggregatePaginate(commentsAggregate, options);

    return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const {content} = req.body;

    if (!content) throw new ApiError(400, "Comment content is required");

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    });

    return res.status(200).json(new ApiResponse(200, comment, "Comment added successfully"));
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const {content} = req.body;

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $set: { content } },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated"));
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    await Comment.findByIdAndDelete(commentId);
    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted"));
})

export { getVideoComments, addComment, updateComment, deleteComment }