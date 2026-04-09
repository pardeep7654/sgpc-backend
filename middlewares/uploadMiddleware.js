import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

export const uploadRoomImages = (req, res, next) => {
    upload.array("images", 5)(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError) {
            return res.status(400).json({ message: error.message });
        }

        return res.status(400).json({ message: error.message || "Image upload failed" });
    });
};

export const uploadGurudwaraImages = (req, res, next) => {
    upload.array("images", 5)(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError) {
            return res.status(400).json({ message: error.message });
        }

        return res.status(400).json({ message: error.message || "Image upload failed" });
    });
};
