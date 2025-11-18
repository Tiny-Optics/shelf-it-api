//Import Database Models
const UserModel = require("../models/User-model");
const RismiUserModel = require("../models/RismiUser-model");
const StockModel = require("../models/Stock-model");
const StockLogModel = require("../models/StockLog-model");
const StoreModel = require("../models/Store-model");
const UserStoreBridgeModel = require("../models/UserStoreBridge-model");
const ProductModel = require("../models/Product-model");

//Imports
// const jwt = require("jsonwebtoken");
// const crypto = require('crypto');
const dayjs = require('dayjs'); //Similar to moment. We dont use momentjs because it has now been deprecated.
const mongoose = require('mongoose'); // Add mongoose import for ObjectId

//Import axios for API calls
const axios = require('axios');

//Schedule module
const schedule = require('node-schedule');

//Environment
const bIsDevEnvironment = process.env.DEV_ENVIRONMENT === 'true' ? true : false;

//Email constants
const nodemailer = require("nodemailer");
const sEmailHost = process.env.EMAIL_HOST;
const sEmailUsername = process.env.EMAIL_USERNAME;
const sEmailPassword = process.env.EMAIL_PASSWORD;
const iEmailPort = parseInt(process.env.EMAIL_PORT);
const bEmailSecure = process.env.EMAIL_SECURE;
const sEmailDestination = process.env.EMAIL_DESTINATION;

//GS1 constants
const sGS1ApiUrl = process.env.GS1_API_PRODUCT_URL;

//Global variable for GS1 API token
var sGS1ApiToken = "";

const sStockListDefaultLimit = process.env.STOCK_LIST_DEFAULT_LIMIT ? parseInt(process.env.STOCK_LIST_DEFAULT_LIMIT) : 50;

const transporter = nodemailer.createTransport({
    host: sEmailHost,
    port: iEmailPort,
    secure: bEmailSecure, // true for 465, false for other ports
    auth: {
      user: sEmailUsername,
      pass: sEmailPassword
    }
});

exports.test3 = async (Request, Response) => {

  Response.json({ "message": "Test3 endpoint is working!" });
  return;

  const StockLogs = await StockLogModel.find({SLUser: '6909cde5b71ec724f0ee2b6a'}).lean();

  //For each stock log, count how many times each stock ID appears
  const StockLogCounts = StockLogs.reduce((acc, log) => {
    const stockId = log.StockID.toString();
    acc[stockId] = (acc[stockId] || 0) + 1;
    return acc;
  }, {});

  Response.json({StockLogCounts});

};

