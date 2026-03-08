const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

// Storage for profile images (square, 500x500)
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "blog-app/users",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 500, height: 500, crop: "fill" }],
  },
});

// Storage for blog front pic (larger, 1200x630 - og:image size)
const blogFrontPicStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "blog-app/front-pics",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 1200, height: 630, crop: "fill" }],
  },
});

// Storage for blog content images (original size, but optimized)
const blogContentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "blog-app/content",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 1000, quality: "auto:good" }],
  },
});

// Combined storage that handles multiple image types
const blogStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "blog-app",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    // For front pic - use transformation; for content images - let Cloudinary auto-optimize
  },
});

const upload = multer({
  storage: blogStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for blog images
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/gif" ||
      file.mimetype === "image/webp"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.",
        ),
        false,
      );
    }
  },
});

// Export different upload configurations
module.exports = {
  upload,
  uploadProfile: multer({
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
  }),
  uploadBlogImages: multer({
    storage: blogStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
  }),
};
