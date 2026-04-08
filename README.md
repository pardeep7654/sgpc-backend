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

## API Reference

Base URL: `http://localhost:3000`

Type notation used below:

- `string(ObjectId)` = MongoDB object id string
- `string(date-time)` = ISO date-time string
- Nullable column values:
  - `No` = endpoint expects/returns non-null value
  - `Yes` = endpoint can return `null`
  - `Omitted` = field may be absent from JSON

### Auth Endpoints

#### 1) POST `/api/auth/register`

Auth: Public

Request body:

| Field    | Type   | Required | Nullable | Notes                     |
| -------- | ------ | -------- | -------- | ------------------------- |
| name     | string | Yes      | No       | User full name            |
| email    | string | Yes      | No       | Must be unique            |
| mobile   | string | Yes      | No       | Must be unique            |
| age      | number | Yes      | No       | Numeric age               |
| Adhaar   | string | Yes      | No       | Must be unique            |
| password | string | Yes      | No       | Plain password in request |

Success response (`201`):

| Field  | Type             | Nullable | Notes                          |
| ------ | ---------------- | -------- | ------------------------------ |
| \_id   | string(ObjectId) | No       | Created user id                |
| name   | string           | No       |                                |
| mobile | string           | No       |                                |
| email  | string           | No       |                                |
| age    | number           | No       |                                |
| Adhaar | string           | No       |                                |
| role   | string           | No       | `pilgrim`, `staff`, `admin`    |
| token  | string           | No       | JWT also set in `token` cookie |

Error responses:

- `400`: `{ "message": "Please fill all fields" }` or `{ "message": "User already exists" }`
- `500`: `{ "message": "Server error" }`

#### 2) POST `/api/auth/login`

Auth: Public

Request body:

| Field    | Type   | Required | Nullable | Notes            |
| -------- | ------ | -------- | -------- | ---------------- |
| email    | string | Yes      | No       | Registered email |
| password | string | Yes      | No       | Raw password     |

Success response (`200`):

| Field  | Type             | Nullable | Notes                          |
| ------ | ---------------- | -------- | ------------------------------ |
| \_id   | string(ObjectId) | No       |                                |
| name   | string           | No       |                                |
| mobile | string           | No       |                                |
| email  | string           | No       |                                |
| age    | number           | No       |                                |
| Adhaar | string           | No       |                                |
| role   | string           | No       |                                |
| token  | string           | No       | JWT also set in `token` cookie |

Error responses:

- `400`: `{ "message": "Please fill all fields" }` or `{ "message": "Invalid credentials" }`
- `500`: `{ "message": "Server error" }`

#### 3) POST `/api/auth/forgot-password/request-otp`

Auth: Public

Request body:

| Field | Type   | Required | Nullable | Notes              |
| ----- | ------ | -------- | -------- | ------------------ |
| email | string | Yes      | No       | User email for OTP |

Success response (`200`):

| Field   | Type   | Nullable | Notes                   |
| ------- | ------ | -------- | ----------------------- |
| message | string | No       | `OTP sent successfully` |

Error responses:

- `400`: `{ "message": "Email is required" }`
- `404`: `{ "message": "User not Found" }`
- `500`: `{ "message": "<runtime error message>" }`

#### 4) POST `/api/auth/forgot-password/reset-password`

Auth: Public

Request body:

| Field       | Type   | Required | Nullable | Notes            |
| ----------- | ------ | -------- | -------- | ---------------- |
| email       | string | Yes      | No       |                  |
| otp         | string | Yes      | No       | 6-digit OTP      |
| newPassword | string | Yes      | No       | New raw password |

Success response (`200`):

| Field   | Type   | Nullable | Notes                       |
| ------- | ------ | -------- | --------------------------- |
| message | string | No       | `Password reset successful` |

Error responses:

- `400`: `{ "message": "Email, OTP and new password are required" }` or `{ "message": "User Not Found Or Invalid Otp" }`
- `500`: `{ "message": "<runtime error message>" }`

#### 5) GET `/api/auth/logout`

Auth: Required (`token` cookie)

Request body: None

Success response (`200`):

| Field   | Type   | Nullable | Notes                     |
| ------- | ------ | -------- | ------------------------- |
| message | string | No       | `Logged out successfully` |

Error responses:

- `401`: `{ "message": "Unauthorized: No token provided" }` or `{ "message": "User already logout" }`
- `500`: `{ "message": "Server error" }`

#### 6) GET `/api/auth/me`

Auth: Required (`token` cookie)