exports.test2 = async (Request, Response) => {

  Response.json({ "message": "Test2 endpoint is working!" });
  return;

  //Get all products from database
  const AllProducts = await ProductModel.find().lean();
  const iNumProducts = AllProducts.length;

  //Get all users from database
  const AllUsers = await UserModel.find().lean();
  const iNumUsers = AllUsers.length;

  //Get all stores from database
  const AllStores = await StoreModel.find().lean();

  const iNumSimulations = 500;

  //Simulate stock log entries
  for(let i=0; i<iNumSimulations; i++){

    //Pick a random product
    const RandomProduct = AllProducts[Math.floor(Math.random() * iNumProducts)];

    //Pick a random user
    const RandomUser = AllUsers[Math.floor(Math.random() * iNumUsers)];

    //Pick a random store that the user belongs to
    const UserStores = AllStores.filter(store => store.StoreCreatedBy.toString() === RandomUser._id.toString());

    //Pick a random store from the user's stores
    const RandomStore = UserStores[Math.floor(Math.random() * UserStores.length)];

    //If user has no stores, skip
    if (!RandomStore) {
      continue;
    }

    //Random quantity to add or remove (1 to 100)
    const RandomQuantity = Math.floor(Math.random() * 100) + 1; // Random quantity between 1 and 100

    //Randomly decide to add or remove stock
    var sAction = Math.random() < 0.5 ? 'ADD' : 'REMOVE'; // 50% chance to add or remove stock
    
    //Get the stock item for the product in the store
    var FoundStock = await StockModel.findOne({ StockBarcode: RandomProduct.ProductBarcode, StoreID: RandomStore._id });

    //Create a random date in the past 90 days
    const RandomDate = new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000));
  
    //If stock item not found, create a new stock item
    if (!FoundStock) {            
      const NewStock = new StockModel({
        StockBarcode: RandomProduct.ProductBarcode,
        StoreID: RandomStore._id,
        StockQuantity: RandomQuantity,
        UserID: RandomUser._id, // User who added the stock item
        StockDateAdded: RandomDate, // Date when the stock item was added
        StockLastUpdated: RandomDate, // Date when the stock item was last updated
      });
      await NewStock.save();
      FoundStock = NewStock;
      sAction = 'ADD'; // Since it's a new stock, set action to ADD      

    } else {      
      //Update stock quantity based on action
      if (sAction === 'ADD') {
        FoundStock.StockQuantity += RandomQuantity;
      } else if (sAction === 'REMOVE') {
        // Ensure stock quantity does not go below zero
        FoundStock.StockQuantity = Math.max(0, FoundStock.StockQuantity - RandomQuantity);
      }

    }

    FoundStock.StockLastUpdated = new Date();
    await FoundStock.save();

    //Random number of stock log simulations for this stock action
    //Between 10 and 30
    const iNumStockLogSimulations = Math.floor(Math.random() * 21) + 10;

    for(let j=0; j<iNumStockLogSimulations; j++) {

      //Recreate random quantity and date for multiple log entries
      //Random date in past 90 days
      const RandomDate2 = new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000));
      const sAction2 = Math.random() < 0.5 ? 'ADD' : 'REMOVE'; // 50% chance to add or remove stock
      const RandomQuantity2 = Math.floor(Math.random() * 100) + 1; // Random quantity between 1 and 100

      //Log the stock action
      const NewStockLog = new StockLogModel({
        StockID: FoundStock._id,
        SLAction: sAction2,
        SLQuantity: RandomQuantity2,
        SLUser: RandomUser._id,
        SLDate: RandomDate2,
      });

      await NewStockLog.save();

      console.log(`Stock log ${j+1}: User ${RandomUser.UserEmail} ${sAction} ${RandomQuantity} of Product ${RandomProduct.ProductGtinName} in Store ${RandomStore.StoreName} on ${RandomDate2.toDateString()}`);

    }

    

    console.log(`Simulation ${i+1}: User ${RandomUser.UserEmail} ${sAction} ${RandomQuantity} of Product ${RandomProduct.ProductGtinName} in Store ${RandomStore.StoreName} on ${RandomDate.toDateString()}`);

  }// End for loop

  Response.json({"message": "Test2 endpoint is working!"});
}

exports.AdminUpdateProductDetails = async (Request, Response) => {

  //Gather form data, error handling for undefined body fields
  //Get product ID from parameters
  const ProductID = Request.params.ProductID;

  if (!ProductID) {
    return Response.status(400).json({ "Success": false, "Reason": "Product ID is required" });
  }

  //Get form data from body
  //Get ProductName
  if (!Request.body || typeof Request.body.frmProductGtinName === 'undefined') {
    return Response.status(400).json({ "Success": false, "Reason": "Product GTIN Name is required" });
  }

  //Product name must be at least 2 characters
  if (Request.body.frmProductGtinName.length < 2) {
    return Response.status(400).json({ "Success": false, "Reason": "Product GTIN Name must be at least 2 characters" });
  }

  const sProductGtinName = Request.body.frmProductGtinName;

  //Get product description
  var sProductDescription = "";

  if (typeof Request.body.frmProductDescription !== 'undefined') {
    sProductDescription = Request.body.frmProductDescription;
  }

  //Get product brand name
  var sProductBrandName = "";

  if (typeof Request.body.frmProductBrandName !== 'undefined') {
    sProductBrandName = Request.body.frmProductBrandName;
  }

  //Get product details complete flag
  var bProductDetailsComplete = false;

  if (typeof Request.body.frmProductDetailsComplete !== 'undefined') {
    bProductDetailsComplete = Request.body.frmProductDetailsComplete;
  }

  //Update product in database

  try {
    await ProductModel.findByIdAndUpdate(ProductID, {
      ProductGtinName: sProductGtinName,
      ProductDescription: sProductDescription,
      ProductBrandName: sProductBrandName,
      ProductDetailsComplete: bProductDetailsComplete,
      ProductLastUpdated: new Date(),
      ProductLastUpdatedBy: Request.user._id
    });
    Response.json({ "Success": true });
  } catch (Error) {
    Response.status(500).json({ "Success": false, "Reason": "Failed to update product", "Error": Error.message });
  }
};

