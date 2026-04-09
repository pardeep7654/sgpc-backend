import { Schema,model } from "mongoose";

const GurudwaraSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    history: {
        type: String,
        required: true
    },
    images: [
        {
            url: {
                type: String,
                required: true
            },
            public_id: {
                type: String,
                required: true
            }
        }
    ],
    totalRooms: {
        type: Number,
        default: 0
    }}, { timestamps: true });

export const Gurudwara = model('Gurudwara', GurudwaraSchema);    
