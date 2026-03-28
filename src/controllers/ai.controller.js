import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Initialize the Gemini SDK with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateVideoSEO = asyncHandler(async (req, res) => {
    const { topic } = req.body;

    if (!topic) {
        throw new ApiError(400, "Please provide a video topic to generate SEO data");
    }

    // We use the flash model because it is incredibly fast for text generation
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // The Prompt: We are giving Gemini a very specific persona and output format
    const prompt = `
    You are an expert YouTube SEO strategist. A creator wants to make a video about this topic: "${topic}".
    
    Please generate the following in a clean JSON format:
    1. A catchy, highly-clickable video title (under 70 characters).
    2. A 3-sentence engaging video description optimized for search.
    3. An array of 10 highly relevant SEO tags.

    Return ONLY the raw JSON object, no markdown formatting or backticks. Structure it exactly like this:
    {
        "title": "...",
        "description": "...",
        "tags": ["...", "..."]
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Parse the string response back into a Javascript object
        const seoData = JSON.parse(responseText.trim());

        return res.status(200).json(
            new ApiResponse(200, seoData, "AI SEO data generated successfully")
        );
    } catch (error) {
        console.log("GEMINI API ERROR: ", error);
        throw new ApiError(500, "Failed to generate AI content. Please try again.");
    }
});

export { generateVideoSEO };