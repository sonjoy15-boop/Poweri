const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// 1. IMPORT ROUTES
const authRoutes = require('./routes/auth');

// 2. IMPORT MODELS (This prevents OverwriteModelError)
const User = require('./models/User');
const Compliance = require('./models/Document'); // Pointing to your Document.js
const Comment = require('./models/Comment');   // Create models/Comment.js if missing

const app = express();

// MIDDLEWARE
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.static(path.join(__dirname, 'public'))); 

// 3. ROUTES
app.use('/api', authRoutes);

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
        // Updated to filter by userEmail if provided in query
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

// 4. DATABASE CONNECTION
const dbURI = process.env.MONGO_URI || "mongodb+srv://sonjoy15:Sonj_123@poweri.da62ewq.mongodb.net/PowerI_DB?retryWrites=true&w=majority";

mongoose.connect(dbURI)
    .then(() => console.log("✅ PowerI Database Connected!"))
    .catch(err => console.log("❌ DB Error:", err.message));

// 5. KEEP-ALIVE & WILDCARD
app.get('/status', (req, res) => res.send("PowerI Backend is active!"));

setInterval(() => {
    axios.get('https://poweri-compliance-portal.onrender.com/status').catch(() => {});
}, 14 * 60 * 1000);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 PowerI Server on Port ${PORT}`));
