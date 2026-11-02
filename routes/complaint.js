const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/user');
const isAuthenticated = require('../middleware/auth');
const axios = require('axios');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

// Initialize multer
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb('Error: Images Only!');
        }
    },
});

router.get('/raise-complaint/:userId', (req, res) => {
    const userId = req.params.userId; 
    User.findById(userId)
        .then(user => {
            if (!user) {
                return res.status(404).send('User not found');
            }
            res.render('raise-complaint', { user });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error fetching user data');
        });
});

router.post('/raise-complaint/:userId', upload.single('photo'), async (req, res) => {
    const userId = req.params.userId;
    const { title, description, latitude, longitude } = req.body; 

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const photo = req.file ? req.file.filename : null;

        let location = 'Location not provided';
        if (latitude && longitude) {
            try {
                location = await getAreaFromCoordinates(latitude, longitude);
            } catch (err) {
                console.error('Error fetching location from coordinates:', err);
                location = 'Error fetching location';
            }
        }

        const complaint = new Complaint({
            userId,
            title,
            description,
            photo,
            location,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
        });

        await complaint.save();
       res.render('raise-complaint', { user });
    } catch (err) {
        console.error('Error raising complaint:', err);
        res.status(500).send('Error raising complaint');
    }
});

router.get('/my-complaints/:userId', async (req, res) => {
    try {
        const { userId } = req.params; 
        if (!userId) {
            return res.status(400).send('User ID is required');
        }

        const complaints = await Complaint.find({ userId});

        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).send('User not found');
            }
            res.render('my-complaints', { complaints, user });
        } catch (err) {
            console.error('Error rendering the view:', err);
            res.status(500).send('Error rendering the complaints page');
        }
    } catch (err) {
        console.error('Error fetching complaints:', err);
        res.status(500).send('Error fetching complaints');
    }
});

router.get('/public-complaints/:userId', async (req, res) => {
    try {
        const { userId } = req.params; 
        if (!userId) {
            return res.status(400).send('User ID is required');
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        const complaints = await Complaint.find({ status: 'Open' }).populate('userId', 'name');
        //res.render('public-complaints', { complaints, user });
        if(user.role=="authority"){
            res.render('resolve-complaints', { complaints,user });
        }
        else{
            res.render('public-complaints', { complaints, user });
        }
    } catch (err) {
        console.error(err);
        res.send('Error fetching complaints');
    }
});

router.get('/first', async (req, res) => {
    try {
        const complaints = await Complaint.find({ status: 'Open' }).populate('userId', 'name');
        
        res.render('first', { complaints });
    } catch (err) {
        console.error(err);
        res.send('Error fetching complaints');
    }
});


async function getAreaFromCoordinates(latitude, longitude) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

    try {
        const response = await axios.get(url);
        if (response.data && response.data.address) {
            const address = response.data.address;
            
            const city = address.city || address.town || address.village;
            const suburb = address.suburb || '';
            const state = address.state || '';
            const country = address.country || '';

            let location = city || suburb || 'Area not found'; 
            if (!city && suburb) {
                location = `${suburb}, ${state || ''}, ${country || ''}`.trim();
            } else if (!city && !suburb) {
                location = `${state || ''}, ${country || ''}`.trim();
            }

            return location || 'Area not found';
        }
        return 'Area not found';
    } catch (error) {
        console.error('Error fetching location:', error);
        return 'Error retrieving area';
    }
}


router.get('/complaints', async (req, res) => {
    try {
        const complaints = await Complaint.find();
        const complaintsWithLocation = await Promise.all(complaints.map(async (complaint) => {
            if (complaint.latitude && complaint.longitude) {
                const area = await getAreaFromCoordinates(complaint.latitude, complaint.longitude);
                complaint.location = area;  
            } else {
                complaint.location = 'Area not provided';
            }
            return complaint;
        }));

        res.render('public-complaints', { complaints: complaintsWithLocation }); 
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve complaints' });
    }
});

module.exports = router;
