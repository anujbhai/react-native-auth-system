const express = require("express");
const {check, validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const validateReg = [
  check("fullName")
    .isLength({min: 3})
    .withMessage("Your full name is required."),
  check("email")
    .isEmail()
    .withMessage("Please provide a valid email."),
  check("password")
    .isLength({min: 6})
    .withMessage("Password must be at least six characters.")
];

const generateToken = user => {
  return jwt.sign(
    {_id: user._id, email: user.email, fullName: user.fullName},
    process.env.ACCESS_TOKEN_SECRET,
  );
};

const validateLogin = [
  check("email")
    .isEmail()
    .withMessage("Please provide a valid email."),
  check("password")
    .isLength({min: 6})
    .withMessage("Password is required. Must be at least six characters.")
];

router.post("/register", validateReg, async (req, res) => {
  // validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() }); 
  }

  // check if user already exists
  const userExists = await User.findOne({email: req.body.email});
  if (userExists) {
    return res
      .status(400)
      .send({
        success: false,
        message: "User with the email id already exists."
      });
  }

  // hashing password
  const salt = await bcrypt.genSalt(16);
  const hashPassword = await bcrypt.hash(req.body.password, salt);

  const user = new User({
    fullName: req.body.fullName,
    email: req.body.email,
    password: hashPassword,
  });

  // send newly created user object
  try {
    const savedUser = await user.save();

    // create and assign a token
    const token = generateToken(user);

    res.send({
      success: true,
      data: {
        id: savedUser._id,
        fullName: savedUser.fullName,
        email: savedUser.email,
      },
      token
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      error
    });
  }
});

router.post("/login", validateLogin, async (req, res) => {
  // validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() }); 
  }

  // check if user exists
  const user = await User.findOne({email: req.body.email});
  if (!user) {
    res.status(404).send({
      success: false,
      message: "User with the given email is not registered. Please check your email."
    });
  }

  // check if password matches
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) {
    return res.status(404).send({
      success: false,
      message: "Invalid email or password."
    });
  }

  // create and assign a token
  const token = generateToken(user);

  res
    .header("auth-token", token)
    .send({
      success: true,
      message: `Hello, welcome ${user.fullName}. Logged in successfully!`,
      token
    });
  // res.send(`Hello, welcome ${user.fullName}. Logged in successfully!`);
});

module.exports = router;

