// models/user.js
const { fileLoader } = require('ejs');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    dob: Date,
    address: String,
    phone: { type: String, match: /^[0-9]{10}$/ },
    about: String,
    gender: String,
    sector:String,
    department:String,
    designation: String,
    idProof:String,
    photo: String,
    terms: Boolean,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['authority', 'user'], required: true }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
