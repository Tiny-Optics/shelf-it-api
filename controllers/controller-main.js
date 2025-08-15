//Import Database Models
const UserModel = require("../models/User-model");
const StockModel = require("../models/Stock-model");
const StockLogModel = require("../models/StockLog-model");
const StoreModel = require("../models/Store-model");

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