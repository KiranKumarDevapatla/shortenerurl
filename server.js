// Import necessary modules
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const ShortUrl = require('./models/shortUrl');
const User = require('./models/user'); // Importing the User model
const session = require('express-session');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Connecting to the database with error handling
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).catch(error => console.error('MongoDB connection error:', error));

// Setting the view engine to EJS
app.set('view engine', 'ejs');

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: false }));

// Session middleware setup
app.use(session({
    secret: process.env.SECRET_KEY, 
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
// Homepage route
app.get('/', requireLogin, async (req, res) => {
    try {
        // Fetch the user's username
        const user = await User.findById(req.session.userId);
        const username = user.username;

        // Fetch the short URLs associated with the logged-in user
        const shortUrls = await ShortUrl.find({ user: req.session.userId });

        // Pass the username to the index.ejs template
        res.render('index', { username: username, shortUrls: shortUrls });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching short URLs');
    }
});


// Edit route
app.get('/edit/:id', requireLogin, async (req, res) => {
    try {
        const shortUrl = await ShortUrl.findById(req.params.id);
        if (!shortUrl) {
            return res.status(404).send('Short URL not found');
        }
        res.render('edit', { shortUrl: shortUrl });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching short URL for editing');
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

// Signup POST route with password hashing
app.post('/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10); // Hash the password
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword // Store hashed password in the database
        });
        await user.save();
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error signing up user');
    }
});

// Login POST route with password comparison
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (user) {
            // Compare passwords using bcrypt
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                // Successful login, store user ID in session
                req.session.userId = user._id;
                res.redirect('/');
            } else {
                // Invalid password, redirect back to login page with error message
                res.render('login', { errorMessage: 'Invalid email or password' });
            }
        } else {
            // User not found, redirect back to login page with error message
            res.render('login', { errorMessage: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error logging in');
    }
});

// Logout route with error handling
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

// POST route to create short URLs with schema validation
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

// Edit route to render edit URL form
app.get('/edit/:id', requireLogin, async (req, res) => {
    try {
        const shortUrl = await ShortUrl.findById(req.params.id);
        res.render('edit', { shortUrl: shortUrl });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error rendering edit page');
    }
});

// Update route to update short URL
app.post('/edit/:id', requireLogin, async (req, res) => {
    try {
        await ShortUrl.findByIdAndUpdate(req.params.id, { full: req.body.fullUrl });
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating short URL');
    }
});

// Update route for short URLs
app.post('/shortUrls/:id', async (req, res) => {
    const { fullUrl, customAlias } = req.body;
    try {
        const shortUrl = await ShortUrl.findById(req.params.id);
        if (!shortUrl) {
            return res.status(404).send('Short URL not found');
        }
        shortUrl.full = fullUrl;
        shortUrl.short = customAlias;
        await shortUrl.save();
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating short URL');
    }
});
// Delete route to delete short URL
app.delete('/shortUrls/:id', requireLogin, async (req, res) => {
    try {
        await ShortUrl.findByIdAndDelete(req.params.id);
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting short URL');
    }
});

// Redirect route for short URLs with input sanitization
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
