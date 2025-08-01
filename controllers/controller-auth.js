//Import Database Models
const UserModel = require("../models/User-model");
const StoreModel = require("../models/Store-model");

//Constants
const sHashPasswordSecret = process.env.PW_HASH_SECRET;
const sSessionKey = process.env.JWT_SECRET;

//Imports
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const dayjs = require('dayjs'); //Similar to moment. We dont use momentjs because it has now been deprecated.

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

exports.IsLoggedIn = (Request, Response) => {
  Response.json({ "Success": true });
};

exports.LogoutUser = (Request, Response) => {
  Response.clearCookie("token");
  Response.json({ "Success": true });
};

exports.LoginUser = async (Request, Response) => {

  const sEmail = Request.body.frmEmail.toUpperCase();
  const sPassword = HashPassword(Request.body.frmPassword);

  if(!sEmail || !sPassword){
    Response.status(401);
    Response.json({"Reason": "Login details have not been provided"});
    return;
  };

  UserModel.findOneAndUpdate(({
    UserEmail: sEmail,
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

      //Send cookie to client
      Response.cookie('token', gtoken, { httpOnly: true, maxAge: 3720000, secure: true, sameSite: "strict" });
      Response.json({ "Success": true });

    }else{
      Response.json({"Success": false, "Reason": "Either the account is locked or does not exist. Please check your details or contact support for more info"});
    };

  });

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
https://www.geeksforgeeks.org/javascript-program-to-generate-one-time-password-otp/
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