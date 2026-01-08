const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || "POWERI_PRO_SECURE_KEY_2026";

// --- MIDDLEWARE: VERIFY TOKEN ---
// This ensures only logged-in users can update their profile
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Expects "Bearer TOKEN"
    if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: "Token is not valid" });
    }
};

// --- SIGNUP ROUTE ---
router.post('/signup', async (req, res) => {
    try {
        let { name, mobile, company, email, location, password } = req.body;
        email = email.trim().toLowerCase();

        let userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ msg: "User already registered with this email." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

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

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Email not found." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Incorrect password." });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            msg: "Login successful",
            token,
            user: {
                name: user.name,
                email: user.email,
                company: user.company,
                location: user.location,
                mobile: user.mobile // Added mobile here for dashboard display
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Server error during login." });
    }
});

// --- NEW: UPDATE PROFILE ROUTE (CRITICAL FOR DASHBOARD) ---
router.put('/update-profile', authMiddleware, async (req, res) => {
    try {
        const { name, company, location, mobile } = req.body;
        
        // Find user by ID from the token and update
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { name, company, location, mobile } },
            { new: true } // Returns the updated document
        ).select('-password'); // Don't send password back

        res.json({ msg: "Profile updated successfully", user: updatedUser });
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ error: "Failed to update profile info." });
    }
});

module.exports = router;
