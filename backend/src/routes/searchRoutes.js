const express = require("express");
const { searchItems, searchUsers } = require("../controllers/searchController");

const router = express.Router();

router.get("/items", searchItems);
router.get("/users", searchUsers);

module.exports = router;