//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require('ejs');
const passport = require('passport');
const session = require('express-session')
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require("mongoose-findOrCreate");
const GoogleStrategy = require('passport-google-oauth20').Strategy;



const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("Public"));

app.use(session ({
  secret: process.env.GOOGLE_CLIENT_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }

}));



app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb://localhost:27017/Secrets22', {useNewUrlParser: true, useUnifiedTopology: true});

const usersSchema = new mongoose.Schema ({
  username: String,
  password: String,
  googleId: String,
  secret: [{type:String}]
});

usersSchema.plugin(passportLocalMongoose);
usersSchema.plugin(findOrCreate);
const User = mongoose.model("User", usersSchema);

//HERE WE USE PASSPORT-LOCAL.MONGOOSE
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      if(!user){
        res.redirect("/login");
      }else{
      return cb(err, user);
    }
  });}

));

app.route("/")
   .get(function(req, res){
     res.render("home");
   })


// ---GOOGLE AUTH----
app.route("/auth/google")
.get(passport.authenticate("google", {scope: ["profile"]}))

.post(function(req, res){
  // const userId = req.profile.id
  console.log(req.profile.id);

});

// .post(passport.authenticate("google")
app.get("/auth/google/secrets",
passport.authenticate("google", { failureRedirect :"/login"}),
function(req, res){
  res.redirect("/secrets");
});

   // -------SECRETS ------
   app.route("/secrets")
   .get(function(req, res){

    User.find({secret: {$ne: null}}, function(err, foundSecrets){
      if(err){console.log(err);
      }else{
        if(foundSecrets){
          res.render("secrets", {usersWithSecrets: foundSecrets});
        }
      }
    })
  });

// -------REGISTER ------
   app.route("/register")
   .get(function(req, res){

     res.render("register");
   })

   .post(function(req, res){

   User.register({username: req.body.username}, req.body.password,
     function(err, user){
       if(err){console.log(err);
         res.redirect("register");
}else{
  passport.authenticate("local")(req, res, function(){
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    res.redirect("/secrets");
  })
}
  })
});


   // -------LOGIN ------
   app.route("/login")
   .get(function(req, res){
     res.render("login");
   })
   .post(function(req, res){

     const user = new User({
       username: req.body.username,
        password: req.body.password
     })

    req.login(user, function(err){
      if(err){console.log(err);
      }else{
        passport.authenticate("local")(req, res, function(){
          res.redirect("/secrets");
          console.log(user.id);
        })
      }
    });
});


// -------MY ACCOOUNT -----------



app.route("/myaccount")
.get(function(req, res){
  if(req.isAuthenticated()){
    res.redirect("/myaccount/" + req.user.id);
  }else{
    res.redirect("/login");
  }

  console.log(req.user.id);
})

app.route("/myaccount/:userId")
.get(function(req, res){

  User.findById(req.params.userId, function(err, foundUser){
    if(err){ console.log(err);
    }else{
      if(foundUser){
        const username = foundUser.username;
        const googleId = foundUser.id;
        const secrets = foundUser.secret;
        res.render("myaccount", {myUserName: username,
        myGoogleId: googleId,
        mySecrets: secrets});}
    }
  });
})
//   -----LOGOUT-------------
app.route("/logout")
.get(function(req, res){
  req.logout();
  res.redirect("/login");
})


   // -------SUBMIT ------
   app.route("/submit")
   .get(function(req, res){
     if(req.isAuthenticated()){
       res.render("submit");
     }else{
       res.redirect("/login");
     }
   })

   .post(function(req, res){


     User.findById(req.user.id, function(err, foundUser){
       if(err){console.log(err);
       }else{
         if(foundUser){
           // const sec = foun
           foundUser.secret.push(req.body.secret);
           foundUser.save(function(){
             res.redirect("/secrets");
           });
         }
       }
     });
});



app.listen(3000, function(){
  console.log("Server on port 3000");
})
