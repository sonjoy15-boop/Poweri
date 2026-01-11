const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// 1. IMPORT ROUTES
const authRoutes = require('./routes/auth');

// 2. IMPORT MODELS
// Using the "Safe Export" logic inside these files is better, 
// but we import them here to ensure they are registered in Mongoose.
const User = require('./models/User');
const Compliance = require('./models/Document'); 
const Comment = require('./models/Comment');   

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public'))); 

// ==========================================
// 3. API ROUTES (Must come BEFORE Wildcard)
// ==========================================

// AUTH ROUTES (Login/Signup)
app.use('/api/auth', authRoutes); 

// ADMIN SPECIFIC API DATA
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

app.get('/api/admin/all-docs', async (req, res) => {
    try {
        const docs = await Compliance.find().sort({ createdAt: -1 });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch all documents" });
    }
});

// COMMUNITY HUB ROUTES
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

// COMPLIANCE DOCUMENT ROUTES
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
        const query = req.query.email ? { userEmail: req.query.email } : {};
        const documents = await Compliance.find(query).sort({ createdAt: -1 });
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

// ==========================================
// 4. DATABASE CONNECTION
// ==========================================
const dbURI = process.env.MONGO_URI || "mongodb+srv://sonjoy15:Sonj_123@poweri.da62ewq.mongodb.net/PowerI_DB?retryWrites=true&w=majority";

mongoose.connect(dbURI)
    .then(() => console.log("✅ PowerI Database Connected!"))
    .catch(err => console.log("❌ DB Error:", err.message));

// ==========================================
// 5. PAGE ROUTING & KEEP-ALIVE
// ==========================================
app.get('/status', (req, res) => res.send("PowerI Backend is active!"));

// Render Keep-Alive script
setInterval(() => {
    axios.get('https://poweri-compliance-portal.onrender.com/status').catch(() => {});
}, 14 * 60 * 1000);

// Specific route for Admin Page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// FINAL WILDCARD (Must be the very last route)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 PowerI Server on Port ${PORT}`));