exports.AdminGetUnknownProducts = async (Request, Response) => {

  try {
    const UnknownProducts = await ProductModel.find({ ProductDetailsComplete: false }).limit(100).lean();
    Response.json({ "Success": true, "UnknownProducts": UnknownProducts });
  } catch (Error) {
    Response.status(500).json({ "Success": false, "Reason": "Failed to retrieve unknown products", "Error": Error.message });
  }
};

exports.GetMyProfile = async (Request, Response) => {

  const UserID = Request.user._id;

  try {
    const UserProfile = await UserModel.findById(UserID).select('UserEmail UserPhone UserFirstName UserLastName UserDateCreated UserType UserLastLogonDate');
    if (!UserProfile) {
      return Response.status(404).json({ "Success": false, "Reason": "User not found" });
    }
    Response.json({ "Success": true, "Profile": UserProfile });
  } catch (Error) {
    Response.status(500).json({ "Success": false, "Reason": "Failed to retrieve profile", "Error": Error.message });
  }

};

exports.GetRismiProfile = async (Request, Response) => {

  const UserID = Request.user._id;

  try {
    const UserProfile = await RismiUserModel.findById(UserID).select('UserEmail UserFirstName UserLastName UserDateCreated UserType UserLastLogonDate');
    if (!UserProfile) {
      return Response.status(404).json({ "Success": false, "Reason": "User not found" });
    }
    Response.json({ "Success": true, "Profile": UserProfile });
  } catch (Error) {
    Response.status(500).json({ "Success": false, "Reason": "Failed to retrieve profile", "Error": Error.message });
  }

};

