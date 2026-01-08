const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // For security
const jwt = require('jsonwebtoken'); // For staying logged in
const User = require('../models/User');

// Use a secret key for JWT (In production, put this in Render Environment Variables)
const JWT_SECRET = process.env.JWT_SECRET || "POWERI_PRO_SECURE_KEY_2026";

// --- SIGNUP ROUTE ---
router.post('/signup', async (req, res) => {
    try {
        let { name, mobile, company, email, location, password } = req.body;

        // Clean up the data (Fixes "space" and "case" errors)
        email = email.trim().toLowerCase();

        // Check if user already exists
        let userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ msg: "User already registered with this email." });

        // Secure the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save new user
        const newUser = new User({
            name,
            mobile,
            company,
            email,
            location,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).json({ msg: "Registration successful! You can now login." });

    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ error: "Server error during registration." });
    }
});

// --- LOGIN ROUTE ---
router.post('/login', async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email.trim().toLowerCase();

        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "Email not found. Please Sign Up first." });
        }

        // 2. Compare Secure Passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Incorrect password. Please try again." });
        }

        // 3. Create a JWT Token (Valid for 7 days)
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

        // 4. Send back user info + Token
        res.json({
            msg: "Login successful",
            token, // Frontend will save this to stay logged in
            user: {
                name: user.name,
                email: user.email,
                company: user.company,
                location: user.location
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Server error during login." });
    }
});

module.exports = router;
