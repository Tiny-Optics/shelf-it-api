var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require("passport");
require('dotenv').config();

var app = express();

//Limit for file upload
//app.use(express.json({limit: '50mb'}));

//Passportjs config
app.use(passport.initialize());
require("./auth/passport")(passport);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Tell the app to use our routes file
require("./routes/routes.js")(app);

//SSL force
const enforce = require('express-sslify');
app.use(enforce.HTTPS({ trustProtoHeader: true }));

//Heroku
if(process.env.NODE_ENV === 'production'){
  // app.use(express.static(path.join(__dirname, 'frontend/build')));
  // app.get('*',(req,res)=>{
  //   res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
  // });

  app.use(express.static(path.join(__dirname, "frontend/dist")))
  app.get('/*', (req, res) => {
      res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'))
  })

};

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err)
  res.render('error');
});

var mongoose = require("mongoose");

//Connection string
const uri = process.env.MONGO_CONNECTION_STRING;

mongoose.Promise = global.Promise;
mongoose.set('strictQuery', true)

mongoose.connect(uri);

mongoose.connection.on("error", function (e) {
  console.log("Could Not Connect To The Database. Exiting now!");
  console.log(e)
  process.exit();
});

mongoose.connection.once("open", function () {
  console.log("Successfully Connected To The Shelf It Database");
});

module.exports = app;
