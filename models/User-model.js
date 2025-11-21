const mongoose = require("mongoose");

//String, Boolean, Date, Number - Need to install another module for double or use String.
//No need for ID as MongoDB will auto-gen one for us :)
const UserSchema = mongoose.Schema({
   //Users for the system
   UserEmail: String,
   UserPhone: String,
   UserSecret: String,
   UserFirstName: String,
   UserLastName: String,
   UserDateCreated: Date,
   UserCreatedBy: String,
   UserLastLogonDate: Date,
   UserActive: Boolean,
   UserLastUpdated: Date,
   UserLastUpdatedBy: String,

   UserType: String, // Admin, User
   //Admin is main administrator for the system
   //User is a person who will scan the items in the store

   UserPhoneVerified: { type: Boolean, default: false }, // Whether the user's phone number has been verified

   isRismiUser: { type: Boolean, default: false }, // Flag to identify RISMI users
});

module.exports = mongoose.model("User", UserSchema, "Users"); //collection name users
