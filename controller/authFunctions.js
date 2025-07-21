const bCrypt = require("bcrypt");
require("dotenv").config();
const Member = require("../database/member");
const jwt = require("jsonwebtoken");

const memberLogin = async (req, role, res) => {
  let { name, password } = req;
  console.log(name, password);
  const member = await Member.findOne({ name });
  if (!member) {
    return res
      .status(400)
      .json({ message: "Member not found. Invalid login credentials" });
  }
  if (member.role !== role) {
    return res
      .status(400)
      .json({
        message: "Please make sure you are logging in the right portal",
      });
  }
  let isMatch = await bCrypt.compare(password, member.password);
  if (isMatch) {
    let token = jwt.sign(
      {
        role: member.role,
        name: member.name,
        email: member.email,
      },
      process.env.APP_SECRET,
      { expiresIn: "3 days" },
    );
    let result = {
      member: member.name,
      role: member.role,
      email: member.email,
      token: token,
      expiresIn: 168,
    };
    return res
      .status(200)
      .json({ ...result, message: "You are now logged in" });
  } else {
    return res.status(400).json({ message: "Incorrect username or password" });
  }
};

const memberAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(403).json({ message: "Missing Token" });
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.APP_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Wrong Token" });
    console.log(decoded.name);
    req.name = decoded.name;
    next();
  });
};

const checkRole = (roles) => async (req, res, next) => {
  let { name } = req;
  const member = await Member.findOne({ name });
  if (!member) {
    return res.status(404).json({ message: "Member not found" });
  }
  if (!roles.includes(member.role)) {
    return res
      .status(401)
      .json({ message: "You are not authorized to access this route" });
  }
  next();
};

module.exports = {
  memberLogin,
  memberAuth,
  checkRole,
};