exports.GetMyHome = async (Request, Response) => {

  const StoreID = Request.params.StoreID;

  //Check if store id is provided
  if (!StoreID) {
    return Response.status(400).json({ "Success": false, "Reason": "Store ID is required" });
  }

  //Get user id
  const UserID = Request.user._id;

  //Check if store id belongs to the user
  const UserStore = await UserStoreBridgeModel.findOne({ UserID: UserID, StoreID: StoreID });

  if (!UserStore) {
    return Response.status(400).json({ "Success": false, "Reason": "Invalid store ID or user does not belong to the store" });
  }

  //Get low quantity stock items (less than or equal to 5)

  var LowStockItems = [];
  var arrErrors = [];

  try {
    LowStockItems = await StockModel.find({ StoreID: StoreID, StockQuantity: { $lte: 5 } }).sort({ StockQuantity: 1 }).select('_id StockBarcode StockQuantity').limit(10).lean();
  } catch (Error) {
    arrErrors.push("Failed to retrieve low stock items: " + Error.message);
  }

  //Get stock items with the most removals in the past month
  
  var TopSellingProducts = [];
  const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();

  try {
    //Get stocks that belong to my store
    var StockList = await StockModel.find({ StoreID: StoreID }).select('_id StockBarcode').lean();
    
    // Use Promise.all to wait for all async operations to complete
    const stockPromises = StockList.map(async (Stock) => {
      //For each stock, call the stock logs
      const RemovalLogsCount = await StockLogModel.countDocuments({ 
        StockID: Stock._id, 
        SLAction: 'REMOVE', 
        SLDate: { $gte: thirtyDaysAgo } 
      }).exec();
      
      if(RemovalLogsCount > 0){        
        return {
          Barcode: Stock.StockBarcode,          
          Count: RemovalLogsCount
        };
      }
      return null; // Return null for stocks with no removals
    });

    // Wait for all promises to resolve
    const results = await Promise.all(stockPromises);
    
    // Filter out null values and add to TopSellingProducts
    TopSellingProducts = results.filter(item => item !== null);
    
    // Sort by count (highest first) and limit to top 10
    TopSellingProducts.sort((a, b) => b.Count - a.Count).slice(0, 10);
    
  } catch (Error) {
    arrErrors.push("Failed to retrieve top selling products: " + Error.message);
  }

  if(arrErrors.length > 0){
    return Response.status(500).json({"Success": false, "Reason": "Failed to retrieve data", "Errors": arrErrors});
  }

  //Replace barcode with product name in TopSellingProducts and LowStockItems
  const BarcodesToFetch = [];

  LowStockItems.forEach(item => {
    BarcodesToFetch.push(item.StockBarcode);
  });

  TopSellingProducts.forEach(item => {
    BarcodesToFetch.push(item.Barcode);
  });
  

  //Fetch product names from the ProductModel
  const Products = await ProductModel.find({ ProductBarcode: { $in: BarcodesToFetch } }).lean();

  //Replace barcode with product name
  LowStockItems.forEach(item => {
    const Product = Products.find(p => p.ProductBarcode === item.StockBarcode);
    if (Product) {
      item.StockName = Product.ProductGtinName;          
    }
  });

  TopSellingProducts.forEach(item => {
    const Product = Products.find(p => p.ProductBarcode === item.Barcode);
    if (Product) {
      item.StockName = Product.ProductGtinName;
      item.ProductID = Product._id;
    } else {
      item.StockName = 'Unknown Product';      
    }
  });

  return Response.status(200).json({ "Success": true, "LowStockItems": LowStockItems, "TopSellingProducts": TopSellingProducts });

};
  
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

  if(Request.body.frmStoreAddress){
    var sStoreAddress = Request.body.frmStoreAddress.trim();
  }

  if(Request.body.frmStoreCity){
    var sStoreCity = Request.body.frmStoreCity.trim();
  }

  if(Request.body.frmStoreState){
    var sStoreState = Request.body.frmStoreState.trim();
  }

  if(Request.body.frmStoreZipCode){
    var sStoreZipCode = Request.body.frmStoreZipCode.trim();
  }

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
    StoreAddress: sStoreAddress ? toTitleCase(sStoreAddress) : "",
    StoreCity: sStoreCity ? toTitleCase(sStoreCity) : "",
    StoreState: sStoreState ? toTitleCase(sStoreState) : "",
    StoreZipCode: sStoreZipCode ? toTitleCase(sStoreZipCode) : "",
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

  //Check if stock id is provided
  if (!StockID) {
    return Response.status(400).json({ "Success": false, "Reason": "Stock ID is required" });
  }

  //Get user id
  const UserID = Request.user._id;

  //get stock item to find store id
  const StockItemForStore = await StockModel.findOne({ _id: StockID });

  //Check if stock item exists
  if (!StockItemForStore) {
    return Response.status(400).json({ "Success": false, "Reason": "Invalid stock ID" });
  }

  //Check if user belongs to the store
  const UserStore = await UserStoreBridgeModel.findOne({ UserID: UserID, StoreID: StockItemForStore.StoreID });

  if (!UserStore) {
    return Response.status(400).json({ "Success": false, "Reason": "User does not belong to the store" });
  }

  try {
    // Pagination params from body: frmPage, frmLimit
    let page = 1;
    let limit = sStockListDefaultLimit; // reuse default limit
    if (Request.body) {
      if (typeof Request.body.frmPage !== 'undefined') page = parseInt(Request.body.frmPage, 10) || 1;
      if (typeof Request.body.frmLimit !== 'undefined') limit = parseInt(Request.body.frmLimit, 10) || sStockListDefaultLimit;
    }
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 200) limit = 200;
    const skip = (page - 1) * limit;

    const [StockLogs, total] = await Promise.all([
      StockLogModel.find({ StockID: StockID })
        .populate('SLUser', 'UserFullName UserEmail')
        .sort({ SLDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      StockLogModel.countDocuments({ StockID: StockID }).exec()
    ]);

    //Get total number of pages
    const totalPages = Math.ceil(total / limit);

    return Response.status(200).json({ "Success": true, "StockLogs": StockLogs, meta: { total, page, limit, totalPages } });
  } catch (error) {
    console.error('GetStockLogs error:', error);
    return Response.status(500).json({ "Success": false, "Reason": "Error fetching stock logs" });
  }

  

 
};