Request body: None

Success response (`200`):

| Field   | Type    | Nullable | Notes                            |
| ------- | ------- | -------- | -------------------------------- |
| success | boolean | No       | Always `true` for success path   |
| user    | object  | No       | User object from auth middleware |

`user` fields:

| Field      | Type              | Nullable | Notes                      |
| ---------- | ----------------- | -------- | -------------------------- |
| \_id       | string(ObjectId)  | No       |                            |
| name       | string            | No       |                            |
| email      | string            | No       |                            |
| mobile     | string            | No       |                            |
| age        | number            | No       |                            |
| Adhaar     | string            | No       |                            |
| role       | string            | No       |                            |
| otp        | string            | Omitted  | Usually omitted unless set |
| otpExpires | string(date-time) | Omitted  | Usually omitted unless set |
| createdAt  | string(date-time) | No       |                            |
| updatedAt  | string(date-time) | No       |                            |
| \_\_v      | number            | No       | Mongoose version key       |

Error responses:

- `401`: `{ "message": "Unauthorized: No token provided" }`, `{ "message": "Unauthorized: User not found" }`, or `{ "message": "User already logout" }`

### Gurudwara Endpoints

#### 7) POST `/api/gurudwaras/create`

Auth: Required + Admin only

Request body:

| Field    | Type   | Required | Nullable | Notes             |
| -------- | ------ | -------- | -------- | ----------------- |
| name     | string | Yes      | No       | Mongoose required |
| location | string | Yes      | No       | Mongoose required |
| history  | string | Yes      | No       | Mongoose required |

Success response (`201`): Gurudwara document

| Field      | Type              | Nullable | Notes       |
| ---------- | ----------------- | -------- | ----------- |
| \_id       | string(ObjectId)  | No       |             |
| name       | string            | No       |             |
| location   | string            | No       |             |
| history    | string            | No       |             |
| totalRooms | number            | No       | Default `0` |
| createdAt  | string(date-time) | No       |             |
| updatedAt  | string(date-time) | No       |             |
| \_\_v      | number            | No       |             |

Error responses:

- `401`: Auth errors
- `403`: `{ "message": "Forbidden: Admins only" }`
- `500`: `{ "message": "Error creating Gurudwara", "reqBody": object, "error": string }`

#### 8) GET `/api/gurudwaras/all`

Auth: Public

Request body: None

Success response (`200`): Array of Gurudwara objects with same schema as endpoint 7 response.

Error responses:

- `500`: `{ "message": "Error fetching Gurudwaras", "error": object }`

### Room Endpoints

#### 9) POST `/api/rooms/add`

Auth: Required + Admin only

Content type: `multipart/form-data`

Request form fields:

| Field       | Type             | Required | Nullable | Notes                                              |
| ----------- | ---------------- | -------- | -------- | -------------------------------------------------- |
| gurudwaraId | string(ObjectId) | Yes      | No       | Must reference existing gurudwara                  |
| roomNumber  | string           | Yes      | No       | Mongoose required                                  |
| blockName   | string           | Yes      | No       | Mongoose required                                  |
| capacity    | number           | Yes      | No       | Mongoose required                                  |
| type        | string           | No       | Omitted  | Allowed values: `free`, `paid`; defaults to `free` |
| images      | file[]           | No       | Omitted  | Up to 5 image files, each <= 5 MB                  |

Success response (`201`): Room document

| Field              | Type              | Nullable | Notes                              |
| ------------------ | ----------------- | -------- | ---------------------------------- |
| \_id               | string(ObjectId)  | No       |                                    |
| Gurudwara          | string(ObjectId)  | No       |                                    |
| blockName          | string            | No       |                                    |
| roomNumber         | string            | No       |                                    |
| images             | array<object>     | No       | Empty array when no image uploaded |
| images[].url       | string            | Omitted  | Present for uploaded images        |
| images[].public_id | string            | Omitted  | Present for uploaded images        |
| capacity           | number            | No       |                                    |
| type               | string            | No       | `free` or `paid`                   |
| status             | string            | No       | Defaults to `available`            |
| createdAt          | string(date-time) | No       |                                    |
| updatedAt          | string(date-time) | No       |                                    |
| \_\_v              | number            | No       |                                    |

Error responses:

- `400`: Upload middleware errors, for example `{ "message": "Only image files are allowed" }`
- `401`: Auth errors
- `403`: `{ "message": "Forbidden: Admins only" }`
- `404`: `{ "message": "Gurudwara not found" }`
- `500`: `{ "message": "Error adding room", "error": string }`

