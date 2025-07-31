//Import Database Models
const UserModel = require("../models/User-model");
const BicycleModel = require("../models/Bicycle-model");

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

exports.AdminDeleteBicycle = (Request, Response) => {

  const sBicycleID = Request.params.id;

  if(!sBicycleID){
    Response.status(400);
    Response.json({"Reason": "Error, Bicycle ID not provided"});
    return;
  };

  BicycleModel.deleteOne({_id: sBicycleID}).then((Result, Error) => {
    if(Error){
      Response.status(500);
      Response.json({"Reason": "Error while deleting bicycle. Please contact support"});      
      return;
    };
    if(Result){
      Response.json({"Success": true});
    }else{
      Response.status(500);
      Response.json({"Reason": "Error while deleting bicycle. Please contact support"});      
    };
  });

};

exports.AdminAddBicycle = (Request, Response) => {

  //Get data from frontend
  const sBikeMake = Request.body.frmBikeMake;
  const sBikeModel = Request.body.frmBikeModel;
  const sBikeYear = Request.body.frmBikeYear;
  const sBikeCategory = Request.body.frmBikeCategory;
  const sBikeFrameSize = Request.body.frmBikeFrameSize;
  const sBikeWheelSize = Request.body.frmBikeWheelSize;
  const sBikeWheels = Request.body.frmBikeWheels;
  const sBikeFrameMaterial = Request.body.frmBikeFrameMaterial;
  const sBikeFrontDerailleur = Request.body.frmBikeFrontDerailleur;
  const sBikeRearDerailleur = Request.body.frmBikeRearDerailleur;
  const sBikeShifters = Request.body.frmBikeShifters;
  const sBikeCrankset = Request.body.frmBikeCrankset;
  const sBikeCassettes = Request.body.frmBikeCassettes;
  const sBikeBrakes = Request.body.frmBikeBrakes;
  const sBikeSeatpost = Request.body.frmBikeSeatpost;

  const bBikeCondition = Request.body.frmBikeCondition;
  const sBikeDescription = Request.body.frmBikeDescription

  var iBikePrice = 0;
  iBikePrice = parseInt(Request.body.frmBikePrice);

  if(isNaN(iBikePrice) || iBikePrice < 1){
    Response.status(400);
    Response.json({"Reason": "Error, Please enter a valid price for the bicycle"});
    return;
  }

  if(!sBikeMake){
    Response.status(400);
    Response.json({"Reason": "Error, Please enter the make of the bicycle"});
    return;
  }

  if(!sBikeModel){
    Response.status(400);
    Response.json({"Reason": "Error, Please enter the model of the bicycle"});
    return;
  }

  if(!sBikeYear){
    Response.status(400);
    Response.json({"Reason": "Error, Please enter the year of the bicycle"});
    return;
  }

  if(!sBikeCategory){
    Response.status(400);
    Response.json({"Reason": "Error, Please enter the category of the bicycle"});
    return;
  }

  //Create new bicycle
  const NewBicycle = new BicycleModel({
    BicycleMake: sBikeMake,
    BicycleModel: sBikeModel,
    BicycleYear: sBikeYear,
    BicycleCategory: sBikeCategory,
    BicycleFrameSize: sBikeFrameSize,
    BicycleWheelSize: sBikeWheelSize,
    BicycleWheels: sBikeWheels,
    BicycleFrameMaterial: sBikeFrameMaterial,
    BicycleFrontDerailleur: sBikeFrontDerailleur,
    BicycleRearDerailleur: sBikeRearDerailleur,
    BicycleShifters: sBikeShifters,
    BicycleCrankset: sBikeCrankset,
    BicycleCassettes: sBikeCassettes,
    BicycleBrakes: sBikeBrakes,
    BicycleSeatpost: sBikeSeatpost,
    BicycleImageData: "",
    BicyclePrice: iBikePrice,
    BicycleCondition: bBikeCondition,
    BicycleDateAdded: new Date(),
    BicycleActive: false,
    BicycleAddedBy: Request.user.UserFirstName + " " + Request.user.UserLastName,
    BicycleDescription: sBikeDescription,
    BicycleAdminNotes: "",
    BicyclePromoted: false
  });

  NewBicycle.save().then((Bicycle, Error) => {
    if(Error){
      Response.status(500);
      Response.json({"Reason": "Error while saving bicycle. Please contact support"});      
      return;
    };
    if(Bicycle){
      Response.json({"Success": true});
    }else{
      Response.status(500);
      Response.json({"Reason": "Error while saving bicycle. Please contact support"});      
    };
  });

};

