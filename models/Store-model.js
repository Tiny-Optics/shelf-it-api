const mongoose = require ('mongoose');

//String, Boolean, Date, Number - Need to install another module for double or use String.
//No need for ID as MongoDB will auto-gen one for us :)
const StoreSchema = mongoose.Schema({

  StoreName: String, // Name of the store
  StoreDescription: {type: String, default: ""}, // Description of the store
  StoreCreatedDate: Date, // Date when the store was created
  StoreCreatedBy: String, // User who created the store
  StoreLastUpdated: Date, // Last updated date of the store
  StoreLastUpdatedBy: String, // User who last updated the store
  StoreActive: Boolean, // Whether the store is active or not
  StoreType: String, // Type of the store, Informal, Formal, Hypermarket, etc.
  StoreContactEmail: String, // Contact email for the store
  StoreContactPhone: String, // Contact phone number for the store
  StoreGeoLocation: {type: String, default: ""}, // Geographical location of the store Latidude, Longitude
  StoreAddress: String, // Address of the store
  StoreCity: String, // City where the store is located
  StoreState: String, // State where the store is located
  StoreZipCode: String, // Zip code of the store location
  StoreCompletedSetup: { type: Boolean, default: false }, // Whether the store has completed setup process

});

module.exports = mongoose.model('Store', StoreSchema, "Stores"); //collection name users