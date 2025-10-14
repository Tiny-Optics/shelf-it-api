//Import Database Models
const UserModel = require("../models/User-model");
const StockModel = require("../models/Stock-model");
const StockLogModel = require("../models/StockLog-model");
const StoreModel = require("../models/Store-model");
const UserStoreBridgeModel = require("../models/UserStoreBridge-model");
const ProductModel = require("../models/Product-model");

//Imports
// const jwt = require("jsonwebtoken");
// const crypto = require('crypto');
const dayjs = require('dayjs'); //Similar to moment. We dont use momentjs because it has now been deprecated.

//Import axios for API calls
const axios = require('axios');

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
const sGS1ApiToken = process.env.GS1_API_TOKEN;

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

  //Barcode must be 12 or 13 digits
  if(frmBarcode.length != 12 && frmBarcode.length != 13){
    return Response.status(400).json({"Success": false, "Reason": "Barcode must be 12 or 13 digits"});
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

    //Call GS1 API to get product details for new barcode
    //This is done asynchronously and does not affect the stock update process
    getProductDataFromGS1(frmBarcode);

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

  return Response.status(200).json({ "Success": true, "Stock": FoundStock, "StockLog": StockLog });
  
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

  //If product not found, call GS1 API to get product details
  console.log("Product not found in database, fetching from GS1 API");

  axios.get(sGS1ApiUrl + Barcode + "/ZA?token=" + sGS1ApiToken, {
    headers: {
      'content-type': 'application/json',
    }
  })
  .then(response => {
    if(response.data.error){
      console.log("Error from GS1 API: " + response.data.data);
      return Response.status(404).json({"Success": false, "Reason": "Product not found"});
    }

    const ProductData = response.data.data.products[0];

    CreateProductInDB(ProductData, Barcode).then(NewProduct => {
      console.log(NewProduct);
      
      if(NewProduct){
        return Response.status(200).json({"Success": true, "Product": NewProduct});
      } else {
        return Response.status(404).json({"Success": false, "Reason": "Product not found"});
      }
    });

  })
  .catch(error => {
    console.log(error);
    console.log("Error fetching product data from GS1 API: " + error.message);
    return Response.status(404).json({"Success": false, "Reason": error.message});
  });

  //return Response.status(404).json({"Success": false, "Reason": "Product not found"});

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

//Function to get product data from GS1 API
async function getProductDataFromGS1(barcode) {
  //Ensure barcode is provided
  if(!barcode){
    console.log("Barcode is required to fetch product data from GS1 API");
  }

  axios.get(sGS1ApiUrl + barcode + "/ZA?token=" + sGS1ApiToken, {
    headers: {
      'content-type': 'application/json',
    }
  })
  .then(response => {
    if(response.data.error){
      console.log("Error from GS1 API: " + response.data.data);
      return;
    }

    const ProductData = response.data.data.products[0];

    CreateProductInDB(ProductData, barcode);

  })
   .catch(error => {
    console.log(error);
    console.log("Error fetching product data from GS1 API: " + error.message);
  });
}

async function CreateProductInDB(ProductData, Barcode) {

  if(!ProductData || !Barcode){
    console.log("Product data and barcode are required to create product in DB");
    return;
  }

  //Check if product already exists in the database
  const existingProduct = await ProductModel.findOne({ ProductBarcode: Barcode });
  
  if (existingProduct) {
    console.log("Product already exists in the database");
    return; // Exit if product already exists
  }

  //If product does not exist, create a new product
  const NewProduct = new ProductModel({
    ProductBarcode: Barcode,
    ProductGtinName: ProductData.gtinName,
    ProductDescription: ProductData.productDescription || "",
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
  });

  try {
    const SavedProduct = await NewProduct.save();
    console.log("Product saved to database: " + SavedProduct._id);
    return SavedProduct;
  } catch (error) {
    console.log("Error saving product to database: " + error.message);
    return;
  }
}