exports.AdminToggleActive = (Request, Response) => {

  const sBikeID = Request.body.sBikeID;

  if(!sBikeID){
    Response.status(400);
    Response.json({"Reason": "Error, Bicycle ID not provided"});
    return;
  };

  const bNewActive = Request.body.bNewActive;

  BicycleModel.findOneAndUpdate({_id: sBikeID}, {BicycleActive: bNewActive}).then((Bicycle, Error) => {
    
    if(Error){
      Response.status(500);
      Response.json({"Reason": "Error while updating active status. Please contact support"});      
      return;
    };

    if(Bicycle){
      Response.json({"Success": true});
    }else{
      Response.status(500);
      Response.json({"Reason": "Error while updating active status. Please contact support"});      
    };

  });

};

exports.AdminTogglePromotion = (Request, Response) => {

  const sBikeID = Request.body.sBikeID;

  if(!sBikeID){
    Response.status(400);
    Response.json({"Reason": "Error, Bicycle ID not provided"});
    return;
  };

  const bNewPromotion = Request.body.bNewPromotion;

  BicycleModel.findOneAndUpdate({_id: sBikeID}, {BicyclePromoted: bNewPromotion}).then((Bicycle, Error) => {

    if(Error){
      Response.status(500);
      Response.json({"Reason": "Error while updating promotion. Please contact support"});      
      return;
    };

    if(Bicycle){
      Response.json({"Success": true});
    }else{
      Response.status(500);
      Response.json({"Reason": "Error while updating promotion. Please contact support"});      
    };

  });

};

exports.AdminUpdateBicycleByID = (Request, Response) => {

  //Get data from frontend
  const sBicycleID = Request.params.id;

  const sBikeMake = Request.body.frmBikeMake;
  const sBikeModel = Request.body.frmBikeModel;
  const sBikeYear = Request.body.frmBikeYear;
  const sBikeCategory = Request.body.frmBikeCategory;
  const sBikeFrameSize = Request.body.frmBikeFrameSize;
  const sBikeWheelSize = Request.body.frmBikeWheelSize;
  const sBikeWheels = Request.body.frmBikeWheels;
  const sBikeFrameMaterial = Request.body.frmBikeFrameMaterial;
  const sBikeFrontDerailleur = Request.body.frmBikeFrontDerailleur;
  const sBikeRearDerailleur = Request.body.frmBikeRearDerailleur;
  const sBikeShifters = Request.body.frmBikeShifters;
  const sBikeCrankset = Request.body.frmBikeCrankset;
  const sBikeCassettes = Request.body.frmBikeCassettes;
  const sBikeBrakes = Request.body.frmBikeBrakes;
  const sBikeSeatpost = Request.body.frmBikeSeatpost;
  const sBikePrice = Request.body.frmBikePrice;
  const sBikeCondition = Request.body.frmBikeCondition;
  const sBikeDescription = Request.body.frmBikeDescription;

  //Check if bicycle id is provided
  if(!sBicycleID){
    Response.status(400);
    Response.json({"Reason": "Error, Bicycle ID not provided"});
    return;
  };

  //Check data
  if (!sBikeMake){
    Response.status(400);
    Response.json({"Reason": "Error, Please enter the make of the bicycle"});
    return;
  }

  if (!sBikeModel){
    Response.status(400);
    Response.json({"Reason": "Error, Please enter the model of the bicycle"});
    return;
  }

  if (!sBikeYear){
    Response.status(400);
    Response.json({"Reason": "Error, Please enter the year of the bicycle"});
    return;
  }

  if (!sBikeCategory){
    Response.status(400);
    Response.json({"Reason": "Error, Please enter the category of the bicycle"});
    return;
  }

  if(!sBikePrice){
    Response.status(400);
    Response.json({"Reason": "Error, Please enter the price of the bicycle"});
    return;
  }

  var iBikePrice = 0;

  try{
    iBikePrice = parseInt(sBikePrice);
  }catch(Error){
    Response.status(400);
    Response.json({"Reason": "Error, Please enter a valid price for the bicycle"});
    return;
  }

  if(iBikePrice < 1){
    Response.status(400);
    Response.json({"Reason": "Error, Please enter a valid price for the bicycle"});
    return;
  }

  //Update bicycle
  BicycleModel.findOneAndUpdate({_id: sBicycleID}, {
    BicycleMake: sBikeMake,
    BicycleModel: sBikeModel,
    BicycleYear: sBikeYear,
    BicycleCategory: sBikeCategory,
    BicycleFrameSize: sBikeFrameSize,
    BicycleWheelSize: sBikeWheelSize,
    BicycleWheels: sBikeWheels,
    BicycleFrameMaterial: sBikeFrameMaterial,
    BicycleFrontDerailleur: sBikeFrontDerailleur,
    BicycleRearDerailleur: sBikeRearDerailleur,
    BicycleShifters: sBikeShifters,
    BicycleCrankset: sBikeCrankset,
    BicycleCassettes: sBikeCassettes,
    BicycleBrakes: sBikeBrakes,
    BicycleSeatpost: sBikeSeatpost,
    BicyclePrice: iBikePrice,
    BicycleCondition: sBikeCondition,
    BicycleDescription: sBikeDescription,    
  }, {returnDocument: 'after'}).then((Bicycle, Error) => {
    if(Error){
      Response.status(500);
      Response.json({"Reason": "Error while updating bicycle. Please contact support"});      
      return;
    };
    if(Bicycle){
      Response.json({"Success": true, Bicycle});
    }else{
      Response.status(500);
      Response.json({"Reason": "Error while updating bicycle. Please contact support"});      
    };
  });


};

