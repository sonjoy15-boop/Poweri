const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    mobile: { 
        type: String, 
        required: true 
    },
    company: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,           
        lowercase: true       
    },
    location: { 
        type: String, 
        required: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    isAdmin: { 
        type: Boolean, 
        default: false 
    },
    // --- NEW: Added for Admin Control ---
    isBlocked: { 
        type: Boolean, 
        default: false 
    },
    // --- NEW: Added for User Time Analysis ---
    lastLogin: { 
        type: Date, 
        default: Date.now 
    }
}, { 
    timestamps: true 
});

// SAFE EXPORT: 
// Prevents OverwriteModelError on Render redeploys
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
