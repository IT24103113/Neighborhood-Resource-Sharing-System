const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createItem,
  listItems,
  getItemById,
  updateItem,
  deleteItem
} = require("../controllers/itemController");

const router = express.Router();

router.get("/", listItems);
router.get("/:itemId", getItemById);
router.post("/", protect, createItem);
router.patch("/:itemId", protect, updateItem);
router.delete("/:itemId", protect, deleteItem);

module.exports = router;