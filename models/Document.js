const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    userEmail: { 
        type: String, 
        required: true,
        index: true 
    },
    formName: { 
        type: String, 
        required: true 
    },
    section: { 
        type: String, 
        required: true 
    },
    formData: { 
        type: Object, 
        required: true 
    },
    pdfFile: { 
        type: String 
    }
}, { 
    timestamps: true 
});

// SYNCED NAME: Changed 'Document' to 'Compliance' to match server.js
module.exports = mongoose.models.Compliance || mongoose.model('Compliance', DocumentSchema);
