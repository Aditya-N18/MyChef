// Cloudinary configuration
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "djjvjoxqn", // Add your cloud name
  api_key: "935155178715957", // Add your API key
  api_secret: "oJVlmJMWcYSZIafUgSAdgdAjb6w", // Add your API secret
});

module.exports = cloudinary;
