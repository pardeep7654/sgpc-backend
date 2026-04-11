
export const adminOnly= (req, res, next) => {
        
    if (req.user && req.user.role?.trim().toLowerCase() === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admins only' });
    }
};