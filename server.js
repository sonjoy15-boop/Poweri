const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // For the Keep-Alive Ping
require('dotenv').config();

const authRoutes = require('./routes/auth');
const app = express();

// 1. MIDDLEWARE (Supports Heavy PDF Uploads)
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Serve static files from 'public'
app.use(express.static(path.join(__dirname, 'public'))); 

// 2. SCHEMAS & MODELS

// User Schema (Auth)
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Compliance Schema (Documents/Forms)
const complianceSchema = new mongoose.Schema({
    section: String,
    formName: String,
    date: String,
    pdfFile: String, // Stores the Base64 PDF string
    formData: Object, // Stores JSON data from forms
    userEmail: String, // Tracks which user saved which document
    createdAt: { type: Date, default: Date.now }
});
const Compliance = mongoose.model('Compliance', complianceSchema);

// Community Schema (Discussions)
const commentSchema = new mongoose.Schema({
    username: { type: String, required: true },
    text: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    createdAt: { type: Date, default: Date.now }
});
const Comment = mongoose.model('Comment', commentSchema);

// 3. ROUTES

// Auth Integration
app.use('/api', authRoutes);

// --- COMMUNITY HUB ROUTES ---
app.get('/api/comments', async (req, res) => {
    try {
        const comments = await Comment.find().sort({ createdAt: -1 });
        res.status(200).json(comments);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch discussions" });
    }
});

app.post('/api/comments', async (req, res) => {
    try {
        const { username, text, parentId } = req.body;
        const newComment = new Comment({ username, text, parentId: parentId || null });
        await newComment.save();
        res.status(201).json(newComment);
    } catch (err) {
        res.status(500).json({ error: "Failed to save post" });
    }
});

// --- COMPLIANCE DOCUMENT ROUTES ---
app.post('/api/save-document', async (req, res) => {
    try {
        const newDoc = new Compliance(req.body);
        await newDoc.save();
        res.status(200).json({ msg: "Success", id: newDoc._id });
    } catch (err) {
        res.status(500).json({ error: "Failed to save to Database" });
    }
});

app.get('/api/my-documents', async (req, res) => {
    try {
        const documents = await Compliance.find().sort({ createdAt: -1 });
        res.json(documents);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch documents" });
    }
});

app.delete('/api/documents/:id', async (req, res) => {
    try {
        await Compliance.findByIdAndDelete(req.params.id);
        res.status(200).json({ msg: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. DATABASE CONNECTION
const dbURI = process.env.MONGO_URI || "mongodb+srv://sonjoy15:Sonj_123@poweri.da62ewq.mongodb.net/PowerI_DB?retryWrites=true&w=majority";

mongoose.connect(dbURI)
    .then(() => console.log("✅ PowerI Database Connected!"))
    .catch(err => console.log("❌ DB Error:", err.message));

// 5. STATUS & KEEP-ALIVE
app.get('/status', (req, res) => {
    res.send("PowerI Backend is active!");
});

// Self-Ping every 14 mins to stop Render from sleeping
setInterval(() => {
    axios.get('https://poweri-compliance-portal.onrender.com/status')
        .then(() => console.log("Keep-Alive: Server Pinged"))
        .catch(e => console.log("Keep-Alive Error"));
}, 14 * 60 * 1000);

// 6. WILDCARD (Must be last)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 PowerI Server on Port ${PORT}`));
