import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const registerUser = asyncHandler(async (req, res) => {
    //user detail cmoing from fronend
    const { fullName, email, username, password } = req.body;

    //validation check
    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "field missing");
    }

    //user alreADY exist??
    const existedUser = await User.findOne({ 
        $or: [{ username }, { email }] 
    });

    if (existedUser) {
        throw new ApiError(409, "email or username exists");
    }

    // images check
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    
    if (req.files && req.files.coverImage && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    // clouinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed");
    }

    // user object for db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    // Fetch created user and exclude pass
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "User registering failed : Sorry please try after some time");
    }

    //success response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully !!")
    );
});

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save the refresh token to the database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.log("TOKEN GENERATION ERROR: ", error);
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
}

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    //Make sure they provided either a username or an email
    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required");
    }

    //Find the user in the database
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    //Check the password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Password Incorrect");
    }

    //Generate the VIP passes (Tokens)
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    //Fetch the user again to send back, but strip out the password and tokens for security
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    //Configure secure cookies
    const options = {
        httpOnly: true,
        secure: true
    };

    //Send the response back to the user with the cookies attached
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                { user: loggedInUser, accessToken, refreshToken }, 
                "User logged in successfully"
            )
        );
});


const logoutUser = asyncHandler(async (req, res) => {
    // 1. Find the user in the DB and delete their refresh token
    // (We know req.user._id exists because our verifyJWT bouncer put it there!)
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // This removes the field from the document
            }
        },
        {
            new: true
        }
    )

    // 2. Set the cookie options (must match how we set them in login)
    const options = {
        httpOnly: true,
        secure: true
    }

    // 3. Send the response and clear the cookies from the browser
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshTokens(user._id);


        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken}, 
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    // 1. Check if both fields are provided
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Both old and new passwords are required");
    }

    // 2. Find the user (we have req.user because of our verifyJWT bouncer!)
    const user = await User.findById(req.user?._id);

    // 3. Check if the old password they typed matches the one in the database
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    // 4. Update to the new password and save 
    // (Our pre-save hook in user.model.js will automatically scramble this new one!)
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200, 
        req.user, 
        "Current user fetched successfully"
    ));
});

const updateAccountDetails = asyncHandler(async(req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required");
    }

    // We use findByIdAndUpdate to target the specific fields without touching the password
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email 
            }
        },
        { new: true } // This tells Mongoose to return the updated document, not the old one
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path; //multer

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    // Upload to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Error while uploading avatar to Cloudinary");
    }

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar");
    }

    // Update the database with the new Cloudinary URL
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});


const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});


//user subscription prfile 
const getUserChannelProfile = asyncHandler(async (req, res) => {
    // 1. Grab the username from the URL (e.g., /channel/umang07)
    const {username} = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing");
    }

    // 2. The Assembly Line (Aggregation Pipeline)
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions", 
                localField: "_id",     
                foreignField: "channel", 
                as: "subscribers"      
            }
        },
        
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers" 
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo" 
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist");
    }
    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel fetched successfully"));
});


//watch history
const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        // STAGE 1: Find the currently logged-in user
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        // STAGE 2: Look up the videos matching the IDs in their watchHistory array
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                // STAGE 3 (NESTED): While we have the video data, let's look up the channel owner!
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            // Keep the owner details clean, don't send their password!
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    // The lookup above returns an array. Let's extract the single owner object from it.
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    );
});

export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};