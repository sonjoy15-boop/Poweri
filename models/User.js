const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    company: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    location: { type: String, required: true },
    password: { type: String, required: true }
}, { 
    timestamps: true // This adds createdAt and updatedAt automatically
});

// SAFE EXPORT: 
// It checks if the model exists before creating a new one.
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
