import {v2 as cloudinary} from "cloudinary"
import fs from "fs" 
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //coludnary pe uplaod
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log("File is uploaded on cloudinary : SUCSSES", response.url);
        //remove (unlink) file
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) 
        console.error("CLOUDINARY UPLOAD ERROR: ", error);
        return null;
    }
}

export {uploadOnCloudinary}