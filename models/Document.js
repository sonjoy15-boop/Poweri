const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    userEmail: { 
        type: String, 
        required: true,
        index: true // Makes searching for a user's vault much faster
    },
    formName: { 
        type: String, 
        required: true 
    },
    section: { 
        type: String, 
        required: true // Must be "RETURNS", "CEIG", "CSPDCL", etc.
    },
    formData: { 
        type: Object, 
        required: true // Stores all the inputs from your forms
    },
    pdfFile: { 
        type: String // Stores the Base64 string of the generated PDF
    }
}, { 
    timestamps: true 
});

// THE DEPLOYMENT FIX: Check if model exists before compiling
module.exports = mongoose.models.Document || mongoose.model('Document', DocumentSchema);
