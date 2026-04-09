import jwt from 'jsonwebtoken';
import {User} from '../models/UserModel.js';
export const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id) {
            return res.status(401).json({ message: "Invalid token" });
        }
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
      
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "User already logout" });

    }
};