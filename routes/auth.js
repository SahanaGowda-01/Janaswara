const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const router = express.Router();

router.post('/publicsignUp', async (req, res) => {
    const { name, dob, address, gender, about, email, phone, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.send('Password and Confirm Password did not match');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        name, dob, address, gender, about, email, phone, password: hashedPassword
    });

    try {
        await newUser.save();
        res.redirect('/publiclogin');
    } catch (err) {
        console.log(err);
        res.send('Error saving user');
    }
});

router.post('/publiclogin', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.send('User not found');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
        req.session.userId = user._id;
        res.redirect(`/profile/${user._id}`);
    } else {
        res.send('Incorrect password');
    }
});

// Profile Route
router.get('/profile/:userId', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/publiclogin');
    }

    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.send('User not found');
        }
        res.render('profile', { user });
    } catch (err) {
        console.log(err);
        res.send('Error fetching user data');
    }
});

// Logout Route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send('Error logging out');
        }
        res.redirect('/publiclogin');
    });
});

module.exports = router;

router.post('/update-profile/:userId', async (req, res) => {
    const { name, email, phone, address, about } = req.body;

    if (!req.session.userId) {
        return res.redirect('/publiclogin');
    }

    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.send('User not found');
        }

        user.name = name;
        user.email = email;
        user.phone = phone;
        user.address = address;
        user.about = about;

        await user.save();

        res.redirect(`/profile/${user._id}`);
    } catch (err) {
        console.error(err);
        res.send('Error updating profile');
    }
});
