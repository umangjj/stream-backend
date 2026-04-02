# 🚀 Advanced Video Streaming Platform API

A robust, production-ready backend architecture for a highly scalable video streaming and social interaction platform. Engineered to handle complex database relationships, secure user authentication, massive media file processing, and AI-powered metadata generation.

## 🛠️ Tech Stack
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB & Mongoose
* **Authentication:** JSON Web Tokens (JWT) & bcrypt
* **File Handling:** Multer & Cloudinary
* **AI Integration:** Google Gemini API (gemini-2.5-flash)

## ✨ Core System Architecture
* **Advanced Data Aggregation:** Engineered highly optimized MongoDB Aggregation Pipelines to calculate real-time creator analytics (total channel views, subscriber counts, and dynamic watch history).
* **🤖 Generative AI Integration:** Custom Gemini API controller that acts as an SEO assistant, automatically generating highly clickable titles, descriptions, and tag arrays based on raw user video topics.
* **Authentication & Security:** Complete stateless JWT authentication system featuring secure, HTTP-only cookie parsing for both short-lived Access Tokens and long-lived Refresh Tokens.
* **Cloud Media Management:** Built a bulletproof file upload system using Multer for local buffering and Cloudinary for permanent cloud storage of video files and image thumbnails.
* **Social Graph & Interactions:** Developed full CRUD capabilities for a community posting system (Tweets), nested video comments, and a polymorphic Like system that seamlessly links users to multiple content types.
* **Playlist & Content Curation:** Flexible endpoints allowing users to construct, update, and manage dynamic arrays of video content.

 **Clone the repository:**
   ```bash
   git clone <https://github.com/umangjj/stream-backend.git>



## 🚀 Live API Documentation & Testing
[👉 View the full Postman Documentation here]https://documenter.getpostman.com/view/53476807/2sBXiomViY

**🟢 Live Base URL:** `https://stream-api-backend.onrender.com`

*Note: The backend is hosted on Render's free tier, so it may take 30-50 seconds to spin up on the very first request.*
