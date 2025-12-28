const express = require('express');
const router = express.Router();
const User = require('../models/User');

// --- SIGNUP ROUTE ---
router.post('/signup', async (req, res) => {
    try {
        const { email } = req.body;
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: "User already registered with this email." });

        // Save new user
        user = new User(req.body);
        await user.save();
        res.status(201).json({ msg: "User created successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- LOGIN ROUTE (NEW) ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "Email not found. Please Sign Up first." });
        }

        // 2. Check if password matches
        if (user.password !== password) {
            return res.status(400).json({ msg: "Incorrect password. Please try again." });
        }

        // 3. If everything is correct, send back user info
        res.json({
            msg: "Login successful",
            user: {
                name: user.name,
                email: user.email,
                company: user.company
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;