exports.AdminGetBicycleByID = (Request, Response) => {

  const sBicycleID = Request.params.id;

  if(!sBicycleID){
    Response.status(400);
    Response.json({"Reason": "Error, Bicycle ID not provided"});
    return;
  };

  BicycleModel.findOne({_id: sBicycleID}).then((Bicycle) => {
    if(Bicycle){
      Response.json({"Success": true, Bicycle});
    }else{
      Response.status(500);
      Response.json({"Reason": "Error, Bicycle not found. Please contact support"});
    };
  });

};

exports.AdminUpdateBicycleNotes = (Request, Response) => {

  const sBicycleID = Request.body.sBicycleID;
  const sAdminNotes = Request.body.sAdminNotes;

  if(!sBicycleID){
    Response.status(400);
    Response.json({"Reason": "Error, Bicycle ID not provided"});
    return;
  };

  BicycleModel.findOneAndUpdate({_id: sBicycleID}, {BicycleAdminNotes: sAdminNotes}).then((Bicycle, Error) => {
    if(Error){
      Response.status(500);
      Response.json({"Reason": "Error while updating notes. Please contact support"});      
      return;
    };
    if(Bicycle){
      Response.json({"Success": true});
    }else{
      Response.status(500);
      Response.json({"Reason": "Error while updating notes. Please contact support"});      
    };
  });

};

exports.AdminGetAllBicycles = (Request, Response) => {

  BicycleModel.find().then((Bicycles) => {
    Response.json(Bicycles);
  });

}

exports.ResetUserPassword = async (Request, Response) => {

  const sUserID = Request.body.sUserID;

  if(!sUserID){
    Response.status(400);
    Response.json({"Reason": "Error, No user ID provided"});
    return;
  };

  const sNewPassword = Request.body.sNewPassword;

  if(!sNewPassword || sNewPassword.length < 8){
    Response.status(400);
    Response.json({"Reason": "Error, Password must be at least 8 characters"});
    return;
  };

  //Update password

  UserModel.findOneAndUpdate({_id: sUserID}, {
    UserSecret: HashPassword(sNewPassword),
  }).then((User, Error) => {

    if(Error){
      Response.status(500);
      Response.json({"Reason": "Error while updating password. Please contact support"});
      return;
    };

    if(User){
      Response.json({"Success": true});
    }else{
      Response.status(500);
      Response.json({"Reason": "Error while updating password. Please contact support"});
    }

  });



};

