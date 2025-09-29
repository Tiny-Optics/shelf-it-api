const mongoose = require ('mongoose');

//String, Boolean, Date, Number - Need to install another module for double or use String.
//No need for ID as MongoDB will auto-gen one for us :)
const UserStoreBridgeSchema = mongoose.Schema({

  //Bridge between Users and Stores
  UserID: String, // ID of the user
  StoreID: {type: mongoose.Schema.Types.ObjectId, ref: 'Store'}, // ID of the store, ref to store-model.js
  UserRole: String, // Role of the user in the store: Manager, User
  
});

module.exports = mongoose.model('UserStoreBridge', UserStoreBridgeSchema, "UserStoreBridge"); //collection name UserStoreBridge