#### 10) GET `/api/rooms/:gurudwaraId`

Auth: Public

Path params:

| Param       | Type             | Required | Nullable | Notes |
| ----------- | ---------------- | -------- | -------- | ----- |
| gurudwaraId | string(ObjectId) | Yes      | No       |       |

Request body: None

Success response (`200`): Array of Room objects with same schema as endpoint 9 response.

Error responses:

- `500`: `{ "message": "Error fetching rooms", "error": object }`

### Booking Endpoints

#### 11) GET `/api/bookings/availability`

Auth: Public

Query params:

| Param       | Type              | Required | Nullable | Notes                     |
| ----------- | ----------------- | -------- | -------- | ------------------------- |
| gurudwaraId | string(ObjectId)  | Yes      | No       |                           |
| date        | string(date-time) | Yes      | No       | Any parseable date string |

Request body: None

Success response (`200`):

| Field          | Type   | Nullable | Notes                    |
| -------------- | ------ | -------- | ------------------------ |
| availableRooms | number | No       | Count for selected date  |
| allRooms       | number | No       | Total rooms in gurudwara |

Error responses:

- `400`: `{ "message": "gurudwaraId and date are required" }` or `{ "message": "Invalid date" }`
- `500`: `{ "message": "Internal server error" }`

#### 12) POST `/api/bookings/create`

Auth: Required

Request body:

| Field        | Type              | Required | Nullable | Notes                     |
| ------------ | ----------------- | -------- | -------- | ------------------------- |
| gurudwaraId  | string(ObjectId)  | Yes      | No       |                           |
| members      | number            | Yes      | No       | Must fit room capacity    |
| checkInDate  | string(date-time) | Yes      | No       |                           |
| checkOutDate | string(date-time) | Yes      | No       | Must be after checkInDate |

Success response (`201`):

| Field   | Type   | Nullable | Notes                          |
| ------- | ------ | -------- | ------------------------------ |
| message | string | No       | `Booking created successfully` |
| booking | object | No       | Booking document               |

`booking` fields:

| Field              | Type              | Nullable | Notes                          |
| ------------------ | ----------------- | -------- | ------------------------------ |
| \_id               | string(ObjectId)  | No       |                                |
| user               | string(ObjectId)  | No       |                                |
| room               | string(ObjectId)  | No       |                                |
| gurudwara          | string(ObjectId)  | No       |                                |
| groupName          | string            | Omitted  | Single booking does not set it |
| groupSize          | number            | Omitted  | Single booking does not set it |
| isGroupBooking     | boolean           | No       | Defaults to `false`            |
| members            | number            | No       |                                |
| checkInDate        | string(date-time) | No       |                                |
| checkOutDate       | string(date-time) | No       |                                |
| actualCheckOutTime | string(date-time) | Omitted  | Set on checkout                |
| bookingStatus      | string            | No       | Default `confirmed`            |
| checkInStatus      | boolean           | No       | Default `false`                |
| checkInTime        | string(date-time) | Omitted  | Set on check-in                |
| qrToken            | string            | No       | Generated random hex string    |
| createdAt          | string(date-time) | No       |                                |
| updatedAt          | string(date-time) | No       |                                |
| \_\_v              | number            | No       |                                |

Error responses:

- `400`: validation/business-rule errors:
  - `gurudwaraId, members, checkInDate and checkOutDate are required`
  - `Invalid check-in or check-out date`
  - `Check-out must be after check-in`
  - `You already have a booking for this date at this Gurudwara.`
  - `Family already booked room for this date`
  - `No rooms available for the selected date.`
- `401`: auth errors
- `404`: `{ "message": "Gurudwara not found" }`
- `500`: `{ "message": "Internal server error" }`

#### 13) POST `/api/bookings/group`

Auth: Required

Request body:

| Field        | Type              | Required | Nullable | Notes                     |
| ------------ | ----------------- | -------- | -------- | ------------------------- |
| gurudwaraId  | string(ObjectId)  | Yes      | No       |                           |
| groupName    | string            | Yes      | No       |                           |
| groupSize    | number            | Yes      | No       | Number of guests          |
| checkInDate  | string(date-time) | Yes      | No       |                           |
| checkOutDate | string(date-time) | Yes      | No       | Must be after checkInDate |

Success response (`201`):

| Field          | Type   | Nullable | Notes                         |
| -------------- | ------ | -------- | ----------------------------- |
| message        | string | No       | `Group Booking Successful`    |
| roomsAllocated | number | No       | Count of created booking docs |

