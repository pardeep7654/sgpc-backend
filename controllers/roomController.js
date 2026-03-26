import { Gurudwara } from "../models/GurudwaraModel.js";
import { Room } from "../models/RoomModel.js";
import { uploadBufferToCloudinary } from "../utils/cloudinary.js";

//ADD ROOM(Admin only)
export const addRoom = async (req, res) => {
    try {
        const { gurudwaraId, roomNumber, blockName, capacity, type } = req.body;
        const gurudwara = await Gurudwara.findById(gurudwaraId);
        if (!gurudwara) {
            return res.status(404).json({ message: "Gurudwara not found" });
        }

        const imageFiles = req.files || [];
        const uploadedImages = await Promise.all(
            imageFiles.map((file) =>
                uploadBufferToCloudinary(file.buffer, {
                    folder: "rooms"
                })
            )
        );

        const newRoom = new Room({
            Gurudwara: gurudwaraId,
            roomNumber,
            blockName,
            capacity,
            type,
            images: uploadedImages.map((image) => ({
                url: image.secure_url,
                public_id: image.public_id
            }))
        });
        const savedRoom = await newRoom.save();
        await Gurudwara.findByIdAndUpdate(gurudwaraId, { $inc: { totalRooms: 1 } });
        res.status(201).json(savedRoom);
    } catch (error) {
        res.status(500).json({ message: "Error adding room", error: error.message });
    }
};

//get rooms by gurudwara id(public)
export const getRoomsByGurudwara = async (req, res) => {
    try {
        const { gurudwaraId } = req.params;
        const rooms = await Room.find({ Gurudwara: gurudwaraId });
        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ message: "Error fetching rooms", error });
    }
};
