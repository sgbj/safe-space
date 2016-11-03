const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const OAuth = require('oauth');
const config = require('./config.json');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'pug');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'magic broccoli',
    resave: true,
    saveUninitialized: true,
}));

passport.use(new TwitterStrategy(
    config.twitter,
    (token, tokenSecret, profile, cb) => {
        profile.token = token;
        profile.tokenSecret = tokenSecret;
        return cb(null, profile);
    }
));
passport.serializeUser(function(user, cb) {
    cb(null, user);
});
passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});
app.use(passport.initialize());
app.use(passport.session());

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/login');
}

function twitter(req, uri, cb) {
    var oauth = new OAuth.OAuth(
        'https://api.twitter.com/oauth/request_token',
        'https://api.twitter.com/oauth/access_token',
        config.twitter.consumerKey,
        config.twitter.consumerSecret,
        '1.0A',
        null,
        'HMAC-SHA1'
    );
    oauth.get(
        uri,
        req.user.token,
        req.user.tokenSecret,         
        cb
    );
}

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback', passport.authenticate('twitter', { 
    successRedirect: '/',
    failureRedirect: '/login', 
    failureFlash: true 
}));

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/logout', ensureAuthenticated, (req, res) => {
    req.logout();
    res.redirect('/login');
});

app.get('/', ensureAuthenticated, (req, res) => {
    res.render('index', { user: req.user })
});

app.get('/api/me', ensureAuthenticated, (req, res) => {
    res.json(req.user);
});

app.get('/api/search', ensureAuthenticated, (req, res) => {
    twitter(req, 'https://api.twitter.com/1.1/search/tweets.json?q=' + encodeURIComponent(req.query.q), function (error, data) {
        if (error) {
            console.error(error);
            res.json({ error });
        } else {
            res.json(JSON.parse(data));
        }  
    });
});

app.listen(3000, () => {
    console.log('Listening...');
});