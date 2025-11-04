const mongoose = require('mongoose');

// Rismi User Schema - Separate collection for Rismi clients
const RismiUserSchema = mongoose.Schema({
  // User authentication
  UserEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  UserSecret: {
    type: String,
    required: true
  },
  
  // User profile
  UserFirstName: {
    type: String,
    required: true
  },
  UserLastName: {
    type: String,
    required: true
  },
  
  // Account metadata
  UserDateCreated: {
    type: Date,
    default: Date.now
  },
  UserCreatedBy: {
    type: String,
    default: "RISMI_REGISTER"
  },
  UserLastLogonDate: {
    type: Date,
    default: Date.now
  },
  UserActive: {
    type: Boolean,
    default: true
  },
  UserLastUpdated: {
    type: Date,
    default: Date.now
  },
  UserLastUpdatedBy: {
    type: String,
    default: "SYSTEM"
  },
  
  // User type is always Rismi for this collection
  UserType: {
    type: String,
    default: "Rismi"
  }
});

module.exports = mongoose.model('RismiUser', RismiUserSchema, "RismiUsers"); // collection name RismiUsers

