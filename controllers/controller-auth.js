//Import Database Models
const UserModel = require("../models/User-model");
const RismiUserModel = require("../models/RismiUser-model");
const StoreModel = require("../models/Store-model");

//Constants
const sHashPasswordSecret = process.env.PW_HASH_SECRET;
const sSessionKey = process.env.JWT_SECRET;

//Imports
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const dayjs = require('dayjs'); //Similar to moment. We dont use momentjs because it has now been deprecated.
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

//Twilio constants
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const serviceSid = process.env.TWILIO_SERVICE_SID;
const channel = process.env.TWILIO_CHANNEL || "sms"; //Default to sms if not set

//Email constants
const nodemailer = require("nodemailer");
const sEmailHost = process.env.EMAIL_HOST;
const sEmailUsername = process.env.EMAIL_USERNAME;
const sEmailPassword = process.env.EMAIL_PASSWORD;
const iEmailPort = parseInt(process.env.EMAIL_PORT);
const bEmailSecure = process.env.EMAIL_SECURE;



exports.test = (Request, Response) => {

  // const NewUser = new UserModel({
  //   UserEmail: "SULLYYUSUF303@GMAIL.COM",
  //   UserPhone: "0723065338",
  //   UserSecret: HashPassword("123456789"),
  //   UserFirstName: "SALEEBAAN",
  //   UserLastName: "YUSUF",
  //   UserDateCreated: new Date(),
  //   UserCreatedBy: "SYSTEM",
  //   UserLastLogonDate: new Date(),
  //   UserActive: true,
  //   UserLastUpdated: new Date(),
  //   UserLastUpdatedBy: "SYSTEM",
  //   StoreID: "688b7b8a79048cd613ca9e89",
  //   UserType: "Admin",
  // });

  // NewUser.save().then((User, Error) => {
  //   if(Error){
  //     Response.status(500).json({"Success": false, "Reason": "Failed to create user"});
  //   }else{
  //     Response.json({"Success": true, "User": User});
  //   }
  // });

  

  // const NewStore = new StoreModel({
  //   StoreName: "Sullys Spaza Store",
  //   StoreDescription: "This is a test store",
  //   StoreCreatedDate: new Date(),
  //   StoreCreatedBy: "SYSTEM",
  //   StoreLastUpdated: new Date(),
  //   StoreLastUpdatedBy: "SYSTEM",
  //   StoreActive: true,
  //   StoreType: "Informal",
  //   StoreContactEmail: "test@store.com",
  //   StoreContactPhone: "0112347654",
  //   StoreGeoLocation: "12.3456, 65.4321",
  //   StoreAddress: "123 Test St",
  //   StoreCity: "Johannesburg",
  //   StoreState: "Gauteng",
  //   StoreZipCode: "1234"
  // });

  // NewStore.save().then((Store, Error) => {  
  //   if(Error){
  //     Response.status(500).json({"Success": false, "Reason": "Failed to create store"});
  //   }else{
  //     Response.json({"Success": true, "Store": Store});
  //   }
  // });

  

};

