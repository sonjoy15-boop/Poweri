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
        trim: true,           // Removes accidental spaces
        lowercase: true       // Stores email as 'test@mail.com' even if user types 'Test@Mail.com'
    },
    location: { 
        type: String, 
        required: true 
    },
    password: { 
        type: String, 
        required: true 
    }
    }, 
  isAdmin: { 
        type: Boolean, 
        default: false 
    }
    },                                     
    { 
    timestamps: true // Correct: Automatically creates createdAt and updatedAt
    });

// SAFE EXPORT: 
// Crucial for Render/Deployment to prevent OverwriteModelError
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);


