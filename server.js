const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const app = express();

// 1. MIDDLEWARE
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public'))); 

// 2. SCHEMAS
const complianceSchema = new mongoose.Schema({
    section: String,
    formName: String,
    date: String,
    pdfFile: String,
    formData: Object,
    createdAt: { type: Date, default: Date.now }
});
const Compliance = mongoose.model('Compliance', complianceSchema);

const commentSchema = new mongoose.Schema({
    username: { type: String, required: true },
    text: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    createdAt: { type: Date, default: Date.now }
});
const Comment = mongoose.model('Comment', commentSchema);

// 3. ROUTES
app.use('/api', authRoutes);

// DELETE DOCUMENT
app.delete('/api/documents/:id', async (req, res) => {
    try {
        const deletedDoc = await Compliance.findByIdAndDelete(req.params.id);
        if (!deletedDoc) return res.status(404).json({ msg: "Document not found" });
        res.status(200).json({ msg: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SAVE DOCUMENT
app.post('/api/save-document', async (req, res) => {
    try {
        const newDoc = new Compliance(req.body);
        await newDoc.save();
        res.status(200).json({ msg: "Success", id: newDoc._id });
    } catch (err) {
        res.status(500).json({ error: "Failed to save to Database" });
    }
});

// FETCH DOCUMENTS
app.get('/api/my-documents', async (req, res) => {
    try {
        const documents = await Compliance.find().sort({ createdAt: -1 });
        res.json(documents);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch documents" });
    }
});

// 4. DATABASE CONNECTION
const dbURI = process.env.MONGO_URI || "mongodb+srv://sonjoy15:Sonj_123@poweri.da62ewq.mongodb.net/PowerI_DB?retryWrites=true&w=majority";

mongoose.connect(dbURI)
    .then(() => console.log("✅ Database Connected Successfully!"))
    .catch(err => console.log("❌ DB Connection Error:", err.message));

// 5. STATUS ROUTE
app.get('/status', (req, res) => {
    res.send("PowerI Backend is active and running!");
});

// 6. WILDCARD ROUTE (REVERTED FOR EXPRESS 4)
// This captures all other requests and sends them to your index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
});
