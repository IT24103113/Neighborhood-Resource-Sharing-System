const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { cloudinary, ensureCloudinaryConfig } = require("../config/cloudinary");

function uploadBufferToCloudinary(fileBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });

    stream.end(fileBuffer);
  });
}

const uploadImages = asyncHandler(async (req, res, next) => {
  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length === 0) {
    return next(new AppError("At least one image file is required", 400));
  }

  const cloudinaryStatus = ensureCloudinaryConfig();
  if (!cloudinaryStatus.isReady) {
    return next(
      new AppError(
        `Cloudinary is not configured. Missing: ${cloudinaryStatus.missing.join(", ")}`,
        500
      )
    );
  }

  const uploaded = await Promise.all(
    files.map((file) =>
      uploadBufferToCloudinary(file.buffer, {
        folder: "nearshare/uploads",
        resource_type: "image"
      })
    )
  );

  return sendSuccess(
    res,
    {
      files: uploaded.map((entry) => ({
        url: entry.secure_url,
        public_id: entry.public_id,
        bytes: entry.bytes,
        format: entry.format
      }))
    },
    { statusCode: 201 }
  );
});

module.exports = {
  uploadImages
};