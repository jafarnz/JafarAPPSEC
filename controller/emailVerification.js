const mongoose = require('mongoose');
const bCrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Verification = require('../database/verification');
const Member = require('../database/member');
const PasswordReset = require('../database/passwordReset');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendVerificationEmail = async ({ name, email, password }, role, res) => {
    try {
        const existingMember = await Member.findOne({ $or: [{ email }, { name }] });
        if (existingMember) {
            return res.status(400).json({ message: 'A user with this email or name already exists.' });
        }

        await Verification.deleteOne({ email });

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedVerificationCode = await bCrypt.hash(verificationCode, 10);
        const hashedPassword = await bCrypt.hash(password, 12);

        // 4. Create and save the verification document
        const newVerification = new Verification({
            name,
            email,
            password: hashedPassword,
            role,
            code: hashedVerificationCode,
        });

        await newVerification.save();

        // 5. Compose and send the email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification Code',
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

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ message: 'Verification email sent. Please check your inbox to complete your registration.' });

    } catch (error) {
        console.error('Error in sendVerificationEmail:', error);
        return res.status(500).json({ message: 'Server error while sending verification email.' });
    }
};


const verifyAndCreateUser = async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ message: 'Email and verification code are required.' });
    }

    try {
        // 1. Find the verification data for the given email
        const verificationData = await Verification.findOne({ email });

        if (!verificationData) {
            return res.status(400).json({ message: 'Verification failed. Code may be expired or invalid. Please try registering again.' });
        }

        // 2. Compare the provided code with the stored hash
        const isMatch = await bCrypt.compare(code, verificationData.code);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid verification code.' });
        }

        // 3. Create and save the new member to the main collection
        const newMember = new Member({
            name: verificationData.name,
            email: verificationData.email,
            password: verificationData.password,
            role: verificationData.role,
        });

        await newMember.save();

        // 4. Clean up: delete the temporary verification data
        await Verification.deleteOne({ email });

        return res.status(201).json({ message: `Account for ${verificationData.role} created successfully. You may now log in.` });

    } catch (error) {
        console.error('Error in verifyAndCreateUser:', error);
        return res.status(500).json({ message: 'Server error during user verification.' });
    }
};


const sendPasswordResetEmail = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        // 1. Check if user exists
        const member = await Member.findOne({ email });
        if (!member) {
            // We send a generic message to prevent email enumeration
            return res.status(200).json({ message: 'If an account with this email exists, a password reset code has been sent.' });
        }

        // 2. Clear previous attempts and generate new code
        await PasswordReset.deleteOne({ email });
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedResetCode = await bCrypt.hash(resetCode, 10);

        // 3. Save the reset document
        const newPasswordReset = new PasswordReset({
            email,
            code: hashedResetCode,
        });
        await newPasswordReset.save();

        // 4. Send the email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Password Reset Code',
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

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ message: 'If an account with this email exists, a password reset code has been sent.' });

    } catch (error) {
        console.error('Error in sendPasswordResetEmail:', error);
        return res.status(500).json({ message: 'Server error while sending password reset email.' });
    }
};

const resetPasswordWithCode = async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).json({ message: 'Email, code, and new password are required.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        // 1. Find the reset data
        const resetData = await PasswordReset.findOne({ email });

        if (!resetData) {
            return res.status(400).json({ message: 'Password reset failed. Code may be expired or invalid.' });
        }

        // 2. Compare codes
        const isMatch = await bCrypt.compare(code, resetData.code);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid reset code.' });
        }

        // 3. Hash new password and update user
        const hashedPassword = await bCrypt.hash(newPassword, 12);
        await Member.updateOne({ email }, { $set: { password: hashedPassword } });

        // 4. Clean up
        await PasswordReset.deleteOne({ email });

        return res.status(200).json({ message: 'Password has been reset successfully. You may now log in with your new password.' });

    } catch (error) {
        console.error('Error in resetPasswordWithCode:', error);
        return res.status(500).json({ message: 'Server error during password reset.' });
    }
};


module.exports = {
    sendVerificationEmail,
    verifyAndCreateUser,
    sendPasswordResetEmail,
    resetPasswordWithCode,
};