exports.AddUser = async (Request, Response) => {

  const sFirstName = Request.body.sFirstName;
  const sLastName = Request.body.sLastName;
  const sEmail = Request.body.sEmail;
  const sPassword = Request.body.sPassword;

  if(!sFirstName || sFirstName.length < 3){
    console.log('here');
    
    Response.status(400);
    Response.json({"Reason": "Error, Please enter a first name"});
    return;
  };

  if(!sLastName || sLastName.length < 3){
    Response.status(400);
    Response.json({"Reason": "Error, Please enter a last name"});
    return;
  };

  if(!sEmail || !validateEmail(sEmail)){
    Response.status(400);
    Response.json({"Reason": "Error, Please enter a valid email address"});
    return;
  };

  if(!sPassword || sPassword.length < 8){
    Response.status(400);
    Response.json({"Reason": "Error, Password must be at least 8 characters"});
    return;
  };

  //Check if user already exists
  const FoundUser = await UserModel.findOne({UserEmail: sEmail.toUpperCase()});  

  if(FoundUser){
    Response.status(400);
    Response.json({"Reason": "Error, This email is already registered"});
    return;
  }

  //Create new user
  const NewUser = new UserModel({
    UserEmail: sEmail.toUpperCase(),
    UserSecret: HashPassword(sPassword),
    UserFirstName: sFirstName.toUpperCase(),
    UserLastName: sLastName.toUpperCase(),
    UserDateCreated: new Date(),
    UserCreatedBy: Request.user.UserEmail,
    UserLastLogonDate: new Date(),
    UserActive: true,    
  });

  NewUser.save().then((User, Error) => {

    if(Error){
      Response.status(500);
      Response.json({"Reason": "Error while saving user. Please contact support"});
      return;
    };

    if(User){
      Response.json({"Success": true});
    }else{
      Response.status(500);
      Response.json({"Reason": "Error while saving user. Please contact support"});
    };

  });
  

};

exports.ToggleUserActive = (Request, Response) => {

  const sUserID = Request.body.frmUserID;
  const bNewActive = Request.body.frmNewActive;

  if(!sUserID){
    Response.status(400);
    Response.json({"Success": false, "Reason": "Error, No user ID provided"});
    return;
  };

  UserModel.findOneAndUpdate({_id: sUserID}, {
    UserActive: bNewActive
  }).then((User, Error) => {
    if(Error){
      Response.status(500);
      Response.json({"Success": false, "Reason": "Error while updating user. Please contact support"});      
      return;
    };
    if(User){
      Response.json({"Success": true});
    }else{
      Response.status(500);
      Response.json({"Success": false, "Reason": "Error while updating user. Please contact support"});      
    };
  });

};

exports.GetAllUsers = (Request, Response) => {

  UserModel.find().select("-UserSecret").then((Users) => {
    Response.json(Users);
  });

};

exports.test = (Request, Response) => {

  // BicycleModel.find({
  //     BicyclePromoted: true,
  //     BicycleActive: true
  //   }).select('-BicycleActive -BicycleAddedBy -BicycleAdminNotes').limit(2).then((Bicycles) => {
  //     Response.json(Bicycles);
  //   });

  // const NewBicycle = new BicycleModel({
  //   BicycleMake: "Giant Stance",
  //   BicycleModel: "E Plus (XL)",
  //   BicycleYear: "2023",
  //   BicycleCategory: "E-Bikes",
  //   BicycleFrameSize: "12 MM",
  //   BicycleWheelSize: "12 Inches",
  //   BicycleWheels: "Giant XCT",
  //   BicycleFrameMaterial: "Carbon Fiber",
  //   BicycleFrontDerailleur: "N/A",
  //   BicycleRearDerailleur: "N/A",
  //   BicycleShifters: "12 Speed",
  //   BicycleCrankset: "N/A",
  //   BicycleCassettes: "N/A",
  //   BicycleBrakes: "Disc Brakes",
  //   BicycleSeatpost: "Copper",
  //   BicycleImageData: "",
  //   BicyclePrice: 120000,
  //   BicycleCondition: false,
  //   BicycleDateAdded: new Date(),
  //   BicycleActive: true,
  //   BicycleAddedBy: "ABDULLAH MANSURI",
  //   BicycleDescription: "Battery Giant energy pak smart 500",
  //   BicycleAdminNotes: "Second bicycle just for testing",
  //   BicyclePromoted: true
  // });

  // NewBicycle.save().then((User, Error) => {  
  //   console.log(User);    
  // });

  // const NewUser = new UserModel({
  //   UserEmail: "ABDULLAH@ABDTECH.IO",
  //   UserSecret: HashPassword("123456789"),
  //   UserFirstName: "ABDULLAH",
  //   UserLastName: "MANSURI",
  //   UserDateCreated: dayjs(),
  //   UserCreatedBy: "SYSTEM",
  //   UserLastLogonDate: dayjs(),
  //   UserActive: true
  // });

  // NewUser.save().then((User, Error) => {  
  //   console.log(User);    
  // });

  //Response.json({"Success": true});

};

