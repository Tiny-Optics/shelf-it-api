//Import Database Models
const UserModel = require("../models/User-model");
const StockModel = require("../models/Stock-model");
const StockLogModel = require("../models/StockLog-model");
const StoreModel = require("../models/Store-model");
const UserStoreBridgeModel = require("../models/UserStoreBridge-model");

//Imports
// const jwt = require("jsonwebtoken");
// const crypto = require('crypto');
const dayjs = require('dayjs'); //Similar to moment. We dont use momentjs because it has now been deprecated.

//Email constants
const nodemailer = require("nodemailer");
const sEmailHost = process.env.EMAIL_HOST;
const sEmailUsername = process.env.EMAIL_USERNAME;
const sEmailPassword = process.env.EMAIL_PASSWORD;
const iEmailPort = parseInt(process.env.EMAIL_PORT);
const bEmailSecure = process.env.EMAIL_SECURE;
const sEmailDestination = process.env.EMAIL_DESTINATION;

const transporter = nodemailer.createTransport({
    host: sEmailHost,
    port: iEmailPort,
    secure: bEmailSecure, // true for 465, false for other ports
    auth: {
      user: sEmailUsername,
      pass: sEmailPassword
    }
});

exports.GetMyStores = async (Request, Response) => {

  const UserID = Request.user._id;

  try {
    //Find all stores associated with the user from the UserStoreBridgeModel
    //Populate the store details from the StoreModel
    const UserStores = await UserStoreBridgeModel.find({ UserID: UserID }).populate('StoreID');

    Response.json({"Success": true, "Stores": UserStores});
  } catch (Error) {
    Response.status(500).json({"Success": false, "Reason": "Failed to retrieve stores", "Error": Error.message});
  }
};

