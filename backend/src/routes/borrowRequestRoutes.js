const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth");
const {
  createBorrowRequest,
  listMyBorrowRequests,
  getBorrowRequestById,
  updateBorrowRequestStatus,
  updateBorrowRequestPriority
} = require("../controllers/borrowRequestController");

const router = express.Router();

router.use(protect);

router.post("/", createBorrowRequest);
router.get("/mine", listMyBorrowRequests);
router.get("/:requestId", getBorrowRequestById);
router.patch("/:requestId/status", updateBorrowRequestStatus);
router.patch("/:requestId/priority", updateBorrowRequestPriority);

module.exports = router;