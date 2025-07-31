const mongoose = require ('mongoose');

//String, Boolean, Date, Number - Need to install another module for double or use String.
//No need for ID as MongoDB will auto-gen one for us :)
const UserSchema = mongoose.Schema({

  //Users for the system
  UserEmail: String,
  UserSecret: String,
  UserFirstName: String,
  UserLastName: String,
  UserDateCreated: Date,
  UserCreatedBy: String,
  UserLastLogonDate: Date,
  UserActive: Boolean

});

module.exports = mongoose.model('User', UserSchema, "Users"); //collection name users