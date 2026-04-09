import { Gurudwara } from "../models/GurudwaraModel.js";
import { uploadBufferToCloudinary } from "../utils/cloudinary.js";

export const createGurudwara = async (req, res) => {
    try {
        const { name, location, history } = req.body;
        const imageFiles = req.files || [];

        const uploadedImages = await Promise.all(
            imageFiles.map((file) =>
                uploadBufferToCloudinary(file.buffer, {
                    folder: "gurudwaras"
                })
            )
        );
        
        const newGurudwara = new Gurudwara({
            name,
            location,
            history,
            images: uploadedImages.map((image) => ({
                url: image.secure_url,
                public_id: image.public_id
            }))
        });
        console.log("Creating Gurudwara:", newGurudwara);
        const savedGurudwara = await newGurudwara.save();
        res.status(201).json(savedGurudwara);
    } catch (error) {

        res.status(500).json({ message: "Error creating Gurudwara", reqBody: req.body, error: error.message });
    }
};
// Get all Gurudwaras(public)
export const getAllGurudwaras = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit, 10) || 6, 1);
        const search = req.query.search?.trim() || "";
        const skip = (page - 1) * limit;

        const filter = search
            ? {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { location: { $regex: search, $options: "i" } }
                ]
            }
            : {};

        const [gurudwaras, totalItems] = await Promise.all([
            Gurudwara.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Gurudwara.countDocuments(filter)
        ]);

        const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

        res.status(200).json({
            data: gurudwaras,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching Gurudwaras", error });
    }   
};