exports.UpdateUserPassword = (Request, Response) => {

  //Get data from frontend
  const sUserOldPassword = Request.body.frmOldPassword;
  const sUserNewPassword = Request.body.frmNewPassword;

  if(!sUserOldPassword){
    Response.status(400);
    Response.json({"Reason": "Error, Please provide your old password"});
    return;
  };

  //Check new password
  if(!sUserNewPassword){
    Response.status(400);
    Response.json({"Reason": "Error, New password has not been provided"});
    return;
  };

  //Check length of new password
  if(sUserNewPassword.length < 8){
    Response.status(400);
    Response.json({"Reason": "Error, Password must be at least 8 characters"});
    return;
  };

  //Get user id
  const sUserID = Request.user._id;
  if(!sUserID){
    Response.clearCookie("token");
    Response.status(401);
    Response.end();
    return;
  };

  //Check old password and update new password
  UserModel.findOneAndUpdate({
    _id: sUserID,
    UserSecret: HashPassword(sUserOldPassword),
    UserActive: true,
    UserApproved: true
  }, {
    UserSecret: HashPassword(sUserNewPassword),
    UserLastUpdatedDate: new Date()
  }).then((User, Error) => {

    if(Error){
      Response.status(500);
      Response.json({"Reason": "An error occured while trying to update your password. Please try again later or contact support"});
      return;
    };

    if(User){
      Response.json({"Success": true});
    }else{
      Response.status(400);
      Response.json({"Reason": "Either your old password is incorrect or your account has been locked/disabled. Please check that you have entered your correct old password."});
    };

  });

};

exports.UpdateUserProfile = (Request, Response) => {

  var sNewUserFirstName = Request.body.frmNewUserFirstName;
  var sNewUserLastName = Request.body.frmNewUserLastName;

  if(!sNewUserFirstName){
    Response.status(400);
    Response.json({"Reason": "Error, please enter a first name"});
    return;
  };
  
  if(!sNewUserLastName){
    Response.status(400);
    Response.json({"Reason": "Error, please enter a last name"});
    return;
  };

  //Trim and uppercase
  sNewUserFirstName = sNewUserFirstName.trim().toUpperCase();
  sNewUserLastName = sNewUserLastName.trim().toUpperCase();

  const sUserID = Request.user._id;

  //If no user id
  if(!sUserID){
    Response.clearCookie("token");
    Response.status(401);
    Response.end();
    return;
  };

  //Get user and update
  UserModel.findOneAndUpdate({_id: sUserID}, {
    UserFirstName: sNewUserFirstName,
    UserLastName: sNewUserLastName,
    UserLastUpdatedDate: new Date()
  }, {returnDocument: 'after'}).select({
    UserEmail: 1,    
    UserFirstName: 1,
    UserLastName: 1,
    UserDateCreated: 1,
    UserAdmin: 1,
    UserManager: 1
  }).then((UpdatedUser, Error) => {
    if(Error){
      console.log(Error);
      Response.status(500);
      Response.json({"Reason": "Error while updating the user profile. Please contact support"});      
      return;
    };
    if(UpdatedUser){
      Response.json({"Success": true, UpdatedUser});
    }else{
      Response.status(500);
      Response.json({"Reason": "Error while updating the user profile. Please contact support"});            
    };
  });
  

};

