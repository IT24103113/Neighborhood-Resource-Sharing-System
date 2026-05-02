const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createReview,
  getReviewsForUser,
  updateReview,
  deleteReview
} = require("../controllers/reviewController");

const router = express.Router();

router.get("/users/:userId", getReviewsForUser);
router.post("/", protect, createReview);
router.patch("/:reviewId", protect, updateReview);
router.delete("/:reviewId", protect, deleteReview);

module.exports = router;