exports.ResetPassword = async (Request, Response) => {

  // Error handling for undefined body fields
  if (!Request.body || typeof Request.body.frmEmail === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Email is required"});
  }

  const sEmail = Request.body.frmEmail;

  //get phone number as well
  if (typeof Request.body.frmPhone === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Phone number is required"});
  }

  const sPhone = Request.body.frmPhone;

  //get new password
  if (typeof Request.body.frmNewPassword === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "New password is required"});
  }

  const sNewPassword = Request.body.frmNewPassword;

  if(!sNewPassword || sNewPassword.length < 8){
    return Response.status(400).json({"Success": false, "Reason": "New password must be at least 8 characters long"});
  }

  //Check email
  if(!sEmail){
    return Response.status(400).json({"Success": false, "Reason": "Email is required"});
  }

  if(!validateEmail(sEmail)){
    return Response.status(400).json({"Success": false, "Reason": "A valid email is required"});
  }

  if(!sPhone){
    return Response.status(400).json({"Success": false, "Reason": "Phone number is required"});
  }

  if(sPhone.length !== 10 || isNaN(sPhone)){
    return Response.status(400).json({"Success": false, "Reason": "Phone number must be 10 characters and be numeric"});
  }

  if(sPhone.charAt(0) !== '0'){
    return Response.status(400).json({"Success": false, "Reason": "Phone number must start with 0"});
  }

  //Get OTP code from user
  if (typeof Request.body.frmOTP === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "OTP code is required"});
  }

  const sOTP = Request.body.frmOTP;

  //Check if there is a registered user with the email and phone number
  const User = await UserModel.findOne({ UserEmail: sEmail.toUpperCase(), UserPhone: sPhone });

  if(!User){
    return Response.status(400).json({"Success": false, "Reason": "Email or phone number is not registered"});
  }
  
  // If we reach this point, all validations have passed
  // Proceed with password reset logic here

  let verificationCheck;
  try {
    verificationCheck = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ code: sOTP, to: '+27' + sPhone });
  } catch (Error) {
    return Response.status(500).json({ "Success": false, "Reason": "Failed to verify code. Please check your details or contact support for more info", "Error": Error.message });
  }

  if (!verificationCheck || !verificationCheck.valid) {
    return Response.status(400).json({ "Success": false, "Reason": "The OTP code is incorrect" });
  }

  UserModel.updateOne({_id: User._id}, { UserSecret: HashPassword(sNewPassword) }).then((Result, Error) => {
    if(Error){
      return Response.status(500).json({"Success": false, "Reason": "Failed to reset password"});
    }else{
      return Response.json({"Success": true});
    }
  });

};

exports.RequestPasswordReset = async (Request, Response) => {

  // Error handling for undefined body fields
  if (!Request.body || typeof Request.body.frmEmail === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Email is required"});
  }

  const sEmail = Request.body.frmEmail;

  //get phone number as well
  if (typeof Request.body.frmPhone === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Phone number is required"});
  }

  const sPhone = Request.body.frmPhone;

  //Check email
  if(!sEmail){
    return Response.status(400).json({"Success": false, "Reason": "Email is required"});
  }

  if(!validateEmail(sEmail)){
    return Response.status(400).json({"Success": false, "Reason": "A valid email is required"});
  }

  if(!sPhone){
    return Response.status(400).json({"Success": false, "Reason": "Phone number is required"});
  }

  if(sPhone.length !== 10 || isNaN(sPhone)){
    return Response.status(400).json({"Success": false, "Reason": "Phone number must be 10 characters and be numeric"});
  }

  if(sPhone.charAt(0) !== '0'){
    return Response.status(400).json({"Success": false, "Reason": "Phone number must start with 0"});
  }

  //Check if there is a registered user with the email and phone number
  const User = await UserModel.findOne({ UserEmail: sEmail.toUpperCase(), UserPhone: sPhone });

  if(!User){
    return Response.status(400).json({"Success": false, "Reason": "Email or phone number is not registered"});
  }

  const Verification = createVerification(User.UserPhone);

  if(!Verification){
    return Response.status(500).json({"Success": false, "Reason": "Failed to send verification code. Please check your details or contact support for more info"});
  }

  // If we reach this point, the verification code was sent successfully
  return Response.json({"Success": true});

};

