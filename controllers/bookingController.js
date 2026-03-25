import { Booking } from "../models/BookingModel.js";
import { Room } from "../models/RoomModel.js";
import { Gurudwara } from "../models/GurudwaraModel.js";
import { User } from "../models/UserModel.js";
import crypto from "crypto";

export const getAvailabily = async (req, res) => {
  try {
    const { gurudwaraId, date } = req.query;
    if (!gurudwaraId || !date) {
      return res
        .status(400)
        .json({ message: "gurudwaraId and date are required" });
    }

    const selectedDate = new Date(date);
    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const allRooms = await Room.find({ Gurudwara: gurudwaraId });
    const bookings = await Booking.find({
      gurudwara: gurudwaraId,
      bookingStatus: { $in: ["confirmed", "checked-in"] },
      $or: [
        {
          checkInDate: { $lte: selectedDate },
          checkOutDate: { $gt: selectedDate },
        },
      ],
    }).select("room");
    const bookedRoomIds = bookings.map((booking) => booking.room.toString());
    const availableRooms = allRooms.filter(
      (room) => !bookedRoomIds.includes(room._id.toString()),
    );
    res.status(200).json({
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
    const { gurudwaraId, members, checkInDate, checkOutDate } = req.body;
    if (!gurudwaraId || !members || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        message: "gurudwaraId, members, checkInDate and checkOutDate are required",
      });
    }

    const userId = req.user._id;
    const selectedDate = new Date(checkInDate);
    const selectedCheckOutDate = new Date(checkOutDate);
    if (
      Number.isNaN(selectedDate.getTime()) ||
      Number.isNaN(selectedCheckOutDate.getTime())
    ) {
      return res.status(400).json({ message: "Invalid check-in or check-out date" });
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      return res.status(400).json({
        message: "Check-out must be after check-in",
      });
    }
    //prevent double booking for the same date
    const existingBooking = await Booking.findOne({
      user: userId,
      gurudwara: gurudwaraId,

      checkInDate: selectedDate,
    });
    if (existingBooking) {
      return res.status(400).json({
        message: "You already have a booking for this date at this Gurudwara.",
      });
    }
    const existingFamilyBooking = await Booking.findOne({
      gurudwara: gurudwaraId,
      checkInDate: selectedDate,
      bookingStatus: "confirmed",
    }).populate("user");

    if (
      existingFamilyBooking &&
      existingFamilyBooking.user.Adhaar === req.user.Adhaar
    ) {
      return res.status(400).json({
        message: "Family already booked room for this date",
      });
    }
    const gurudwara = await Gurudwara.findById(gurudwaraId);
    if (!gurudwara) {
      return res.status(404).json({ message: "Gurudwara not found" });
    }
    const allRooms = await Room.find({ Gurudwara: gurudwaraId });
    const bookings = await Booking.find({
      gurudwara: gurudwaraId,
      bookingStatus: { $in: ["confirmed", "checked-in"] },
      $or: [
        {
          checkInDate: { $lt: selectedCheckOutDate },
          checkOutDate: { $gt: selectedDate },
        },
      ],
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
      checkOutDate: selectedCheckOutDate,
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
    const { gurudwaraId, groupName, groupSize, checkInDate, checkOutDate } = req.body;

    if (!gurudwaraId || !groupName || !groupSize || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        message:
          "gurudwaraId, groupName, groupSize, checkInDate and checkOutDate are required",
      });
    }

    const selectedCheckInDate = new Date(checkInDate);
    const selectedCheckOutDate = new Date(checkOutDate);
    if (
      Number.isNaN(selectedCheckInDate.getTime()) ||
      Number.isNaN(selectedCheckOutDate.getTime())
    ) {
      return res.status(400).json({ message: "Invalid check-in or check-out date" });
    }

    if (selectedCheckOutDate <= selectedCheckInDate) {
      return res.status(400).json({
        message: "Check-out must be after check-in",
      });
    }

    const roomsNeeded = Math.ceil(groupSize / 4); // assuming 4 capacity

    const allRooms = await Room.find({
      Gurudwara: gurudwaraId,
      capacity: { $gte: 1 },
    });

    const overlappingBookings = await Booking.find({
      gurudwara: gurudwaraId,
      bookingStatus: { $in: ["confirmed", "checked-in"] },
      $or: [
        {
          checkInDate: { $lt: selectedCheckOutDate },
          checkOutDate: { $gt: selectedCheckInDate },
        },
      ],
    }).select("room");

    const bookedRoomIds = new Set(
      overlappingBookings.map((booking) => booking.room.toString()),
    );
    const availableRooms = allRooms
      .filter((room) => !bookedRoomIds.has(room._id.toString()))
      .slice(0, roomsNeeded);

    if (availableRooms.length < roomsNeeded) {
      return res.status(400).json({ message: "Not enough rooms" });
    }

    const bookings = [];

    let remainingGuests = groupSize;

    for (const room of availableRooms) {
      const members = Math.min(room.capacity, remainingGuests);
      const booking = await Booking.create({
        user: req.user._id,
        gurudwara: gurudwaraId,
        room: room._id,
        members,
        checkInDate: selectedCheckInDate,
        checkOutDate: selectedCheckOutDate,
        isGroupBooking: true,
        groupName,
        groupSize,
      });

      bookings.push(booking);
      remainingGuests -= members;
    }

    res.status(201).json({
      message: "Group Booking Successful",
      roomsAllocated: bookings.length,
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
    booking.bookingStatus = "checked-in";
    booking.checkInStatus = true;
    booking.checkInTime = new Date();

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
    if (!gurudwaraId) {
      return res.status(400).json({ message: "gurudwaraId is required" });
    }

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const totalRooms = await Room.countDocuments({ Gurudwara: gurudwaraId });
    const bookedToday = await Booking.countDocuments({
      gurudwara: gurudwaraId,
      checkInDate: { $gte: startOfDay, $lte: endOfDay },
      bookingStatus: "confirmed",
    });
    const checkedInToday = await Booking.countDocuments({
      gurudwara: gurudwaraId,
      checkInDate: { $gte: startOfDay, $lte: endOfDay },
      bookingStatus: "checked-in",
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

export const checkOutBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate("room");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.bookingStatus !== "checked-in") {
      return res.status(400).json({
        message: "Cannot checkout before check-in"
      });
    }

    booking.bookingStatus = "checked-out";
    booking.actualCheckOutTime = new Date();

    await booking.save();

    res.json({
      message: "Checkout successful",
      room: booking.room.roomNumber
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
