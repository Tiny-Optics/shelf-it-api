const passport = require('passport');
require('../auth/passport')(passport);

const AuthFunctions = require("../controllers/controller-auth.js");
const MainFunctions = require("../controllers/controller-main.js");


module.exports = function (app) {    

    //Test routes
    app.get("/api/test", AuthFunctions.test);

    app.post("/api/SubmitSellReq", MainFunctions.SubmitSellReq);
    app.get("/api/GetPromotedBicycles", MainFunctions.GetPromotedBicycles);
    app.get("/api/GetAllBicycles", MainFunctions.GetAllBicycles);

    //Auth routes
    app.post("/api/LoginUser", AuthFunctions.LoginUser);
    app.get("/api/IsLoggedIn", passport.authenticate('Default', {session: false}), AuthFunctions.IsLoggedIn);
    app.get("/api/LogoutUser", AuthFunctions.LogoutUser);

    //Admin routes
    app.get("/api/GetAllUsers", passport.authenticate('Default', {session: false}), AuthFunctions.GetAllUsers);
    app.post("/api/ToggleUserActive", passport.authenticate('Default', {session: false}), AuthFunctions.ToggleUserActive);
    app.post("/api/AddUser", passport.authenticate('Default', {session: false}), AuthFunctions.AddUser);
    app.post("/api/ResetUserPassword", passport.authenticate('Default', {session: false}), AuthFunctions.ResetUserPassword);
    app.get("/api/AdminGetAllBicycles", passport.authenticate('Default', {session: false}), AuthFunctions.AdminGetAllBicycles);
    app.post("/api/AdminUpdateBicycleNotes", passport.authenticate('Default', {session: false}), AuthFunctions.AdminUpdateBicycleNotes);
    app.get("/api/AdminGetBicycleByID/:id", passport.authenticate('Default', {session: false}), AuthFunctions.AdminGetBicycleByID);
    app.post("/api/AdminUpdateBicycleByID/:id", passport.authenticate('Default', {session: false}), AuthFunctions.AdminUpdateBicycleByID);
    app.post("/api/AdminTogglePromotion", passport.authenticate('Default', {session: false}), AuthFunctions.AdminTogglePromotion);
    app.post("/api/AdminToggleActive", passport.authenticate('Default', {session: false}), AuthFunctions.AdminToggleActive);
    app.post("/api/AdminAddBicycle", passport.authenticate('Default', {session: false}), AuthFunctions.AdminAddBicycle);
    app.delete("/api/AdminDeleteBicycle/:id", passport.authenticate('Default', {session: false}), AuthFunctions.AdminDeleteBicycle);
    
};