exports.ResendVerificationOTP = async (Request, Response) => {

  // Error handling for undefined body fields
  if (!Request.body || typeof Request.body.frmPhone === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Phone number is required"});
  }

  const sPhone = Request.body.frmPhone;

  if(!sPhone){
    return Response.status(400).json({"Success": false, "Reason": "Phone number is required"});
  }
  if(sPhone.length !== 10 || isNaN(sPhone)){
    return Response.status(400).json({"Success": false, "Reason": "Phone number must be 10 characters and be numeric"});
  }
  if(sPhone.charAt(0) !== '0'){
    return Response.status(400).json({"Success": false, "Reason": "Phone number must start with 0"});
  }

  //Check if there is a registered user with the phone number
  const User = await UserModel.findOne({ UserPhone: sPhone });

  if(!User){
    return Response.status(400).json({"Success": false, "Reason": "Phone number is not registered"});
  }

  if(User.UserPhoneVerified == true){
    return Response.status(400).json({"Success": false, "Reason": "Phone number is already verified"});
  }

  const verification = createVerification(User.UserPhone);

  if(!verification){
    return Response.status(500).json({"Success": false, "Reason": "Failed to send verification code. Please check your details or contact support for more info"});
  }

  return Response.json({"Success": true, "Message": "Verification code sent"});

};

exports.VerifyPhone = async (Request, Response) => {

  // Error handling for undefined body fields
  if (!Request.body || typeof Request.body.frmPhone === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Phone number is required"});
  }
  if (typeof Request.body.frmCode === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Verification code is required"});
  }

  const sPhone = Request.body.frmPhone;
  const sCode = Request.body.frmCode;

  if(!sPhone){
    return Response.status(400).json({"Success": false, "Reason": "Phone number is required"});
  }
  if(sPhone.length !== 10 || isNaN(sPhone)){
    return Response.status(400).json({"Success": false, "Reason": "Phone number must be 10 characters and be numeric"});
  }
  if(sPhone.charAt(0) !== '0'){
    return Response.status(400).json({"Success": false, "Reason": "Phone number must start with 0"});
  }
  if(!sCode){
    return Response.status(400).json({"Success": false, "Reason": "Verification code is required"});
  }
  if(sCode.length !== 6 || isNaN(sCode)){
    return Response.status(400).json({"Success": false, "Reason": "Verification code must be 6 characters and be numeric"});
  }

  //Check if there is a registered user with the phone number
  const User = await UserModel.findOne({ UserPhone: sPhone });

  if(!User){
    return Response.status(400).json({"Success": false, "Reason": "Phone number is not registered"});
  }

  if(User.UserPhoneVerified == true){
    return Response.status(400).json({"Success": false, "Reason": "Phone number is already verified"});
  }

  let verificationCheck;
  try {
    verificationCheck = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ code: sCode, to: '+27' + sPhone });
  } catch (Error) {
    // Ensure we return immediately after sending an error response so no further responses are attempted
    return Response.status(500).json({ "Success": false, "Reason": "Failed to verify code. Please check your details or contact support for more info", "Error": Error.message });
  }

  if (verificationCheck && verificationCheck.valid == true) {
    //Update user to set phone as verified
    await UserModel.updateOne({ UserPhone: sPhone }, { UserPhoneVerified: true });
    console.log(verificationCheck);
    console.log("Phone number verified");

    return Response.json({ "Success": true });
  } else {
    console.log(verificationCheck);
    console.log("Phone number verification failed");
    return Response.status(400).json({ "Success": false, "Reason": "The verification code is incorrect" });
  }

};