exports.GetStockList = async (Request, Response) => {

  //Get user store id from parameters
  const StoreID = Request.params.StoreID;

  //Get user id
  const UserID = Request.user._id;

  //Check if store id is provided
  if (!StoreID) {
    return Response.status(400).json({ "Success": false, "Reason": "Store ID is required" });
  }

  //Check if store id belongs to the user
  const UserStore = await UserStoreBridgeModel.findOne({ UserID: UserID, StoreID: StoreID });

  if (!UserStore) {
    return Response.status(400).json({ "Success": false, "Reason": "Invalid store ID or user does not belong to the store" });
  }

  // Pagination params from body: page, limit
  let page = 1;
  let limit = sStockListDefaultLimit; // default
  if (Request.body) {
    if (typeof Request.body.frmPage !== 'undefined') page = parseInt(Request.body.frmPage, 10) || 1;
    if (typeof Request.body.frmLimit !== 'undefined') limit = parseInt(Request.body.frmLimit, 10) || sStockListDefaultLimit;
  }
  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 200) limit = 200; // cap
  const skip = (page - 1) * limit;

  try {
    // Fetch paginated stock list (lean for performance)
    const projection = 'StockBarcode StockQuantity StoreID StockDateAdded StockLastUpdated';

    const [StockList, total] = await Promise.all([
      StockModel.find({ StoreID: StoreID })
        .select(projection)
        .lean()
        .skip(skip)
        .limit(limit)
        .sort({ StockName: 1 })
        .exec(),
      StockModel.countDocuments({ StoreID: StoreID }).exec()
    ]);

    // Batch lookup products for the barcodes in the current page
    const barcodes = StockList.map(s => s.StockBarcode).filter(Boolean);
    let productsByBarcode = {};
    if (barcodes.length > 0) {
      const products = await ProductModel.find({ ProductBarcode: { $in: barcodes } })
        .select('ProductBarcode ProductGtinName')
        .lean()
        .exec();
      productsByBarcode = products.reduce((acc, p) => { acc[p.ProductBarcode] = p; return acc; }, {});
    }

    const MergedStockList = StockList.map(item => ({
      ...item,
      ProductName: (productsByBarcode[item.StockBarcode] && productsByBarcode[item.StockBarcode].ProductGtinName) || 'Unknown Product'
    }));

    //Get total number of pages
    const totalPages = Math.ceil(total / limit);

    return Response.status(200).json({ "Success": true, "StockList": MergedStockList, meta: { total, page, limit, totalPages } });
  } catch (error) {
    console.error('GetStockList error:', error);
    return Response.status(500).json({ "Success": false, "Reason": "Error fetching stock list" });
  }
};

