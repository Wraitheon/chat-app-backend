import multer from "multer";
import path from 'path'
import { Request } from "express";
import fs from 'fs';
import { AppError } from "../utils/AppError";

const image_path = 'public/images/profiles';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(image_path, { recursive: true });
    cb(null, image_path);
  },

  filename: (req, file, cb) => {
    const user_id = req.user!.id;
    const unique_suffix = `${new Date().getTime()}-${Math.round(Math.random() * 1E9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `user-${user_id}-${unique_suffix}${extension}`);
  },
});

const file_filter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed!', 400, 'INVALID_FILE_TYPE'));
  }
};

export const upload_picture = multer({
  storage,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  fileFilter: file_filter,
  limits: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    fileSize: 1024 * 1024 * 5,
  },
});