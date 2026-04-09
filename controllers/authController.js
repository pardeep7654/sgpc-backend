import { User } from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// import crypto from "crypto";
import { sendOtpSms } from "../utils/sendOtpSms.js";
 

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const genrateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const registerUser = async (req, res) => {
  try {
    const { name,email ,mobile, age, Adhaar, password } = req.body;
    // console.log("Received registration data:", { name, email, mobile, age, Adhaar, password }); // Log the received data for debugging
    if (!name || !mobile || !age || !Adhaar || !password ||!email) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    const userExists = await User.findOne({
      $or: [{ mobile }, { email }, { Adhaar }],
    });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      mobile,
      age,
      Adhaar,
      password: hashedPassword,
    });
    res.status(201).cookie("token", generateToken(user._id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }).json({
      _id: user._id,
      name: user.name,
      mobile: user.mobile,
      email:user.email,
      age: user.age,
      Adhaar: user.Adhaar,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Please fill all fields" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        res.status(200).cookie("token", generateToken(user._id), {
            httpOnly: true,
            sameSite:"lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        }).json({
            _id: user._id,
            name: user.name,
            mobile: user.mobile,
            email:user.email,
            age: user.age,
            Adhaar: user.Adhaar,    
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const logoutUser = async (req, res) => {
  try {
    res
      .status(200)
      .clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:"lax"
      })
      .json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPassword=async(req,res)=>{

  try {
    // console.log(req.body);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message:"User not Found"
      });
    }

    const otp = genrateOtp();
    console.log("Generated OTP:", otp); // Log the generated OTP for debugging
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    await sendOtpSms({ email: user.email, otp });

    res.json({
      message: "OTP sent successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
 
export const resetPassword = async (req, res) => {
  try {

    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP and new password are required"
      });
    }
    // console.log("Ds");

    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() }
    });

    // console.log("User found for password reset:", user); // Log the user found for debugging
    if (!user) {
      return res.status(400).json({
        message: "User Not Found Or Invalid Otp"
      });
    }


    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({
      message: "Password reset successful"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUser = async (req, res, next) => {
  const user = req.user;
  res.status(200).json(user);
};
