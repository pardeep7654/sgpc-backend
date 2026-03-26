import { PassThrough } from "stream";
import cloudinary from "../config/cloudinary.js";

export const uploadBufferToCloudinary = (fileBuffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) {
                return reject(error);
            }

            resolve(result);
        });

        const bufferStream = new PassThrough();
        bufferStream.end(fileBuffer);
        bufferStream.pipe(uploadStream);
    });
};
