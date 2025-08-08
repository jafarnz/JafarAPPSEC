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

  // Check if user needs to verify their email
  if (member.isVerified === false) {
    return res
      .status(400)
      .json({
        message:
          "Please verify your email address before logging in. Check your inbox for the verification code.",
      });
  }

  // Account lockout: if currently locked, block
  if (member.isCurrentlyLocked && member.isCurrentlyLocked()) {
    const seconds = member.getLockRemainingSeconds
      ? member.getLockRemainingSeconds()
      : Math.ceil((member.lockUntil.getTime() - Date.now()) / 1000);
    return res.status(429).json({
      message: `Account locked. Try again in ${seconds}s`,
    });
  }

  if (member.role !== role) {
    return res.status(400).json({
      message: "Please make sure you are logging in the right portal",
    });
  }
  let isMatch = await bCrypt.compare(password, member.password);
  if (isMatch) {
    // Successful login clears lock state per best practice
    if (member.clearLock) member.clearLock();
    await member.save();

    let token = jwt.sign(
      {
        role: member.role,
        name: member.name,
        email: member.email,
        tokenVersion: member.tokenVersion || 0,
        pwdAt: member.passwordChangedAt ? member.passwordChangedAt.getTime() : 0,
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
    // Record failed attempt and possibly lock
    const rec = member.recordFailedLogin ? member.recordFailedLogin() : { locked: false };
    await member.save();
    if (rec.locked) {
      const seconds = Math.ceil((member.lockUntil.getTime() - Date.now()) / 1000);
      return res.status(429).json({ message: `Too many attempts. Account locked for ${seconds}s` });
    }
    return res.status(400).json({ message: "Incorrect username or password" });
  }
};

const memberAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(403).json({ message: "Missing Token" });
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.APP_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Wrong Token" });

    // Validate tokenVersion and passwordChangedAt for forced logout on reset
    try {
      const member = await Member.findOne({ name: decoded.name });
      if (!member) return res.status(403).json({ message: "Wrong Token" });

      if (
        (member.tokenVersion || 0) !== (decoded.tokenVersion || 0) ||
        (member.passwordChangedAt && (!decoded.pwdAt || decoded.pwdAt < member.passwordChangedAt.getTime()))
      ) {
        return res.status(401).json({ message: "Session expired. Please login again." });
      }

      req.name = decoded.name;
      next();
    } catch (e) {
      return res.status(403).json({ message: "Wrong Token" });
    }
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
