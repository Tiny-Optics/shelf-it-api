const passport = require('passport');
require('../auth/passport')(passport);

const AuthFunctions = require("../controllers/controller-auth.js");
const MainFunctions = require("../controllers/controller-main.js");


module.exports = function (app) {    

    //Test routes
    app.get("/api/test", AuthFunctions.test);

    //Auth routes
    app.post("/api/LoginUser", AuthFunctions.LoginUser);
    app.get("/api/IsLoggedIn", passport.authenticate('Default', {session: false}), AuthFunctions.IsLoggedIn);
    app.get("/api/LogoutUser", AuthFunctions.LogoutUser);

    //Main routes
    app.post("/api/StockUpdate", passport.authenticate('Default', {session: false}), MainFunctions.StockUpdate);
    app.get("/api/GetMyStoreDetails", passport.authenticate('Default', {session: false}), MainFunctions.GetMyStoreDetails);
    app.get("/api/GetStockList", passport.authenticate('Default', {session: false}), MainFunctions.GetStockList);
    app.get("/api/GetStockLogs/:StockID", passport.authenticate('Default', {session: false}), MainFunctions.GetStockLogs);

};