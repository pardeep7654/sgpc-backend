import { Schema,model } from "mongoose";
import { Gurudwara } from "./GurudwaraModel.js";

const roomSchema = new Schema({
    Gurudwara:{
        type: Schema.Types.ObjectId,
        ref: 'Gurudwara',
        required: true
    },
    blockName: {
        type: String,
        required: true
    },

    roomNumber: {
        type: String,
        required: true
    },
    images:[
        {
            url:String,
            public_id:String
        }
    ],
    capacity: {
        type: Number,
        required: true
    },
    type:{
        type: String,
        enum:["free","paid"],
        default:"free"
    },
    status: {
        type: String,
        enum: ['available', 'booked'],
        default: 'available'
    }
}, { timestamps: true });

export const Room = model('Room', roomSchema);