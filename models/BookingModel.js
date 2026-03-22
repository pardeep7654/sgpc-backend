import { Schema, model } from "mongoose";

const bookingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    gurudwara: {
      type: Schema.Types.ObjectId,
      ref: "Gurudwara",
      required: true,
    },
    groupName: String,
    groupSize: Number,
    isGroupBooking: {
      type: Boolean,
      default: false,
    },
    members: {
      type: Number,
      required: true,
    },
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate:{
      type:Date,
      required:true
    },
    actualCheckOutTime:Date,

    bookingStatus: {
      type: String,
      enum: ["confirmed", "cancelled","checked-out","checked-in"],
      default: "confirmed",
    },
    checkInStatus: {
      type: Boolean,
      default: false,
    },
    checkInTime: Date,
    qrToken: String,
  },
  { timestamps: true },
);

export const Booking = model("Booking", bookingSchema);
