const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const {
  createUser,
  getAllUsers,
  getUserById,
  deleteUser,
  getAdminProfile
} = require("../controllers/adminController");

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, authorizeRoles("admin"));

// Admin profile
router.get("/me", getAdminProfile);

// User management
router.post("/users", createUser);
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserById);
router.delete("/users/:userId", deleteUser);

module.exports = router;