const mongoose = require('mongoose');
const bCrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Verification = require('../database/verification');
const Member = require('../database/member');
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

/**
 * Verifies the email and code, and creates a new user if valid.
 */
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


module.exports = {
    sendVerificationEmail,
    verifyAndCreateUser,
};
