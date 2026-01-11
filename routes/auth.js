const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const User = require('../models/User');
const Compliance = require('../models/Document'); 

// Missing Model for Community Section:
// const Comment = require('../models/Comment'); 

const JWT_SECRET = process.env.JWT_SECRET || "POWERI_PRO_SECURE_KEY_2026";

// ==========================================
// 1. MIDDLEWARE: VERIFY TOKEN
// ==========================================
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; 
    if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: "Token is not valid" });
    }
};

// NEW: ADMIN-ONLY MIDDLEWARE
const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ msg: "Access denied. Admin privileges required." });
    }
};

// ==========================================
// 2. PUBLIC ROUTES (SIGNUP & LOGIN)
// ==========================================

router.post('/signup', async (req, res) => {
    try {
        let { name, mobile, company, email, location, password } = req.body;
        email = email.trim().toLowerCase();

        let userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ msg: "User already registered." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name, mobile, company, email, location,
            password: hashedPassword,
            isAdmin: false,
            isBlocked: false,
            lastLogin: Date.now() 
        });

        await newUser.save();
        res.status(201).json({ msg: "Registration successful!" });
    } catch (err) {
        res.status(500).json({ error: "Signup failed." });
    }
});

router.post('/login', async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email.trim().toLowerCase();

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Email not found." });

        if (user.isBlocked) {
            return res.status(403).json({ msg: "Account suspended. Please contact PowerI support." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Incorrect password." });

        // TIME ANALYSIS: Update activity
        user.lastLogin = Date.now();
        await user.save();

        const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                company: user.company,
                location: user.location,
                mobile: user.mobile,
                isAdmin: user.isAdmin
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Login failed." });
    }
});

// ==========================================
// 3. USER ROUTES (PROTECTED)
// ==========================================

router.put('/update-profile', authMiddleware, async (req, res) => {
    try {
        const { name, company, location, mobile } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { name, company, location, mobile } },
            { new: true } 
        ).select('-password'); 

        res.json({ msg: "Profile updated successfully", user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: "Update failed." });
    }
});

// ==========================================
// 4. ADMIN ROUTES (EXCLUSIVES)
// ==========================================

// USERS WITH TIME ANALYSIS
router.get('/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ lastLogin: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ msg: "Error fetching users" });
    }
});

// BLOCK / UNBLOCK USER
router.patch('/admin/users/block/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        
        user.isBlocked = !user.isBlocked;
        await user.save();
        res.json({ msg: user.isBlocked ? "User Blocked" : "User Unblocked", isBlocked: user.isBlocked });
    } catch (err) {
        res.status(500).json({ error: "Block action failed" });
    }
});

// DELETE USER PERMANENTLY
router.delete('/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: "User permanently deleted." });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

// VIEW ALL VAULT DOCUMENTS
router.get('/admin/all-docs', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const docs = await Compliance.find().sort({ createdAt: -1 });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ msg: "Error fetching documents" });
    }
});

// COMMUNITY HUB MANAGEMENT
router.get('/admin/comments', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Replace with your actual Comment model if different
        // const comments = await Comment.find().sort({ createdAt: -1 });
        // res.json(comments);
        res.json({ msg: "Feature ready for Comment model integration" });
    } catch (err) {
        res.status(500).json({ msg: "Error fetching comments" });
    }
});

module.exports = router;