exports.GetUserProfileData = async (Request, Response) => {

  //Get user ID and travel agency id from session
  const sTAID = Request.user.TAID;
  const sUserID = Request.user._id;

  //If no user travel agency or user id
  if(!sTAID || !sUserID){
    Response.clearCookie("token");
    Response.status(401);
    Response.end();
    return;
  };

  //Get user profile from database
  const User = await UserModel.findOne({_id: sUserID}).select({
    UserEmail: 1,    
    UserFirstName: 1,
    UserLastName: 1,
    UserDateCreated: 1,
    UserAdmin: 1,
    UserManager: 1
  });

  if(!User){
    Response.clearCookie("token");
    Response.status(401);
    Response.end();
    return;
  };

  //Get travel agency
  const TravelAgency = await TravelAgencyModel.findOne({_id: sTAID}).select({
    TAName: 1,  
    TAAddress: 1,  
    TACity: 1,
    TACountry: 1,
    TADateCreated: 1,
    TAContactNumber: 1,
    TAUSDCredit: 1,
  });

  if(!TravelAgency){
    Response.clearCookie("token");
    Response.status(401);
    Response.end();
    return;
  };

  Response.json({User, TravelAgency});

};

exports.IsLoggedIn = (Request, Response) => {
  Response.json({ "Success": true });
};

exports.ResetPassword = async (Request, Response) => {

  //Get data from frontend
  const sEmail = Request.body.frmEmail.toUpperCase();
  const sOTP = Request.body.frmOTP;
  const sNewPassword = Request.body.frmPassword;

  if(!sEmail){
    Response.status(400);
    Response.json({"Reason": "Please provide an email address"});
    return;
  };

  if(!sOTP){
    Response.status(400);
    Response.json({"Reason": "Please provide the OTP"});
    return;
  };

  //Check if password is 8 digits or more for security
  if(sNewPassword.length < 8){
    Response.status(400);
    Response.json({"Reason": "New Password must be at least 8 characters"});
    return;
  };

  //Get user
  const User = await UserModel.findOne({UserEmail: sEmail});

  //User not found
  if(!User){
    Response.status(401);
    Response.json({"Success": false, "Reason": "Error. This Email is not registered"});
    return;
  };

  if(!User.UserActive || !User.UserApproved){
    Response.status(401);
    Response.json({"Success": false, "Reason": "Error. This account is locked or inactive. Please contact support"});
    return;
  };


  //Check for an otp
  if(!User.UserResetSecretOTP){
    Response.status(401);
    Response.json({"Success": false, "Reason": "Error. Please start the reset process again"});
    return;
  };

  //If we have an OTP, check that its still valid
  const dCurrent = dayjs();
  const dOTPExpiry = dayjs(User.UserResetSecretDate);

  const iMinutesTillExpiry = parseInt(dOTPExpiry.diff(dCurrent, 'minutes'));
  
  //Check if OTP is expired
  if(iMinutesTillExpiry < 0){
    //OTP is expired
    Response.status(401);
    Response.json({"Success": false, "Reason": "Error. The OTP has expired, please restart the process again"});
    return;
  };

  //If we made it here, it means the otp is now valid
  //Check if the OTP is correct
  if(User.UserResetSecretOTP !== sOTP){
    Response.status(401);
    Response.json({"Success": false, "Reason": "Error. Either the OTP is wrong or is expired"});
    return;
  };

  //If we made it here, the OTP is valid
  //Lets reset the password now
  UserModel.findOneAndUpdate({_id: User._id}, {
    UserSecret: HashPassword(sNewPassword),
    UserResetSecretOTP: "",
    UserResetSecretDate: null,    
  }).then((N, E) => {
    if(E) console.log(E);
    if(N){
      SendEmail(N.UserEmail, "ABD TRAVELS ONLINE PORTAL - Password Reset Success", "Your password has been changed successfully. If you did not do this, please contact support immediately.")
      Response.json({"Success": true});
    }else{
      Response.status(500);
      Response.json({"Success": false, "Reason": "Error. Unable to save new password"});
    };
  });

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