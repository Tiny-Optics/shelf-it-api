//Import Database Models
const UserModel = require("../models/User-model");
const BicycleModel = require("../models/Bicycle-model");

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

exports.GetAllBicycles = async (Request, Response) => {

  BicycleModel.find({
    BicycleActive: true
  }).select('-BicycleActive -BicycleAddedBy -BicycleAdminNotes').then((Bicycles) => {
    Response.json(Bicycles);
  });

};

exports.GetPromotedBicycles = async (Request, Response) => {

  BicycleModel.find({
    BicyclePromoted: true,
    BicycleActive: true
  }).select('-BicycleActive -BicycleAddedBy -BicycleAdminNotes').limit(2).then((Bicycles) => {
    Response.json(Bicycles);
  });

};

exports.SubmitSellReq = async (Request, Response) => {

    const sfrmBikeMake = Request.body.frmBikeMake;
    const sfrmBikeModel = Request.body.frmBikeModel;
    const sfrmBikeYear = Request.body.frmBikeYear;
    const sfrmBikeCondition = Request.body.frmBikeCondition;
    const sfrmBikeInfo = Request.body.frmBikeInfo;
    const sfrmBikePrice = Request.body.frmBikePrice;
    const sfrmEmail = Request.body.frmEmail;
    const sfrmCellphone = Request.body.frmCellphone;
    const sfrmFullName = Request.body.frmFullName;

    //Generate email test
    var sEmailText = '';
    sEmailText += 'Bike Make: ' + sfrmBikeMake + '\n';
    sEmailText += 'Bike Model: ' + sfrmBikeModel + '\n';
    sEmailText += 'Bike Year: ' + sfrmBikeYear + '\n';
    sEmailText += 'Bike Condition: ' + sfrmBikeCondition + '\n';
    sEmailText += 'Bike Info: ' + sfrmBikeInfo + '\n';
    sEmailText += 'Price Expectations: ' + sfrmBikePrice + '\n';
    sEmailText += 'Email: ' + sfrmEmail + '\n';
    sEmailText += 'Cellphone: ' + sfrmCellphone + '\n';
    sEmailText += 'Full Name: ' + sfrmFullName + '\n';

    const EmailResult = sendEmail(sEmailDestination, 'New Sell Request', sEmailText);

    if(EmailResult){
        console.log('Email sent');
        Response.json({"Success": true});
    }else{
        console.log('Email failed to send');
        Response.json({"Success": false, "Message": "Email failed to send"});
    }

};

const sendEmail = async (to, subject, text) => {
    const mailOptions = {
      from: sEmailUsername,
      to: to,
      subject: subject,
      text: text
    };
  
    try {
      let info = await transporter.sendMail(mailOptions);
      console.log("Message sent: %s", info.messageId);
      return true
    } catch (error) {
      console.error("Error sending email: %s", error);
      return false
    }
  };