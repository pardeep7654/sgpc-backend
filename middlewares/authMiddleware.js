import jwt from 'jsonwebtoken';
import {User} from '../models/UserModel.js';
export const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
      
        req.user = user;
        next();
    } catch (error) {
        // return res.status(401).json({ message: "User already logout" });
        
    }
};