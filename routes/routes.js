const passport = require('passport');
require('../auth/passport')(passport);

const AuthFunctions = require("../controllers/controller-auth.js");
const MainFunctions = require("../controllers/controller-main.js");


module.exports = function (app) {
    
    //Main route
    app.get("/", (req, res) => {
        res.json({ message: "Welcome to the API." });
    });

    //Test routes
    app.get("/api/test", AuthFunctions.test);
    app.get("/api/test2", MainFunctions.test2);

    //Auth routes
    app.post("/api/LoginUser", AuthFunctions.LoginUser);
    app.post("/api/LoginRismi", AuthFunctions.LoginRismi);
    app.post("/api/RegisterRismi", AuthFunctions.RegisterRismi);
    app.get("/api/IsLoggedIn", passport.authenticate('Default', {session: false}), AuthFunctions.IsLoggedIn);
    app.get("/api/IsLoggedInRismi", passport.authenticate('Rismi', {session: false}), AuthFunctions.IsLoggedInRismi);
    app.get("/api/LogoutUser", AuthFunctions.LogoutUser);
    app.get("/api/LogoutRismi", AuthFunctions.LogoutRismi);
    app.post("/api/RegisterUser", AuthFunctions.RegisterUser);
    app.post("/api/VerifyPhone", AuthFunctions.VerifyPhone);
    app.post("/api/ResendVerificationOTP", AuthFunctions.ResendVerificationOTP);
    app.post("/api/RequestPasswordReset", AuthFunctions.RequestPasswordReset);
    app.post("/api/ResetPassword", AuthFunctions.ResetPassword);

    //User routes
    app.get("/api/GetMyProfile", passport.authenticate('Default', {session: false}), MainFunctions.GetMyProfile);
    app.get("/api/GetRismiProfile", passport.authenticate('Rismi', {session: false}), MainFunctions.GetRismiProfile);   

    //Store routes
    app.post("/api/CreateStore", passport.authenticate('Default', {session: false}), MainFunctions.CreateStore);
    app.get("/api/GetMyStores", passport.authenticate('Default', {session: false}), MainFunctions.GetMyStores);

    //Main routes
    app.post("/api/StockUpdate", passport.authenticate('Default', {session: false}), MainFunctions.StockUpdate);    
    app.get("/api/GetStockList/:StoreID", passport.authenticate('Default', {session: false}), MainFunctions.GetStockList);
    app.get("/api/GetStockLogs/:StockID", passport.authenticate('Default', {session: false}), MainFunctions.GetStockLogs);
    app.get("/api/GetProductByBarcode/:Barcode", passport.authenticate('Default', {session: false}), MainFunctions.GetProductByBarcode);
    app.get("/api/GetMyHome/:StoreID", passport.authenticate('Default', {session: false}), MainFunctions.GetMyHome);

};