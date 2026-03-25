import cron from 'node-cron';
import {Booking} from '../models/BookingModel.js';

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
        console.log("Expired booking canceled");

    })
}

export default cronjobs;
