const { Schema, model } = require("mongoose");

const MemberSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["member", "president", "treasurer", "secretary"],
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      default: null,
    },
    verificationExpires: {
      type: Date,
      default: null,
    },
    passwordResetCode: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    // Account lockout fields
    loginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    // Token/session invalidation helpers
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Index for automatic cleanup of unverified users after 24 hours
MemberSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 86400, // 24 hours
    partialFilterExpression: { isVerified: false },
  },
);

// Index for automatic cleanup of expired verification codes
MemberSchema.index(
  { verificationExpires: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { verificationExpires: { $exists: true } },
  },
);

// Index for automatic cleanup of expired password reset codes
MemberSchema.index(
  { passwordResetExpires: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { passwordResetExpires: { $exists: true } },
  },
);

// Method to set verification code with expiration
MemberSchema.methods.setVerificationCode = async function (code) {
  const bcrypt = require("bcrypt");
  this.verificationCode = await bcrypt.hash(code, 10);
  this.verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
};

// Method to clear verification code
MemberSchema.methods.clearVerificationCode = function () {
  this.verificationCode = null;
  this.verificationExpires = null;
  this.isVerified = true;
};

// Method to set password reset code with expiration
MemberSchema.methods.setPasswordResetCode = async function (code) {
  const bcrypt = require("bcrypt");
  this.passwordResetCode = await bcrypt.hash(code, 10);
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
};

// Method to clear password reset code
MemberSchema.methods.clearPasswordResetCode = function () {
  this.passwordResetCode = null;
  this.passwordResetExpires = null;
};

// Method to check if verification code is valid and not expired
MemberSchema.methods.isVerificationCodeValid = async function (code) {
  const bcrypt = require("bcrypt");
  if (
    !this.verificationCode ||
    !this.verificationExpires ||
    this.verificationExpires <= new Date()
  ) {
    return false;
  }
  return await bcrypt.compare(code, this.verificationCode);
};

// Method to check if password reset code is valid and not expired
MemberSchema.methods.isPasswordResetCodeValid = async function (code) {
  const bcrypt = require("bcrypt");
  if (
    !this.passwordResetCode ||
    !this.passwordResetExpires ||
    this.passwordResetExpires <= new Date()
  ) {
    return false;
  }
  return await bcrypt.compare(code, this.passwordResetCode);
};

// Account lockout helpers
MemberSchema.methods.isCurrentlyLocked = function () {
  return this.lockUntil && this.lockUntil > new Date();
};

MemberSchema.methods.getLockRemainingSeconds = function () {
  if (!this.isCurrentlyLocked()) return 0;
  return Math.ceil((this.lockUntil.getTime() - Date.now()) / 1000);
};

function computeLockDurationMs(attempts) {
  if (attempts >= 15) return 5 * 60 * 1000; // 5 mins
  if (attempts >= 10) return 2 * 60 * 1000; // 2 mins
  if (attempts >= 5) return 60 * 1000; // 60 secs
  return 0;
}

MemberSchema.methods.recordFailedLogin = function () {
  // If still locked, do not change counters here
  if (this.isCurrentlyLocked()) {
    return { locked: true, lockMs: this.lockUntil.getTime() - Date.now() };
  }

  this.loginAttempts = (this.loginAttempts || 0) + 1;
  const duration = computeLockDurationMs(this.loginAttempts);
  if (duration > 0) {
    this.lockUntil = new Date(Date.now() + duration);
    return { locked: true, lockMs: duration };
  }

  return { locked: false, lockMs: 0 };
};

MemberSchema.methods.clearLock = function () {
  this.loginAttempts = 0;
  this.lockUntil = null;
};

module.exports = model("Member", MemberSchema);