exports.StockUpdate = async(Request, Response) => {

  //Get user id
  const UserID = Request.user._id;

  //Gather form data, error handling for undefined body fields
  if (!Request.body || typeof Request.body.frmStoreID === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Store ID is required"});
  }

  if (typeof Request.body.frmBarcode === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Barcode is required"});
  }

  if (typeof Request.body.frmQuantity === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Quantity is required"});
  }

  if (typeof Request.body.frmAction === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Action is required"});
  }

  const frmStoreID = Request.body.frmStoreID;
  const frmBarcode = Request.body.frmBarcode;
  const frmQuantity = parseInt(Request.body.frmQuantity);
  var frmAction = Request.body.frmAction.toUpperCase(); //add or remove

  //Check form data
  if(!frmStoreID){
    return Response.status(400).json({"Success": false, "Reason": "Store ID is required"});
  }

  if(!frmBarcode){
    return Response.status(400).json({"Success": false, "Reason": "Barcode is required"});
  }

  if(!frmQuantity || isNaN(frmQuantity) || frmQuantity <= 0){
    return Response.status(400).json({"Success": false, "Reason": "Quantity must be a number greater than 0"});
  }

  if(!frmAction || (frmAction !== 'ADD' && frmAction !== 'REMOVE')){
    return Response.status(400).json({"Success": false, "Reason": "Action must be either ADD or REMOVE"});
  }

  //Barcode must be at least 4 characters
  if(frmBarcode.length < 4){
    return Response.status(400).json({"Success": false, "Reason": "Barcode must be at least 4 characters"});
  }

  //barcode must be numeric
  if(isNaN(frmBarcode)){
    return Response.status(400).json({"Success": false, "Reason": "Barcode must be numeric"});
  } 

  //check if store id is valid and belongs to the user
  const UserStore = await UserStoreBridgeModel.findOne({ UserID: UserID, StoreID: frmStoreID });

  if(!UserStore){
    return Response.status(400).json({"Success": false, "Reason": "Invalid store ID or user does not belong to the store"});
  }

  //Find the stock item by barcode and store ID
  var FoundStock = await StockModel.findOne({ StockBarcode: frmBarcode, StoreID: frmStoreID });

  //if stock item not found, create a new stock item
  if (!FoundStock) {

    const NewStock = new StockModel({
      StockBarcode: frmBarcode, // Barcode of the stock item
      StoreID: frmStoreID, // ID of the store this stock item belongs to
      StockQuantity: frmQuantity, // Quantity of the stock item
      UserID: UserID, // User who added the stock item
      StockDateAdded: new Date(), // Date when the stock item was added
      StockLastUpdated: new Date(), // Date when the stock item was last updated
    });

    //Since this is a new stock item, set action to ADD
    frmAction = 'ADD';

    try {
      await NewStock.save();
      FoundStock = NewStock;
    } catch (error) {
      return Response.status(500).json({ "Success": false, "Reason": "Error saving stock item" });
    }

    //Create product in DB
    console.log("Creating product in DB for barcode: " + frmBarcode);
    CreateProductInDB(frmBarcode); //Async, no need to wait for it to complete    

  } else{

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

  }

  FoundStock.StockLastUpdated = new Date(); // Update the last updated date

  try {
    await FoundStock.save();
  } catch (error) {
    return Response.status(500).json({ "Success": false, "Reason": "Error updating stock item" });
  }

  //Log the stock action
  const StockLog = new StockLogModel({
    StockID: FoundStock._id, // ID of the stock item
    SLAction: frmAction, // Action performed (added, removed, updated)
    SLQuantity: frmQuantity, // Quantity of stock item involved in the action
    SLUser: UserID, // User who performed the action
    SLDate: new Date(), // Date when the action was performed
  });

  try {
    await StockLog.save();
  } catch (error) {
    return Response.status(500).json({ "Success": false, "Reason": "Error logging stock action" });
  }

  return Response.status(200).json({ "Success": true, "Stock": FoundStock });
  
};

exports.GetProductByBarcode = async(Request, Response) => {

  const Barcode = Request.params.Barcode;

  //Check if barcode is provided
  if(!Barcode){
    return Response.status(400).json({"Success": false, "Reason": "Barcode is required"});
  }

  //Find product by barcode
  const Product = await ProductModel.findOne({ ProductBarcode: Barcode });

  if(Product){
    return Response.status(200).json({"Success": true, "Product": Product});
  }

  //if product not found, call GS1 API to get product details
  const GS1Response = await GetProductDataFromGS1(Barcode);

  if(!GS1Response.Success){
    return Response.status(404).json({"Success": false, "Reason": GS1Response.Reason});
  }

  console.log("Product not found, calling GS1 API to get product details for barcode: " + Barcode);
  
  //Format product data into expected structure
  const FormattedProduct = {
    ProductBarcode: Barcode,
    ProductGtinName: GS1Response.Product.gtinName,
    ProductDescription: GS1Response.Product.productDescription,
    ProductBrandName: GS1Response.Product.brandName,
    ProductBrandOwnerGLN: GS1Response.Product.brandOwnerGLN,
    ProductBrandOwnerName: GS1Response.Product.brandOwnerName,
    ProductGCCCode: GS1Response.Product.globalClassificationCategory.code,
    ProductGCCName: GS1Response.Product.globalClassificationCategory.name,
    ProductLifespan: GS1Response.Product.minimumTradeItemLifespanFromProduction,
    ProductGrossWeight: GS1Response.Product.grossWeight,
    ProductUnitOfMeasure: GS1Response.Product.sellingUnitOfMeasure,
    ProductCountryOfOrigin: "",
    ProductImageURL: "",
    ProductDetailsComplete: false,
  };

  return Response.status(200).json({"Success": true, "Product": FormattedProduct});

}

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

