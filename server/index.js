require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const verifyToken = require("./routes/verifyToken");

const app = express();
const port = process.env.PORT || 5000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
  } catch (err) {
    console.error(err);
  }
};
connectDB();

app.use(express.json());

// routes
app.get("/", (req, res) => {
  res.send("Welcome to the auth system");
});

app.get("/api/user/profile", verifyToken, (req, res) => {
  console.log(req.user);
  res.send({
    success: true,
    data: req.user
  });
});

app.use("/api/users", authRoutes);

mongoose.connection.once("open", () => {
  console.log("MongoDB connection established");

  app.listen(port, () => console.log(`Server running on port ${port}`));
});

