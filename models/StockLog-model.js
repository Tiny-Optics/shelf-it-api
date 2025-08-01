const mongoose = require ('mongoose');

//String, Boolean, Date, Number - Need to install another module for double or use String.
//No need for ID as MongoDB will auto-gen one for us :)
const StockLogSchema = mongoose.Schema({

  StockID: String, // ID of the stock item
  SLAction: String, // Action performed (added, removed, updated)
  SLQuantity: Number, // Quantity of stock item involved in the action
  SLUser: String, // User who performed the action
  SLDate: Date, // Date when the action was performed

});

module.exports = mongoose.model('StockLog', StockLogSchema, "StockLogs"); //collection name users