exports.CreateStore = async (Request, Response) => {
  
  // Error handling for undefined body fields
  if (!Request.body || typeof Request.body.frmStoreName === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Store name is required"});
  }
  if (typeof Request.body.frmStoreAddress === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Store address is required"});
  }
  if (typeof Request.body.frmStoreCity === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Store city is required"});
  }
  if (typeof Request.body.frmStoreState === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Store state is required"});
  }
  if (typeof Request.body.frmStoreZipCode === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Store zip code is required"});
  }
  if (typeof Request.body.frmStoreType === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Store type is required"});
  }
  if (typeof Request.body.frmUseUserDetails === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Use user details flag is required"});
  }

  //Get form data
  var sStoreName = Request.body.frmStoreName;
  var sStorePhone = Request.body.frmStorePhone;
  var sStoreEmail = Request.body.frmStoreEmail;
  const sStoreAddress = Request.body.frmStoreAddress;
  const sStoreCity = Request.body.frmStoreCity;
  const sStoreState = Request.body.frmStoreState;
  const sStoreZipCode = Request.body.frmStoreZipCode;
  const sStoreType = Request.body.frmStoreType;

  var bUseUserDetails = false;

  if(Request.body.frmUseUserDetails === true || Request.body.frmUseUserDetails === 'true'){
    bUseUserDetails = true;
  }

  //Check form data
  if(!sStoreName){
    return Response.status(400).json({"Success": false, "Reason": "Store name is required"});
  }
  if(sStoreName.length < 2){
    return Response.status(400).json({"Success": false, "Reason": "Store name must be 2 characters or more"});
  }
  if(!sStoreAddress){
    return Response.status(400).json({"Success": false, "Reason": "Store address is required"});
  }
  if(!sStoreCity){
    return Response.status(400).json({"Success": false, "Reason": "Store city is required"});
  }
  if(!sStoreState){
    return Response.status(400).json({"Success": false, "Reason": "Store state is required"});
  } 
  if(!sStoreZipCode){
    return Response.status(400).json({"Success": false, "Reason": "Store zip code is required"});
  } 
  if(sStoreZipCode.length != 4){
    return Response.status(400).json({"Success": false, "Reason": "Store zip code must be 4 digits"});
  }
  if(isNaN(sStoreZipCode)){
    return Response.status(400).json({"Success": false, "Reason": "Store zip code must be numeric"});
  }
  if(!sStoreType){
    return Response.status(400).json({"Success": false, "Reason": "Store type is required"});
  }
  if(typeof bUseUserDetails === 'undefined'){
    return Response.status(400).json({"Success": false, "Reason": "Use user details flag is required"});
  }
  if(!bUseUserDetails){
    //If not using user details, check if phone and email are provided
    if(typeof sStorePhone === 'undefined'){
      return Response.status(400).json({"Success": false, "Reason": "Store phone is required"});
    }
    if(!sStorePhone){
      return Response.status(400).json({"Success": false, "Reason": "Store phone is required"});
    }
    if(sStorePhone.length != 10){
      return Response.status(400).json({"Success": false, "Reason": "Store phone must be 10 digits"});
    }
    if(isNaN(sStorePhone)){
      return Response.status(400).json({"Success": false, "Reason": "Store phone must be numeric"});
    }
    if(sStorePhone.charAt(0) != '0'){
      return Response.status(400).json({"Success": false, "Reason": "Store phone must start with 0"});
    }    
    if(typeof sStoreEmail === 'undefined'){
      return Response.status(400).json({"Success": false, "Reason": "Store email is required"});
    }
    if(!sStoreEmail){
      return Response.status(400).json({"Success": false, "Reason": "Store email is required"});
    }
    if(!validateEmail(sStoreEmail)){
      return Response.status(400).json({"Success": false, "Reason": "Store email is not valid"});
    }
  } else {
    //If using user details, get phone and email from user
    sStorePhone = Request.user.UserPhone;
    sStoreEmail = Request.user.UserEmail; 
  }

  //convert store name to title case
  sStoreName = toTitleCase(sStoreName);

  const sUserID = Request.user._id;

  //Check if a store with the same name already exists for this user
  const ExistingStore = await StoreModel.findOne({ UserID: sUserID, StoreName: sStoreName });
  if (ExistingStore) {
    return Response.status(400).json({ "Success": false, "Reason": "Store with the same name already exists" });
  }

  //Create new store
  const NewStore = new StoreModel({
    StoreName: sStoreName,
    StoreCreatedDate: new Date(),
    StoreCreatedBy: sUserID,
    StoreLastUpdated: new Date(),
    StoreLastUpdatedBy: sUserID,
    StoreActive: true,
    StoreType: toTitleCase(sStoreType),
    StoreContactEmail: sStoreEmail,
    StoreContactPhone: sStorePhone,
    StoreAddress: toTitleCase(sStoreAddress),
    StoreCity: toTitleCase(sStoreCity),
    StoreState: toTitleCase(sStoreState),
    StoreZipCode: sStoreZipCode,
  });

  var SavedStore;
  try {
    SavedStore = await NewStore.save();
  } catch (error) {
    return Response.status(500).json({ "Success": false, "Reason": "Error saving store" });
  }

  //Create a UserStoreBridge entry to link the user and store with role as Manager
  const UserStoreBridge = new UserStoreBridgeModel({
    UserID: sUserID,
    StoreID: SavedStore._id,
    UserRole: "Manager",
  });

  try {
    await UserStoreBridge.save();
  } catch (error) {
    return Response.status(500).json({ "Success": false, "Reason": "Error saving user-store bridge" });
  }

  return Response.status(200).json({ "Success": true });

};

exports.GetStockLogs = async (Request, Response) => {
  const StockID = Request.params.StockID;

  //Get user store id
  const UserStoreID = Request.user.StoreID;

  //If user does not have a store id, return error
  if (!UserStoreID) {
    return Response.status(400).json({ "Success": false, "Reason": "User does not belong to a store" });
  }

  //Check if stock id belongs to the user's store
  const StockItem = await StockModel.findOne({ _id: StockID, StoreID: UserStoreID });
  if (!StockItem) {
    return Response.status(404).json({ "Success": false, "Reason": "Stock item not found" });
  }
  //Fetch stock logs for the given StockID and StoreID
  //This assumes that StockID is the ID of the stock item in the Stock collection
  try {
    const StockLogs = await StockLogModel.find({ StockID: StockID });
    return Response.status(200).json({ "Success": true, "StockLogs": StockLogs });
  } catch (error) {
    return Response.status(500).json({ "Success": false, "Reason": "Error fetching stock logs" });
  }
};

