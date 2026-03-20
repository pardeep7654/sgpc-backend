import { Booking } from "../models/BookingModel.js";
import { Room } from "../models/RoomModel.js";
import { Gurudwara } from "../models/GurudwaraModel.js";
import { User } from "../models/UserModel.js";
import crypto from "crypto";

export const getAvailabily = async (req, res) => {
  try {
    const { gurudwaraId, date } = req.query;
    const selectedDate = new Date(date);

    const allRooms = await Room.find({ gurudwara: gurudwaraId });
    //booking for the
    const bookings = await Booking.find({
      gurudwara: gurudwaraId,
      checkInDate: selectedDate,
    }).select("room");
    const bookedRoomIds = bookings.map((booking) => booking.room.toString());
    const availableRooms = allRooms.filter(
      (room) => !bookedRoomIds.includes(room._id.toString()),
    );
    res
      .status(200)
      .json({
        availableRooms: availableRooms.length,
        allRooms: allRooms.length,
      });
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { gurudwaraId, members, checkInDate } = req.body;
    const userId = req.user._id;
    const selectedDate = new Date(checkInDate);
    //prevent double booking for the same date
    const existingBooking = await Booking.findOne({
      user: userId,
      gurudwara: gurudwaraId,
      checkInDate: selectedDate,
    });
    if (existingBooking) {
      return res
        .status(400)
        .json({
          message:
            "You already have a booking for this date at this Gurudwara.",
        });
    }
    const existingFamilyBooking = await Booking.findOne({
      checkInDate: selectedDate,
      bookingStatus: "confirmed",
    }).populate("user");

    if (
      existingFamilyBooking &&
      existingFamilyBooking.user.idProof === req.user.idProof
    ) {
      return res.status(400).json({
        message: "Family already booked room for this date",
      });
    }
    const gurudwara = await Gurudwara.findById(gurudwaraId);
    if (!gurudwara) {
      return res.status(404).json({ message: "Gurudwara not found" });
    }
    const allRooms = await Room.find({ gurudwara: gurudwaraId });
    const bookings = await Booking.find({
      gurudwara: gurudwaraId,
      checkInDate: selectedDate,
      bookingStatus: "confirmed",
    }).select("room");
    const bookedRoomIds = bookings.map((booking) => booking.room.toString());
    const availableRooms = allRooms.filter(
      (room) =>
        !bookedRoomIds.includes(room._id.toString()) &&
        room.capacity >= members,
    );
    if (availableRooms.length === 0) {
      return res
        .status(400)
        .json({ message: "No rooms available for the selected date." });
    }
    const roomToBook = availableRooms[0];
    const qrToken = crypto.randomBytes(16).toString("hex");
    const newBooking = new Booking({
      user: userId,
      room: roomToBook._id,
      gurudwara: gurudwaraId,
      members,
      checkInDate: selectedDate,
      qrToken,
    });
    await newBooking.save();
    res
      .status(201)
      .json({ message: "Booking created successfully", booking: newBooking });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createGroupBooking = async (req, res) => {
  try {
    const { gurudwaraId, groupName, groupSize, checkInDate } = req.body;

    const roomsNeeded = Math.ceil(groupSize / 4); // assuming 4 capacity

    const availableRooms = await Room.find({
      gurudwara: gurudwaraId
    }).limit(roomsNeeded);

    if (availableRooms.length < roomsNeeded) {
      return res.status(400).json({ message: "Not enough rooms" });
    }

    const bookings = [];

    for (let room of availableRooms) {
      const booking = await Booking.create({
        user: req.user._id,
        gurudwara: gurudwaraId,
        room: room._id,
        members: 4,
        checkInDate,
        isGroupBooking: true,
        groupName,
        groupSize
      });

      bookings.push(booking);
    }

    res.status(201).json({
      message: "Group Booking Successful",
      roomsAllocated: bookings.length
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkInBooking = async (req, res) => {
  try {
    const { qrToken } = req.body;
    const booking = await Booking.findOne({
      qrToken,
      bookingStatus: "confirmed",
    }).populate("room");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.bookingStatus === "checked-in") {
      return res.status(400).json({ message: "Booking already checked in" });
    }
    booking.bookingStatus = "checked-in";
    await booking.save();
    res.status(200).json({ message: "Check-in successful", booking });
  } catch (error) {
    console.error("Error during check-in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;
    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.bookingStatus === "checked-in") {
      return res
        .status(400)
        .json({ message: "Cannot cancel a checked-in booking" });
    }
    booking.bookingStatus = "cancelled";
    await booking.save();
    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getOccupancyDetails = async (req, res) => {
  try {
    const { gurudwaraId } = req.query;
    const today = new Date();

    const totalRooms = await Room.countDocuments({ Gurudwara: gurudwaraId });
    const bookedToday = await Booking.countDocuments({
      gurudwara: gurudwaraId,
      checkInDate: today,
      checkInStatus: "confirmed",
    });
    const checkedInToday = await Booking.countDocuments({
      gurudwara: gurudwaraId,
      checkInDate: today,
      checkInStatus: "confirmed",
    });
    res.json({
      totalRooms,
      bookedToday,
      availableRooms: totalRooms - bookedToday,
      checkedInToday,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
