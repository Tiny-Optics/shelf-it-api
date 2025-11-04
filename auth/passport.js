//Followed a tutorial from: https://www.djamware.com/post/5a90c37980aca7059c14297a/securing-mern-stack-web-application-using-passport 11/04/2020 16:00
const JwtStrategy = require('passport-jwt').Strategy;
const sSecretKey = process.env.JWT_SECRET;
const UserDB = require("../models/User-model");

module.exports = function(passport) {
  const opts = {
    jwtFromRequest: cookieExtractor,
    secretOrKey: sSecretKey
  };

  //Admin strategy
  passport.use('Admin', new JwtStrategy(opts, function(jwt_payload, done) {

    UserDB.findOne({_id: jwt_payload.UserID}).then((User, Error) => {
      if(Error) return done(Error, false);

      if(!User) return done(null, false);

      if(!User.UserActive) return done(null, false);

      if(!User.UserType || User.UserType !== "Admin"){
        return done(null, false);
      }

      return done(null, User);
     
    });

  }));
  passport.use('Default', new JwtStrategy(opts, function(jwt_payload, done) {

    UserDB.findOne({_id: jwt_payload.UserID}).then((User, Error) => {

      if(Error) return done(Error, false);

      if(User){

        if(!User.UserActive){
          done(null, false);
        }else{
          done(null, User);
        }

      }else{
        done(null, false);
      };
    });

  }));
};

var cookieExtractor = function(req) {
    var token = null;
    if (req && req.cookies) token = req.cookies['token'];
    return token;
  };