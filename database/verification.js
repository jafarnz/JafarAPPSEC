const { Schema, model } = require('mongoose');

const VerificationSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // This TTL index will automatically delete the document after 15 minutes
        expires: '15m'
    }
});

module.exports = model('Verification', VerificationSchema);