//This function is used in the initial register process from the app
exports.RegisterUser = async (Request, Response) => {

  // Error handling for undefined body fields
  if (!Request.body || typeof Request.body.frmFirstName === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "First name is required"});
  }
  if (typeof Request.body.frmLastName === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Last name is required"});
  }
  if (typeof Request.body.frmEmail === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Email is required"});
  }
  if (typeof Request.body.frmPhone === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Phone number is required"});
  }
  if (typeof Request.body.frmPassword === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Password is required"});
  }

  //Retrieve form data
  const sFirstName = Request.body.frmFirstName;
  const sLastName = Request.body.frmLastName;
  const sEmail = Request.body.frmEmail ? Request.body.frmEmail.toUpperCase() : "";
  const sPhone = Request.body.frmPhone;
  const sPassword = Request.body.frmPassword;

  //Validate form data
  if(!sFirstName){
    return Response.status(400).json({"Success": false, "Reason": "First name is required"});
  }
  if(sFirstName.length < 2){
    return Response.status(400).json({"Success": false, "Reason": "First name must be at least 2 characters"});
  }
  if(!sLastName){
    return Response.status(400).json({"Success": false, "Reason": "Last name is required"});
  }
  if(sLastName.length < 2){
    return Response.status(400).json({"Success": false, "Reason": "Last name must be at least 2 characters"});
  }
  if(!sEmail){
    return Response.status(400).json({"Success": false, "Reason": "Email is required"});
  }
  if(!validateEmail(sEmail)){
    return Response.status(400).json({"Success": false, "Reason": "A valid email is required"});
  }
  if(!sPhone){
    return Response.status(400).json({"Success": false, "Reason": "Phone number is required"});
  }
  if(sPhone.length !== 10 || isNaN(sPhone)){
    return Response.status(400).json({"Success": false, "Reason": "Phone number must be 10 characters and be numeric"});
  }
  if(sPhone.charAt(0) !== '0'){
    return Response.status(400).json({"Success": false, "Reason": "Phone number must start with 0"});
  }
  if(!sPassword){
    return Response.status(400).json({"Success": false, "Reason": "Password is required"});
  }
  if(sPassword.length < 8){
    return Response.status(400).json({"Success": false, "Reason": "Password must be at least 8 characters"});
  }

  //Check if there is a user with the same email
  const ExistingUser = await UserModel.findOne({ UserEmail: sEmail });
  if(ExistingUser){
    return Response.status(400).json({"Success": false, "Reason": "Email is already registered"});
  }

  //check if there is a user with the same phone number
  const ExistingPhone = await UserModel.findOne({ UserPhone: sPhone });
  if(ExistingPhone){
    return Response.status(400).json({"Success": false, "Reason": "Phone number is already registered"});
  }

  //Create new user
  const NewUser = new UserModel({
    UserEmail: sEmail,
    UserPhone: sPhone,
    UserSecret: HashPassword(sPassword),
    UserFirstName: toTitleCase(sFirstName),
    UserLastName: toTitleCase(sLastName),
    UserDateCreated: new Date(),
    UserCreatedBy: "REGISTER",
    UserLastLogonDate: new Date(),
    UserActive: true,
    UserLastUpdated: new Date(),
    UserLastUpdatedBy: "SYSTEM",
    UserType: "User", //Default to User for now
  });

  NewUser.save().then((User, Error) => {
    if(Error){
      Response.status(500).json({"Success": false, "Reason": "Failed to create user"});
    }else{
      Response.json({"Success": true});
      createVerification(User.UserPhone);
    }

  });

};

//Simple function to check if user is logged in
//If the token is invalid, the middleware will return a 401 error before this function is called
//If the token is valid, this function will return a success message
exports.IsLoggedIn = (Request, Response) => {
  Response.json({ "Success": true });
};

exports.LogoutUser = (Request, Response) => {
  Response.clearCookie("token");
  Response.json({ "Success": true });
};

