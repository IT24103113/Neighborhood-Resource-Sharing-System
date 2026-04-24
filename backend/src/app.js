const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


app.get("/api/health", (req, res) => {
  return res.json({
    message: "Nearshare API is running"
  });
});

module.exports = app;