exports.GetMyStoreDetails = async (Request, Response) => {
  //Get user store id
  const UserStoreID = Request.user.StoreID;

  //If user does not have a store id, return error
  if (!UserStoreID) {
    return Response.status(400).json({ "Success": false, "Reason": "User does not belong to a store" });
  }

  try {
    const StoreDetails = await StoreModel.findById(UserStoreID);
    return Response.status(200).json({ "Success": true, "StoreDetails": StoreDetails });
  } catch (error) {
    return Response.status(500).json({ "Success": false, "Reason": "Error fetching store details" });
  }
};

exports.GetStockList = async (Request, Response) => {
  //Get user store id
  const UserStoreID = Request.user.StoreID;

  //If user does not have a store id, return error
  if (!UserStoreID) {
    return Response.status(400).json({ "Success": false, "Reason": "User does not belong to a store" });
  }

  try {
    const StockList = await StockModel.find({ StoreID: UserStoreID });
    return Response.status(200).json({ "Success": true, "StockList": StockList });
  } catch (error) {
    return Response.status(500).json({ "Success": false, "Reason": "Error fetching stock list" });
  }
};

exports.StockUpdate = async(Request, Response) => {

  //Get user store id
  const UserStoreID = Request.user.StoreID;
  const UserID = Request.user._id;

  //If user does not have a store id, return error
  if (!UserStoreID) {
    return Response.status(400).json({ "Success": false, "Reason": "User does not belong to a store" });
  }

  const frmBarcode = Request.body.frmBarcode;
  const frmQuantity = parseInt(Request.body.frmQuantity);
  const frmAction = Request.body.frmAction.toUpperCase(); //add or remove

  // Validate input
  if (!frmBarcode || !frmQuantity || !frmAction) {
    return Response.status(400).json({ "Success": false, "Reason": "Invalid input" });
  }

  //Find the stock item by barcode and store ID
  var FoundStock = await StockModel.findOne({ StockBarcode: frmBarcode, StoreID: UserStoreID });

  //if stock item not found, create a new stock item
  if (!FoundStock) {
    const NewStock = new StockModel({
      StockBarcode: frmBarcode,
      //StockName: "Nivea Rose Lotion",
      //StockName: "Vaseline Lotion",
      StockName: "Lipton Ice Tea",
      StoreID: UserStoreID,
      StockQuantity: 13,
      StockAddedBy: UserID,
      StockDateAdded: new Date(),
    });

    try {
      await NewStock.save();
      FoundStock = NewStock;
    } catch (error) {
      return Response.status(500).json({ "Success": false, "Reason": "Error saving stock item" });
    }
  }

  //Update stock quantity based on action
  if (frmAction === 'ADD') {
    FoundStock.StockQuantity += frmQuantity;
  } else if (frmAction === 'REMOVE') {
    FoundStock.StockQuantity -= frmQuantity;
    // Ensure stock quantity does not go below zero
    if (FoundStock.StockQuantity < 0) {
      //Set it to zero if it goes below zero
      FoundStock.StockQuantity = 0;
    }
  }

  try {
    await FoundStock.save();
  } catch (error) {
    return Response.status(500).json({ "Success": false, "Reason": "Error updating stock item" });
  }

  //Log the stock action
  const StockLog = new StockLogModel({
    StockID: FoundStock._id,
    SLAction: frmAction,
    SLQuantity: frmQuantity,
    SLUser: UserID,
    SLDate: new Date(),
  });

  try {
    await StockLog.save();
  } catch (error) {
    return Response.status(500).json({ "Success": false, "Reason": "Error logging stock action" });
  }

  return Response.status(200).json({ "Success": true, "Stock": FoundStock, "StockLog": StockLog });
};

//Arigato stackoverflow
//https://stackoverflow.com/questions/46155/how-can-i-validate-an-email-address-in-javascript
const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

//Function to convert string to Title Case
function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}