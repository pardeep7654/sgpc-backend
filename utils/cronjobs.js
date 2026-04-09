import cron from 'node-cron';
import {Booking} from '../models/BookingModel.js';
import {User} from '../models/UserModel.js';

const cronjobs=()=>{
    cron.schedule("*/30 * * * *",async()=>{
        const now=new Date();
        const expiredBookings=await Booking.find({
            bookingStatus:"confirmed",
            checkInStatus:false,
            checkInDate:{$lt:new Date(now-3*60*60*1000)}
        });
        for (let booking of expiredBookings){
            booking.bookingStatus="cancelled"
            await booking.save();
        }
        // console.log("Expired booking canceled");

    });

    cron.schedule("* * * * *", async () => {
        const now = new Date();

        await User.updateMany(
            {
                otp: { $ne: null },
                otpExpires: { $lte: now }
            },
            {
                $unset: {
                    otp: 1,
                    otpExpires: 1
                }
            }
        );

        // console.log("Expired OTPs cleared");
    });
}

export default cronjobs;
