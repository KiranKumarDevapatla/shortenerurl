const express = require('express');
const app = express();
const mongoose = require('mongoose');
const ShortUrl = require('./models/shortUrl');
const User = require('./models/user'); // Importing the User model
const session = require('express-session');

// Connecting to the database
mongoose.connect('mongodb+srv://Kiran2601:3001@cluster0.oy8zxqn.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Setting the view engine to EJS
app.set('view engine', 'ejs');

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: false }));

// Session middleware setup
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

// Authentication middleware
const requireLogin = (req, res, next) => {
    if (req.session.userId) {
        next(); // User is authenticated, proceed to the next middleware
    } else {
        res.redirect('/login'); // User is not authenticated, redirect to login page
    }
};

// Homepage route
app.get('/', requireLogin, async (req, res) => {
    try {
        const shortUrls = await ShortUrl.find({ user: req.session.userId });
        res.render('index', { shortUrls: shortUrls });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching short URLs');
    }
});

// Login route
app.get('/login', (req, res) => {
    res.render('login', { errorMessage: null }); // Pass errorMessage as null
});

// Signup route
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Signup POST route
app.post('/signup', async (req, res) => {
    try {
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        });
        await user.save();
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error signing up user');
    }
});

// Login POST route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email, password: password });
        if (user) {
            // Successful login, store user ID in session
            req.session.userId = user._id;
            res.redirect('/');
        } else {
            // Invalid credentials, redirect back to login page with error message
            res.render('login', { errorMessage: 'Invalid email or password' }); // Pass errorMessage
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error logging in');
    }
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Error logging out');
        } else {
            res.redirect('/login');
        }
    });
});

// POST route to create short URLs
app.post('/shortUrls', async (req, res) => {
    try {
        let shortUrlData = {
            full: req.body.fullUrl,
            createdDate: new Date(), // Adding the current date as the creation date
            user: req.session.userId // Associate the short URL with the logged-in user
        };

        if (req.body.customAlias) {
            shortUrlData.short = req.body.customAlias;
        }

        await ShortUrl.create(shortUrlData);
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating short URL');
    }
});



// Redirect route for short URLs
app.get('/:shortUrl', async (req, res) => {
    const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
    if (shortUrl == null) return res.sendStatus(404);

    shortUrl.clicks++;
    shortUrl.save();
    res.redirect(shortUrl.full);
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