//Function to create product in database
async function CreateProductInDB(Barcode) {

  if(!Barcode){
    console.log("Barcode is required to create product in DB");
    return;
  }

  //Check if product already exists in the database
  const existingProduct = await ProductModel.findOne({ ProductBarcode: Barcode });
  
  if (existingProduct) {
    console.log("Product already exists in the database");
    return; // Exit if product already exists
  }

  //If product does not exist, call GS1 API to get product details
  const GS1Response = await GetProductDataFromGS1(Barcode);

  var ProductData = {};

  if(GS1Response.Success){
    console.log("Successfully fetched product data from GS1 API");
    ProductData = GS1Response.Product;
    ProductData.ProductDetailsComplete = true;
  }else{
    console.log("Failed to fetch product data from GS1 API: " + GS1Response.Reason);
    ProductData.ProductDetailsComplete = false;
    ProductData.globalClassificationCategory = {
      code: "",
      name: ""
    };
    ProductData.minimumTradeItemLifespanFromProduction = "";
  };
  
  //Create new product document
  const NewProduct = new ProductModel({
    ProductBarcode: Barcode,
    ProductGtinName: ProductData.gtinName,
    ProductDescription: ProductData.productDescription,
    ProductBrandName: ProductData.brandName,
    ProductBrandOwnerGLN: ProductData.brandOwnerGLN,
    ProductBrandOwnerName: ProductData.brandOwnerName,
    ProductGCCCode: ProductData.globalClassificationCategory.code,
    ProductGCCName: ProductData.globalClassificationCategory.name,
    ProductLifespan: ProductData.minimumTradeItemLifespanFromProduction,
    ProductGrossWeight: ProductData.grossWeight,
    ProductUnitOfMeasure: ProductData.sellingUnitOfMeasure,
    ProductCountryOfOrigin: "",
    ProductImageURL: "",
    ProductLastUpdated: new Date(),
    ProductLastUpdatedBy: "SYSTEM",
    ProductAddedDate: new Date(),
    ProductDetailsComplete: ProductData.ProductDetailsComplete,
  });

  try {
    const SavedProduct = await NewProduct.save();
    console.log("Product saved to database: " + SavedProduct._id);
    return;
  } catch (error) {
    console.log("Error saving product to database: " + error.message);
    return;
  }
}

//Function to get product details data from GS1 API
function GetProductDataFromGS1(sBarcode){

  //Ensure barcode is provided
  if(!sBarcode){
    return {"Success": false, "Reason": "Barcode is required to fetch product data from GS1 API"};
  }

  //Fetch product data from GS1 API
  return axios.get(sGS1ApiUrl + sBarcode + "/ZA?token=" + sGS1ApiToken, {
    headers: {
      'content-type': 'application/json',
    }
  })
  .then(response => {
    if(response.data.error){
      return {"Success": false, "Reason": response.data.data};
    }

    const ProductData = response.data.data.products[0];
    return {"Success": true, "Product": ProductData};
  })
  .catch(error => {
    console.log(error);
    return {"Success": false, "Reason": error.message};
  });

}

//Every 45 mins, refresh GS1 API token
const scheduleTask = schedule.scheduleJob('*/45 * * * *', async function(){

  console.log('Refreshing GS1 API token every 45 minutes: ' + new Date().toISOString());
  await RefreshGS1ApiToken();

});

async function RefreshGS1ApiToken() {
  try {
    const response = await axios.post("https://apiprod.trustedsource.co.za/api/login", {
      "email": "sully@seldis.co.za",
      "password": "P@ssword!123"
    });
    console.log("Successfully refreshed GS1 API token" + new Date().toISOString());
    sGS1ApiToken = response.data.response.token;
  } catch (error) {
    console.log("Failed to refresh GS1 API token: " + error.message);
  }
}

//1. Run once on startup
(async () => {
  console.log('Refreshing GS1 API token on startup: ' + new Date().toISOString());
  await RefreshGS1ApiToken();
})();