Error responses:

- `400`: request/validation errors including `Not enough rooms`
- `401`: auth errors
- `500`: `{ "message": "<runtime error message>" }`

#### 14) PUT `/api/bookings/cancel/:bookingId`

Auth: Required

Path params:

| Param     | Type             | Required | Nullable | Notes                         |
| --------- | ---------------- | -------- | -------- | ----------------------------- |
| bookingId | string(ObjectId) | Yes      | No       | Must belong to logged-in user |

Request body: None

Success response (`200`):

| Field   | Type   | Nullable | Notes                            |
| ------- | ------ | -------- | -------------------------------- |
| message | string | No       | `Booking cancelled successfully` |

Error responses:

- `400`: `{ "message": "Cannot cancel a checked-in booking" }`
- `401`: auth errors
- `404`: `{ "message": "Booking not found" }`
- `500`: `{ "message": "Internal server error" }`

#### 15) POST `/api/bookings/checkin`

Auth: Required + Admin only

Request body:

| Field   | Type   | Required | Nullable | Notes            |
| ------- | ------ | -------- | -------- | ---------------- |
| qrToken | string | Yes      | No       | Booking QR token |

Success response (`200`):

| Field   | Type   | Nullable | Notes                                         |
| ------- | ------ | -------- | --------------------------------------------- |
| message | string | No       | `Check-in successful`                         |
| booking | object | No       | Booking document populated with `room` object |

`booking` fields are same as endpoint 12, except `room` is a populated Room object.

Error responses:

- `401`: auth errors
- `403`: `{ "message": "Forbidden: Admins only" }`
- `404`: `{ "message": "Booking not found" }`
- `500`: `{ "message": "Internal server error" }`

#### 16) PUT `/api/bookings/checkout/:bookingId`

Auth: Required + Admin only

Path params:

| Param     | Type             | Required | Nullable | Notes               |
| --------- | ---------------- | -------- | -------- | ------------------- |
| bookingId | string(ObjectId) | Yes      | No       | Existing booking id |

Request body: None

Success response (`200`):

| Field   | Type   | Nullable | Notes                   |
| ------- | ------ | -------- | ----------------------- |
| message | string | No       | `Checkout successful`   |
| room    | string | No       | Checked out room number |

Error responses:

- `400`: `{ "message": "Cannot checkout before check-in" }`
- `401`: auth errors
- `403`: `{ "message": "Forbidden: Admins only" }`
- `404`: `{ "message": "Booking not found" }`
- `500`: `{ "message": "<runtime error message>" }`

#### 17) GET `/api/bookings/admin/occupancy`

Auth: Required + Admin only

Query params:

| Param       | Type             | Required | Nullable | Notes |
| ----------- | ---------------- | -------- | -------- | ----- |
| gurudwaraId | string(ObjectId) | Yes      | No       |       |

Request body: None

Success response (`200`):

| Field          | Type   | Nullable | Notes                           |
| -------------- | ------ | -------- | ------------------------------- |
| totalRooms     | number | No       |                                 |
| bookedToday    | number | No       | `confirmed` bookings for today  |
| availableRooms | number | No       | `totalRooms - bookedToday`      |
| checkedInToday | number | No       | `checked-in` bookings for today |

Error responses:

- `400`: `{ "message": "gurudwaraId is required" }`
- `401`: auth errors
- `403`: `{ "message": "Forbidden: Admins only" }`
- `500`: `{ "message": "<runtime error message>" }`

### Revenue Endpoint

#### 18) GET `/revenue`

Auth: Required + Admin only

Query params:

| Param       | Type              | Required | Nullable | Notes                                                |
| ----------- | ----------------- | -------- | -------- | ---------------------------------------------------- |
| gurudwaraId | string(ObjectId)  | Yes      | No       |                                                      |
| date        | string(date-time) | Yes      | No       | Parsed as Date and matched directly to `checkInDate` |

Request body: None

Success response (`200`):

| Field         | Type   | Nullable | Notes                                      |
| ------------- | ------ | -------- | ------------------------------------------ |
| totalBookings | number | No       | Bookings count for selected date           |
| totalRevenue  | number | No       | `500` per booking where room `type = paid` |

Error responses:

- `400`: `{ "message": "gurudwaraId and date are required" }` or `{ "message": "Invalid date" }`
- `401`: auth errors
- `403`: `{ "message": "Forbidden: Admins only" }`
- `500`: `{ "message": "<runtime error message>" }`

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