exports.LoginUser = async (Request, Response) => {

  // Error handling for undefined body fields
  if (!Request.body || typeof Request.body.frmPhone === 'undefined' || typeof Request.body.frmPassword === 'undefined') {
    Response.status(400).json({ "Success": false, "Reason": "Phone and password fields are required." });
    return;
  }

  const sPhone = Request.body.frmPhone ? Request.body.frmPhone : "";
  const sPassword = Request.body.frmPassword ? HashPassword(Request.body.frmPassword) : "";

  if(!sPhone || !sPassword){
    Response.status(401);
    Response.json({"Reason": "Login details have not been provided"});
    return;
  };

  //Check phone number is 10 digits
  if(sPhone.length !== 10 || isNaN(sPhone)){
    Response.status(400).json({"Success": false, "Reason": "Phone number must be 10 characters and be numeric"});
    return;
  }

  if(sPhone.charAt(0) !== '0'){
    Response.status(400).json({"Success": false, "Reason": "Phone number must start with 0"});
    return;
  }

  UserModel.findOneAndUpdate(({
    UserPhone: sPhone,
    UserSecret: sPassword,
    UserActive: true,
  }), {
    UserLastLogonDate: new Date(),    
  }).then((User) => {    

    if(User){

      const TokenData = {
        "UserID": User._id
      };

      var gtoken = jwt.sign(TokenData, sSessionKey, {
        expiresIn: "24h", //24 Hours
      });

      //Check if user is verified
      const bIsPhoneVerified = User.UserPhoneVerified;

      //Send cookie to client
      Response.cookie('token', gtoken, { httpOnly: true, maxAge: 3720000, secure: true, sameSite: "strict" });
      Response.json({ "Success": true, "IsPhoneVerified": bIsPhoneVerified });

    }else{
      Response.status(401);
      Response.json({"Success": false, "Reason": "Either the account is locked or does not exist. Please check your details or contact support for more info"});
    };

  });

};

exports.RegisterRismi = async (Request, Response) => {

  // Error handling for undefined body fields
  if (!Request.body || typeof Request.body.frmFirstName === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "First name is required"});
  }
  if (typeof Request.body.frmLastName === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Last name is required"});
  }
  if (typeof Request.body.frmEmail === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Email is required"});
  }
  if (typeof Request.body.frmPassword === 'undefined') {
    return Response.status(400).json({"Success": false, "Reason": "Password is required"});
  }

  //Retrieve form data
  const sFirstName = Request.body.frmFirstName;
  const sLastName = Request.body.frmLastName;
  const sEmail = Request.body.frmEmail ? Request.body.frmEmail.toLowerCase() : "";
  const sPassword = Request.body.frmPassword;

  //Validate form data
  if(!sFirstName){
    return Response.status(400).json({"Success": false, "Reason": "First name is required"});
  }
  if(sFirstName.length < 2){
    return Response.status(400).json({"Success": false, "Reason": "First name must be at least 2 characters"});
  }
  if(!sLastName){
    return Response.status(400).json({"Success": false, "Reason": "Last name is required"});
  }
  if(sLastName.length < 2){
    return Response.status(400).json({"Success": false, "Reason": "Last name must be at least 2 characters"});
  }
  if(!sEmail){
    return Response.status(400).json({"Success": false, "Reason": "Email is required"});
  }
  if(!validateEmail(sEmail)){
    return Response.status(400).json({"Success": false, "Reason": "A valid email is required"});
  }
  if(!sPassword){
    return Response.status(400).json({"Success": false, "Reason": "Password is required"});
  }
  if(sPassword.length < 8){
    return Response.status(400).json({"Success": false, "Reason": "Password must be at least 8 characters"});
  }

  //Check if there is a user with the same email
  const ExistingUser = await RismiUserModel.findOne({ UserEmail: sEmail.toLowerCase() });
  if(ExistingUser){
    return Response.status(400).json({"Success": false, "Reason": "Email is already registered"});
  }

  //Create new RISMI user
  const NewUser = new RismiUserModel({
    UserEmail: sEmail.toLowerCase(),
    UserSecret: HashPassword(sPassword),
    UserFirstName: toTitleCase(sFirstName),
    UserLastName: toTitleCase(sLastName),
    UserDateCreated: new Date(),
    UserCreatedBy: "RISMI_REGISTER",
    UserLastLogonDate: new Date(),
    UserActive: true,
    UserLastUpdated: new Date(),
    UserLastUpdatedBy: "SYSTEM",
    UserType: "Rismi",
  });

  NewUser.save().then((User, Error) => {
    if(Error){
      Response.status(500).json({"Success": false, "Reason": "Failed to create user"});
    }else{
      // Automatically log in the user after registration
      const TokenData = {
        "UserID": User._id,
        "UserType": "Rismi"
      };

      var gtoken = jwt.sign(TokenData, sSessionKey, {
        expiresIn: "24h", //24 Hours
      });

      //Send cookie to client (use different cookie name for RISMI to avoid conflicts)
      Response.cookie('rismi_token', gtoken, { httpOnly: true, maxAge: 86400000, secure: true, sameSite: "strict" }); // 24 hours
      Response.json({
        "Success": true,
        "UserID": User._id,
        "Email": User.UserEmail,
        "FirstName": User.UserFirstName,
        "LastName": User.UserLastName
      });
    }
  });

};

