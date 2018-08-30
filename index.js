const express = require('express');
const handlebars = require('express-handlebars');
const http = require('http');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const CustomStrategy = require('passport-custom');

const opAuth = require('opskins-oauth');

const app = express();
const server = http.Server(app);

const Handlebars = handlebars.create({
	extname: '.html'
	, partialsDir: './views/partials'
	, helpers: {
		getUsdBal: function(cents) {
			return cents / 100
		}
	}
});
app.engine('html', Handlebars.engine);
app.set('view engine', 'html');
app.set('views', './views');
app.use('/public', express.static('./public'));

let sessionMiddleware = session({
	key: 'session_id'
	, secret: 'almatrass'
	, resave: false
	, saveUninitialized: true
	, cookie: {
		maxAge: 1000 * 60 * 60 * 24 * 365
	}
});
app.use(cookieParser());
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
	done(null, user);
});
passport.deserializeUser((obj, done) => {
	done(null, obj);
});

let OpskinsAuth = new opAuth.init({
	name: 'Testing',
	returnURL: 'http://localhost:3037/auth/opskins/authenticate',
	apiKey: '2087fcb59f2be98c8a5bbfe245669d',
	scopes: 'identity',
	mobile: true
});

passport.use('custom', new CustomStrategy(function (req, done) {
	OpskinsAuth.authenticate(req, (err, user) => {
		if (err) {
			done(err);
		} else {
			done(null, user);
		}
	});
}));
app.get('/', (req, res) => {
	res.render('index', {
		user: req.user
	});
	console.log(req.user);
});
app.get('/auth/opskins', function (req, res) {
	res.redirect(OpskinsAuth.getFetchUrl());
});
app.get('/auth/opskins/authenticate', passport.authenticate('custom', {
	failureRedirect: '/'
}), function (req, res) {
	res.redirect('/');
});
app.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});
server.listen(3037);