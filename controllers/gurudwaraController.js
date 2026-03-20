import { Gurudwara } from "../models/GurudwaraModel.js";

export const createGurudwara = async (req, res) => {
    try {
        const { name, location, history } = req.body;
        const newGurudwara = new Gurudwara({
            name,
            location,
            history
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
        const gurudwaras = await Gurudwara.find();
        res.status(200).json(gurudwaras);
    } catch (error) {
        res.status(500).json({ message: "Error fetching Gurudwaras", error });
    }   
};
