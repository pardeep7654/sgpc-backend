import {model, Schema } from "mongoose";

const userSchema = new Schema({
    name: {type: String, required: true},
    email:{type:String,required:true},
    mobile: {type: String, required: true, unique: true},
    age: {type: Number, required: true},
    Adhaar: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role: {type: String, enum: ["pilgrim", "staff","admin"], default: "pilgrim"},
     otp:{
        type:String
     },
     otpExpires:{
        type:Date
     }
}, {
    timestamps: true
});


export const User = model("User", userSchema);
