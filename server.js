import { config } from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import gurudwaraRoutes from "./routes/gurudwaraRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import cronjobs from "./utils/cronjobs.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { adminOnly } from "./middlewares/adminMiddleware.js";
import { Booking } from "./models/BookingModel.js";

config({
    path: "./.env"
});

const app = express();


app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/gurudwaras", gurudwaraRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/revenue",authMiddleware,adminOnly,async(req,res)=>{
     try {
    const { gurudwaraId, date } = req.query;
    if (!gurudwaraId || !date) {
      return res.status(400).json({ message: "gurudwaraId and date are required" });
    }
    const selectedDate = new Date(date);
    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const bookings = await Booking.find({
      gurudwara: gurudwaraId,
      checkInDate: selectedDate,
      bookingStatus: "confirmed"
    }).populate("room");

    let totalRevenue = 0;

    bookings.forEach(b => {
      if (b.room.type === "paid") {
        totalRevenue += 500;
      }
    });

    res.json({
      totalBookings: bookings.length,
      totalRevenue
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

})


const PORT = process.env.PORT || 3000;
cronjobs();

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to connect to the database:", error);
});

 
