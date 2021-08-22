//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require('ejs');
const md5 = require('md5');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("Public"));

mongoose.connect('mongodb://localhost:27017/Secrets22', {useNewUrlParser: true, useUnifiedTopology: true});

const usersSchema = new mongoose.Schema ({
  username: String,
  password: String
});

const User = mongoose.model("User", usersSchema);

app.route("/")
   .get(function(req, res){
     res.render("home");
   })

// -------REGISTER ------
   app.route("/register")
   .get(function(req, res){

     res.render("register");
   })

   .post(function(req, res){


 bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
   const user = new User({
     username: req.body.username,
     password: hash  //STORIG HASH IN OUR PASSWORD DB
   });

   User.findOne({username: req.body.username}, function(err, foundUser){
         if(foundUser){
           res.redirect("register");
         console.log("USER ALREADY SUBCRIBED");
       }else{
         user.save(function(err){
           if(err){
           console.log(err);
         }else{console.log("Succefully saved");}
       });
         res.render("secrets");
     }
   }); });


     })


   // -------LOGIN ------
   app.route("/login")
   .get(function(req, res){
     res.render("login");
   })
   .post(function(req, res){
     const email = req.body.username;
     const password = req.body.password;

     User.findOne({username: email}, function(err, foundUser){
       if(err){console.log(err);
       }else{
         if(foundUser){
           bcrypt.compare(password, foundUser.password, function(err, result) {
if(result === true){
   res.render("secrets");
} else{
     console.log("INCORRECT PASSWORD");
     res.redirect("/login");
   }
 });
   }
 }})
});

   // -------SECRETS ------
   app.route("/secrets")
   .get(function(req, res){
     res.render("secrets");
   })

   // -------SUBMIT ------
   app.route("/submit")
   .get(function(req, res){
     res.render("submit");
   })


app.listen(3000, function(){
  console.log("Server on port 3000");
})
