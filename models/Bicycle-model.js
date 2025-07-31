const mongoose = require ('mongoose');

//String, Boolean, Date, Number - Need to install another module for double or use String.
//No need for ID as MongoDB will auto-gen one for us :)
const BicycleSchema = mongoose.Schema({

  BicycleMake: String,
  BicycleModel: String,
  BicycleYear: String,
  BicycleCategory: String,
  BicycleFrameSize: String,
  BicycleWheelSize: String,
  BicycleWheels: String,
  BicycleFrameMaterial: String,
  BicycleFrontDerailleur: String,
  BicycleRearDerailleur: String,
  BicycleShifters: String,
  BicycleCrankset: String,
  BicycleCassettes: String,
  BicycleBrakes: String,
  BicycleSeatpost: String,
  BicycleImageData: String,
  BicyclePrice: Number,
  BicycleCondition: Boolean, // True for new and false for pre-owned
  BicycleDateAdded: Date,
  BicycleActive: Boolean,
  BicycleAddedBy: String,
  BicycleDescription: String,
  BicycleAdminNotes: String,
  BicyclePromoted: Boolean

});

module.exports = mongoose.model('Bicycle', BicycleSchema, "Bicycles"); //collection name users