const cloudinary = require("cloudinary").v2;

let configured = false;

function configureCloudinary() {
  if (configured) return;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  configured = true;
}

function ensureCloudinaryConfig() {
  configureCloudinary();

  const missing = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
  ].filter((key) => !process.env[key]);

  return {
    isReady: missing.length === 0,
    missing
  };
}

module.exports = {
  cloudinary,
  configureCloudinary,
  ensureCloudinaryConfig
};