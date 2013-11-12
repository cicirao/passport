var express = require('express'),
	passport = require('passport'),
	util = require('util'),
	path = require('path'),
	http = require('http'),
	oa,
	tw,
	FacebookStrategy = require('passport-facebook').Strategy,
	TwitterStrategy = require('passport-twitter').Strategy,
	user = { id: "abc"};

var FACEBOOK_APP_ID = "184163791771170";
var FACEBOOK_APP_SECRET = "5ca092b4ca6a2265c1842c36bf2eb64c";
var TWITTER_CONSUMER_KEY = "EtXcMyqnlDgvruH85NKsw";
var TWITTER_CONSUMER_SECRET = "gFJ7ST2USrrxF6yZwpkE1CmZaZONJ5cFdo1vg2q2ALQ";

function initTwitterOauth() {
	var OAuth = require('oauth').OAuth;
	oa = new OAuth(
	  "https://twitter.com/oauth/request_token",
	  "https://twitter.com/oauth/access_token",
	  TWITTER_CONSUMER_KEY,
	 	TWITTER_CONSUMER_SECRET,
	 	"1.0A",
  	"http://127.0.0.1:3000/auth/twitter/callback",
	 	"HMAC-SHA1"
  );
}

/*function initFacebookOauth() {
	var OAuth2 = require('oauth').OAuth2;
	oa = new OAuth2(
		server.config.keys.twitter.consumerKey,
       twitterConsumerSecret, 
       'https://api.twitter.com/', 
       null,
       'oauth2/token', 
       null);
     oauth2.getOAuthAccessToken(
       '',
       {'grant_type':'client_credentials'},
       function (e, access_token, refresh_token, results){
       console.log('bearer: ',access_token);
       done();
     });
   });*/

//这个获取tweet的函数不会写，得不到json,也输出不了名字、描述、时间、来自t还是f
/*function getTweet(cb) {
	oa.get(
		"https://api.twitter.com/1.1/users/show.json?screen_name=rsarver",
		user.token, 
		user.tokenSecret,
		function(err,data){
      if(err){
        console.log(err);
        res.send(err);
      } else {
        res.send(JSON.parse(data));
      }
    }
	);
}*/

//Passport session setup.
passport.serializeUser(function(_user, done) {
	user.id = Math.random().toString();
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	done(null, user);
});


//Use the FacebookStrategy within Passport.
passport.use(new FacebookStrategy({
		clientID: FACEBOOK_APP_ID,
		clientSecret: FACEBOOK_APP_SECRET,
		callbackURL: "http://localhost:3000/auth/facebook/callback"
	},
	function(accessToken, refreshToken, profile, done) {
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    user.profile = profile;
    done();
	}
));

//Use the TwitterStrategy within Passport.
passport.use(new TwitterStrategy({
		consumerKey: TWITTER_CONSUMER_KEY,
		consumerSecret: TWITTER_CONSUMER_SECRET,
		callbackURL: "http://127.0.0.1:3000/auth/twitter/callback"
	},
	function(token, tokenSecret, profile, done) {
    user.token = token;
    user.tokenSecret = tokenSecret;
    user.profile = profile;
    initTwitterOauth();
    done(null, user);
	}
));


var app = express();

//configure express
app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.logger());
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.session( { secret: 'keyboard cat'}));
	//Initial passport. Use passport.session() middleware to support
	//persistent login sessions
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));/*
	app.use(passport.use('twi'));*/
});


app.get('/', function(req, res){
  res.render('login', { user: req.user });
});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next(null); }
	else
		console.log("err!");
}

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/content', function(req, res){
 
		  res.render('content', { user: req.user });
		
});

//GET /auth/facebook
app.get('/auth/facebook', passport.authenticate('facebook'));

//GET /auth/facebook/callback
app.get('/auth/facebook/callback', 
	passport.authenticate('facebook', { failureRedirect: '/login' }), 
	function(req, res) {
  	res.redirect('/content');
});


//GET /auth/twitter
app.get('/auth/twitter', passport.authenticate('twitter'));

//GET /auth/twitter/callback
app.get('/auth/twitter/callback', 
	passport.authenticate('twitter', { failureRedirect: '/login' }), 
	function(req, res) {
  	res.redirect('/content');
});

//tweet
/*app.get('/tweet', function (req, res) {
	makeTweet(function(error, data) {
			if(error) {
				console.log(require('sys').inspect(error));
				res.end('bad stuff happened');
			} else {
			  console.log(data);
			  res.end('go check your tweets!');
			}
	});
});*/


app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(3000);
console.log("Server running at http://127.0.0.1:3000 \n");