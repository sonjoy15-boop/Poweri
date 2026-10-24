'use strict';

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ==========================================
// ROUTES AND MODELS
// ==========================================
const authRoutes = require('./routes/auth');

const User = require('./models/User');
const Compliance = require('./models/Document');
const Comment = require('./models/Comment');

const app = express();

// Render supplies PORT automatically
const PORT = Number(process.env.PORT) || 5000;

// Fail immediately if MongoDB configuration is missing
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('MONGO_URI environment variable is missing.');
    process.exit(1);
}

// Required when Express is behind Render's proxy
app.set('trust proxy', 1);

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(express.json({ limit: '50mb' }));
app.use(
    express.urlencoded({
        limit: '50mb',
        extended: true
    })
);

// In Render, configure CORS_ORIGIN as:
// https://poweri.in,https://www.poweri.in
const allowedOrigins = (
    process.env.CORS_ORIGIN ||
    'https://poweri.in,https://www.poweri.in'
)
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            // Requests without an Origin include direct browser navigation,
            // health checks and same-origin server requests.
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error('Origin not allowed by CORS'));
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    })
);

// Serve the frontend from /public
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// HEALTH CHECK
// Does not require MongoDB, so Render can verify
// that the Node process itself is running.
// ==========================================
app.get('/health', (req, res) => {
    const databaseState =
        mongoose.connection.readyState === 1
            ? 'connected'
            : 'disconnected';

    res.status(200).json({
        status: 'ok',
        service: 'PowerI',
        database: databaseState,
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/status', (req, res) => {
    res.status(200).send('PowerI Backend is active!');
});

// ==========================================
// DATABASE AVAILABILITY CHECK
// ==========================================
function requireDatabase(req, res, next) {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            error: 'Database is temporarily unavailable'
        });
    }

    next();
}

// ==========================================
// API ROUTES
// ==========================================
app.use('/api/auth', requireDatabase, authRoutes);

// IMPORTANT:
// These admin routes should also use authentication/authorization.
// Do not leave these publicly accessible in a final production release.

app.get('/api/admin/users', requireDatabase, async (req, res, next) => {
    try {
        const users = await User.find()
            .select('-password')
            .lean();

        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
});

app.get('/api/admin/all-docs', requireDatabase, async (req, res, next) => {
    try {
        const documents = await Compliance.find()
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json(documents);
    } catch (error) {
        next(error);
    }
});

// ==========================================
// COMMUNITY HUB ROUTES
// ==========================================
app.get('/api/comments', requireDatabase, async (req, res, next) => {
    try {
        const comments = await Comment.find()
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json(comments);
    } catch (error) {
        next(error);
    }
});

app.post('/api/comments', requireDatabase, async (req, res, next) => {
    try {
        const { username, text, parentId } = req.body;

        if (!username || !text) {
            return res.status(400).json({
                error: 'Username and text are required'
            });
        }

        const newComment = await Comment.create({
            username: String(username).trim(),
            text: String(text).trim(),
            parentId: parentId || null
        });

        res.status(201).json(newComment);
    } catch (error) {
        next(error);
    }
});

// ==========================================
// COMPLIANCE DOCUMENT ROUTES
// ==========================================
app.post('/api/save-document', requireDatabase, async (req, res, next) => {
    try {
        const newDocument = await Compliance.create(req.body);

        res.status(201).json({
            message: 'Document saved successfully',
            id: newDocument._id
        });
    } catch (error) {
        next(error);
    }
});

app.get('/api/my-documents', requireDatabase, async (req, res, next) => {
    try {
        const userEmail =
            typeof req.query.email === 'string'
                ? req.query.email.trim().toLowerCase()
                : '';

        const query = userEmail
            ? { userEmail }
            : {};

        const documents = await Compliance.find(query)
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json(documents);
    } catch (error) {
        next(error);
    }
});

app.delete('/api/documents/:id', requireDatabase, async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                error: 'Invalid document ID'
            });
        }

        const deletedDocument =
            await Compliance.findByIdAndDelete(req.params.id);

        if (!deletedDocument) {
            return res.status(404).json({
                error: 'Document not found'
            });
        }

        res.status(200).json({
            message: 'Document deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

// ==========================================
// FRONTEND PAGE ROUTING
// ==========================================
app.get('/admin', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'admin.html')
    );
});

// Use middleware instead of app.get('*').
// This avoids wildcard compatibility issues and must remain
// after all API routes.
app.use((req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }

    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            error: 'API endpoint not found'
        });
    }

    res.sendFile(
        path.join(__dirname, 'public', 'index.html')
    );
});

// ==========================================
// CENTRAL ERROR HANDLER
// ==========================================
app.use((error, req, res, next) => {
    console.error('Request error:', error);

    if (res.headersSent) {
        return next(error);
    }

    if (error.message === 'Origin not allowed by CORS') {
        return res.status(403).json({
            error: 'Origin not allowed'
        });
    }

    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: Object.values(error.errors).map(
                item => item.message
            )
        });
    }

    if (error.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid identifier'
        });
    }

    res.status(500).json({
        error: 'Internal server error'
    });
});

// ==========================================
// DATABASE AND SERVER STARTUP
// ==========================================
let server;

async function startServer() {
    try {
        mongoose.set('strictQuery', true);

        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000
        });

        console.log('PowerI database connected.');

        server = app.listen(PORT, '0.0.0.0', () => {
            console.log(
                `PowerI server running on 0.0.0.0:${PORT}`
            );
        });
    } catch (error) {
        console.error(
            'PowerI startup failed:',
            error.message
        );

        process.exit(1);
    }
}

async function shutdown(signal) {
    console.log(`${signal} received. Shutting down.`);

    try {
        if (server) {
            await new Promise((resolve, reject) => {
                server.close(error => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        }

        await mongoose.connection.close();

        console.log('PowerI shutdown completed.');
        process.exit(0);
    } catch (error) {
        console.error('Shutdown error:', error);
        process.exit(1);
    }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', error => {
    console.error('Unhandled rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

startServer();

module.exports = app;
