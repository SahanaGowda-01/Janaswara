function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) { // Check session and userId
        return next();
    }
    res.redirect('/publiclogin'); // Redirect if not authenticated
}

module.exports = isAuthenticated;
