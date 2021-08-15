//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
let ejs = require('ejs');
const encrypt = require("mongoose-encryption");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("Public"));

console.log(process.env.SECRET);
mongoose.connect('mongodb://localhost:27017/Secrets22', {useNewUrlParser: true, useUnifiedTopology: true});

const usersSchema = new mongoose.Schema ({
  username: String,
  password: String
});

usersSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
                                                  //this will encrypt our entire db by default
                                                  // but we don't want to encrypt the userName
                                                  //so we code the last parameter
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
 const userName = req.body.username;
 const password = req.body.password;

     const user = new User({
       username: userName,
       password: password
     });

     User.findOne({username: userName}, function(err, foundUser){
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
     });

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
           if(foundUser.password === password){
             res.render("secrets");
           }else{
             console.log("INCORRECT PASSWORD");
             res.redirect("/login")}
         }else{
           console.log("NOT FOUND");
           res.redirect("/login")}
       }
     });
   })

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
