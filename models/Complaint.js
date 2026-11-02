const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({

    title: String,
    description: String,
    photo: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },  // or Buffer if you store image as Binary
    location: String,  // For storing a string description (e.g., "Latitude: 51.505, Longitude: -0.09")
    latitude: Number,  // To store latitude
    longitude: Number, // To store longitude
    date: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['Open', 'Resolved'], // Valid statuses
        default: 'Open'
    }, // Open, Closed, Resolved, etc.
    createdAt: { type: Date, default: Date.now },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'resolvedBy',
    },
});

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;