exports.LoginRismi = async (Request, Response) => {

  // Error handling for undefined body fields
  if (!Request.body || typeof Request.body.frmEmail === 'undefined' || typeof Request.body.frmPassword === 'undefined') {
    Response.status(400).json({ "Success": false, "Reason": "Email and password fields are required." });
    return;
  }

  const sEmail = Request.body.frmEmail ? Request.body.frmEmail.toLowerCase() : "";
  const sPassword = Request.body.frmPassword ? HashPassword(Request.body.frmPassword) : "";

  if(!sEmail || !sPassword){
    Response.status(401);
    Response.json({"Success": false, "Reason": "Login details have not been provided"});
    return;
  };

  // Validate email format
  if(!validateEmail(sEmail)){
    Response.status(400).json({"Success": false, "Reason": "Invalid email format"});
    return;
  }

  // Find user by email and password
  RismiUserModel.findOneAndUpdate({
    UserEmail: sEmail,
    UserSecret: sPassword,
    UserActive: true,
  }, {
    UserLastLogonDate: new Date(),    
  }).then((User) => {    

    if(User){

      const TokenData = {
        "UserID": User._id,
        "UserType": "Rismi" // Mark as RISMI user
      };

      var gtoken = jwt.sign(TokenData, sSessionKey, {
        expiresIn: "24h", //24 Hours - session timeout
      });

      //Send cookie to client (use different cookie name for RISMI to avoid conflicts)
      // MaxAge: 24 hours in milliseconds (86400000)
      Response.cookie('rismi_token', gtoken, { httpOnly: true, maxAge: 86400000, secure: true, sameSite: "strict" });
      Response.json({ 
        "Success": true, 
        "UserID": User._id,
        "Email": User.UserEmail,
        "FirstName": User.UserFirstName,
        "LastName": User.UserLastName
      });

    }else{
      Response.status(401);
      Response.json({"Success": false, "Reason": "Invalid email or password. Please check your credentials."});
    };

  });

};

exports.IsLoggedInRismi = (Request, Response) => {
  // If we get here, passport middleware verified the token
  Response.json({ 
    "Success": true,
    "UserID": Request.user._id,
    "Email": Request.user.UserEmail,
    "FirstName": Request.user.UserFirstName,
    "LastName": Request.user.UserLastName
  });
};

exports.LogoutRismi = (Request, Response) => {
  Response.clearCookie("rismi_token");
  Response.json({ "Success": true });
};

//Obtained from: https://nodejs.org/api/crypto.html
function HashPassword(sPassword) {  
  const hash = crypto.createHmac('sha256', sHashPasswordSecret)
    .update(sPassword)
    .digest('hex');
  return hash;
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

// Function to generate OTP
//https://www.geeksforgeeks.org/javascript-program-to-generate-one-time-password-otp/
function GenerateOTP() {
          
  // Declare a digits variable 
  // which stores all digits
  var digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 6; i++ ) {
      OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
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

async function createVerification(sPhoneNumber) {

  //add exception handling
  try {
    const verification = await client.verify.v2

    .services(serviceSid)

    .verifications.create({

      channel: channel, //Use the channel from the environment variable

      to: '+27' + sPhoneNumber,

    });

    console.log(verification);

    return verification;

  } catch (error) {
    console.error("Error creating verification:", error);
    return null;
  }

}