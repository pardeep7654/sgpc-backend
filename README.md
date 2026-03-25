# SGPC Backend

Node.js + Express backend for a Gurudwara room booking system. It supports:

- user registration and login
- OTP-based password reset by email
- Gurudwara management
- room management
- individual and group bookings
- admin occupancy and revenue reporting
- booking check-in / check-out flows

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- JWT auth with HTTP-only cookies
- Nodemailer for OTP emails
- node-cron for background booking expiry jobs

## Project Structure

```text
config/
controllers/
middlewares/
models/
routes/
utils/
server.js
```

## Environment Variables

Create a `.env` file in the project root with:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password

TWILIO_ACCOUNT_SID=optional
TWILIO_AUTH_TOKEN=optional
TWILIO_PHONE_NUMBER=optional
SMS_DEFAULT_COUNTRY_CODE=optional

CLOUDINARY_CLOUD_NAME=optional
CLOUDINARY_API_KEY=optional
CLOUDINARY_API_SECRET=optional
```

Notes:

- `MONGO_URI` is required for startup.
- `JWT_SECRET` is required for authentication.
- `EMAIL_USER` and `EMAIL_PASS` are used for password reset OTP emails.
- Twilio and Cloudinary variables are currently present in `.env`, but this codebase mainly uses email OTP right now.

## Install

```bash
npm install
```

## Run

Development:

```bash
npm run dev
```

Direct start:

```bash
node server.js
```

By default the API runs on `http://localhost:3000`.

## Authentication

After successful login or registration, the backend sets a `token` cookie and also returns the JWT in the JSON response.

Protected routes require the cookie:

- `authMiddleware` checks the JWT cookie
- `adminOnly` restricts admin routes

## API Routes

Base URL: `http://localhost:3000`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password/request-otp`
- `POST /api/auth/forgot-password/reset-password`
- `GET /api/auth/logout`

Example register body:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "mobile": "9876543210",
  "age": 28,
  "Adhaar": "123412341234",
  "password": "secret123"
}
```

Example login body:

```json
{
  "email": "test@example.com",
  "password": "secret123"
}
```

### Gurudwaras

- `POST /api/gurudwaras/create` `admin only`
- `GET /api/gurudwaras/all`

Example create body:

```json
{
  "name": "Sri Harmandir Sahib",
  "location": "Amritsar",
  "history": "Historic Gurudwara"
}
```

### Rooms

- `POST /api/rooms/add` `admin only`
- `GET /api/rooms/:gurudwaraId`

Example add room body:

```json
{
  "gurudwaraId": "GURUDWARA_ID",
  "roomNumber": "101",
  "blockName": "A",
  "capacity": 4,
  "type": "free"
}
```

### Bookings

- `GET /api/bookings/availability?gurudwaraId=...&date=...`
- `POST /api/bookings/create`
- `POST /api/bookings/group`
- `PUT /api/bookings/cancel/:bookingId`
- `POST /api/bookings/checkin` `admin only`
- `PUT /api/bookings/checkout/:bookingId` `admin only`
- `GET /api/bookings/admin/occupancy?gurudwaraId=...` `admin only`

Example single booking body:

```json
{
  "gurudwaraId": "GURUDWARA_ID",
  "members": 2,
  "checkInDate": "2026-03-25T00:00:00.000Z",
  "checkOutDate": "2026-03-26T00:00:00.000Z"
}
```

Example group booking body:

```json
{
  "gurudwaraId": "GURUDWARA_ID",
  "groupName": "Delhi Sangat",
  "groupSize": 10,
  "checkInDate": "2026-03-25T00:00:00.000Z",
  "checkOutDate": "2026-03-27T00:00:00.000Z"
}
```

Example check-in body:

```json
{
  "qrToken": "BOOKING_QR_TOKEN"
}
```

### Revenue

- `GET /revenue?gurudwaraId=...&date=...` `admin only`

This route returns:

- total bookings for the selected date
- total revenue based on paid room bookings

## Booking Flow

1. Register or log in as a pilgrim.
2. Fetch all Gurudwaras.
3. Fetch rooms for a selected Gurudwara.
4. Check room availability for a date.
5. Create a booking.
6. Admin/staff checks in the booking using the QR token.
7. Admin checks out the booking when the stay ends.

## Background Jobs

A cron job runs every 30 minutes and cancels expired un-checked-in bookings.

File:

- `utils/cronjobs.js`

## Common Issues

### MongoDB connection hangs or fails

Check:

- `MONGO_URI` is correct
- your machine can reach MongoDB Atlas
- local DNS/network allows SRV resolution for `mongodb+srv://`

### OTP emails do not send

Check:

- `EMAIL_USER` and `EMAIL_PASS`
- Gmail app password configuration if using Gmail

In non-production mode, OTP behavior can be simulated depending on config.

## Scripts

```json
{
  "dev": "npx nodemon server.js"
}
```

## Current Status

This repository is an API backend only. It does not include a frontend like Booking.com, but it provides the main backend pieces needed for a booking-style system:

- property listing equivalent: Gurudwaras
- inventory equivalent: rooms
- reservation equivalent: bookings
- operational flows: occupancy, check-in, check-out, revenue

## License

ISC
