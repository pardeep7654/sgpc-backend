import { Gurudwara } from "../models/GurudwaraModel.js";
import { Room } from "../models/RoomModel.js";

//ADD ROOM(Admin only)
export const addRoom = async (req, res) => {
    try {
        const { gurudwaraId, roomNumber, blockName, capacity, type } = req.body;
        const gurudwara = await Gurudwara.findById(gurudwaraId);
        if (!gurudwara) {
            return res.status(404).json({ message: "Gurudwara not found" });
        }
        await Gurudwara.findByIdAndUpdate(gurudwaraId, { $inc: { totalRooms: 1 } });
        const newRoom = new Room({
            Gurudwara: gurudwaraId,
            roomNumber,
            blockName,
            capacity,
            type
        });
        const savedRoom = await newRoom.save();
        res.status(201).json(savedRoom);
    } catch (error) {
        res.status(500).json({ message: "Error adding room", error });
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
