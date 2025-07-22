const { Schema, model } = require('mongoose');

const PasswordResetSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
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

module.exports = model('PasswordReset', PasswordResetSchema);
