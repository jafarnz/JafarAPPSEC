const mongoose = require("mongoose");
const bCrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const Member = require("../database/member");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const sendVerificationEmail = async ({ name, email, password }, role, res) => {
  try {
    // Basic validation
    const errors = [];
    if (!name || typeof name !== "string" || !name.trim()) errors.push("Name is required.");
    if (!email || !isValidEmail(email)) errors.push("Valid email is required.");
    if (!password || typeof password !== "string" || password.length < 6)
      errors.push("Password must be at least 6 characters long.");
    if (!role) errors.push("Role is required.");

    if (errors.length) {
      return res.status(400).json({ message: "Validation failed.", errors });
    }

    const existingMember = await Member.findOne({ $or: [{ email }, { name }] });
    if (existingMember) {
      return res
        .status(400)
        .json({ message: "A user with this email or name already exists." });
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const hashedPassword = await bCrypt.hash(password, 12);

    // Create new member with verification code
    const newMember = new Member({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      isVerified: false,
    });

    await newMember.setVerificationCode(verificationCode);
    await newMember.save();

    // 5. Compose and send the email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification Code",
      html: `
                <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
                    <h2>Hello ${name},</h2>
                    <p>Thank you for registering. Please use the following code to verify your email address:</p>
                    <h1 style="color: #4CAF50;">${verificationCode}</h1>
                    <p>This code will expire in 15 minutes.</p>
                    <hr/>
                    <p style="font-size: 0.8em; color: #777;">If you did not request this, please ignore this email.</p>
                </div>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).json({
        message:
          "Verification email sent. Please check your inbox to complete your registration.",
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Delete the user if email fails
      await Member.deleteOne({ email: newMember.email });

      if (emailError.code === "EAUTH") {
        return res.status(500).json({
          message:
            "Email service configuration error. Please contact administrator.",
          error: "Email authentication failed",
        });
      }

      return res.status(500).json({
        message: "Failed to send verification email. Please try again.",
        error: "Email service temporarily unavailable",
      });
    }
  } catch (error) {
    console.error("Error in sendVerificationEmail:", error);
    return res
      .status(500)
      .json({ message: "Server error while sending verification email." });
  }
};

const verifyAndCreateUser = async (req, res) => {
  const { email, code } = req.body;

  // Additional graceful validation
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: "Valid email is required." });
  }
  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return res.status(400).json({ message: "Verification code is required." });
  }

  try {
    // 1. Find the member with verification data
    const member = await Member.findOne({ email: email.toLowerCase().trim(), isVerified: false });

    if (!member) {
      return res.status(400).json({
        message:
          "Verification failed. Code may be expired or invalid. Please try registering again.",
      });
    }

    // 2. Check if verification code is valid
    if (!(await member.isVerificationCodeValid(code))) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code." });
    }

    // 3. Clear verification code and mark as verified
    member.clearVerificationCode();
    await member.save();

    return res.status(201).json({
      message: `Account for ${member.role} created successfully. You may now log in.`,
    });
  } catch (error) {
    console.error("Error in verifyAndCreateUser:", error);
    return res
      .status(500)
      .json({ message: "Server error during user verification." });
  }
};

const sendPasswordResetEmail = async (req, res) => {
  const { email } = req.body;
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: "Valid email is required." });
  }

  try {
    // 1. Check if member exists
    const member = await Member.findOne({ email: email.toLowerCase().trim(), isVerified: true });
    if (!member) {
      // Generic message to prevent email enumeration
      return res.status(200).json({
        message:
          "If an account with this email exists, a password reset code has been sent.",
      });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set reset code on member
    await member.setPasswordResetCode(resetCode);
    await member.save();

    // Send the email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: member.email,
      subject: "Your Password Reset Code",
      html: `
                <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
                    <h2>Hello ${member.name},</h2>
                    <p>You requested a password reset. Please use the following code to reset your password:</p>
                    <h1 style="color: #4CAF50;">${resetCode}</h1>
                    <p>This code will expire in 15 minutes.</p>
                    <hr/>
                    <p style="font-size: 0.8em; color: #777;">If you did not request this, please ignore this email.</p>
                </div>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).json({
        message:
          "If an account with this email exists, a password reset code has been sent.",
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Clear the reset code if email fails
      member.clearPasswordResetCode();
      await member.save();

      if (emailError.code === "EAUTH") {
        return res.status(500).json({
          message:
            "Email service configuration error. Please contact administrator.",
          error: "Email authentication failed",
        });
      }

      return res.status(200).json({
        message:
          "If an account with this email exists, a password reset code has been sent.",
      });
    }
  } catch (error) {
    console.error("Error in sendPasswordResetEmail:", error);
    return res
      .status(500)
      .json({ message: "Server error while sending password reset email." });
  }
};

const resetPasswordWithCode = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: "Valid email is required." });
  }
  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return res.status(400).json({ message: "Reset code is required." });
  }
  if (!newPassword || newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long." });
  }

  try {
    // 1. Find the member
    const member = await Member.findOne({ email: email.toLowerCase().trim(), isVerified: true });

    if (!member) {
      return res.status(400).json({
        message: "Password reset failed. Code may be expired or invalid.",
      });
    }

    // 2. Check if reset code is valid
    if (!(await member.isPasswordResetCodeValid(code))) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset code." });
    }

    // 3. Hash new password and update member
    const hashedPassword = await bCrypt.hash(newPassword, 12);
    member.password = hashedPassword;
    member.clearPasswordResetCode();

    // Invalidate existing sessions
    member.tokenVersion = (member.tokenVersion || 0) + 1;
    member.passwordChangedAt = new Date();

    // Also clear lockout on password reset
    if (member.clearLock) member.clearLock();

    await member.save();

    return res.status(200).json({
      message:
        "Password has been reset successfully. You may now log in with your new password.",
    });
  } catch (error) {
    console.error("Error in resetPasswordWithCode:", error);
    return res
      .status(500)
      .json({ message: "Server error during password reset." });
  }
};

module.exports = {
  sendVerificationEmail,
  verifyAndCreateUser,
  sendPasswordResetEmail,
  resetPasswordWithCode,
};
