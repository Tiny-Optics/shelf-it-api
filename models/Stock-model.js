const mongoose = require ('mongoose');

//String, Boolean, Date, Number - Need to install another module for double or use String.
//No need for ID as MongoDB will auto-gen one for us :)
const StockSchema = mongoose.Schema({

  StockBarcode: String, // Barcode of the stock item
  StoreID: String, // ID of the store this stock item belongs to
  StockQuantity: Number, // Quantity of the stock item
  UserID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // User who added the stock item
  StockDateAdded: Date, // Date when the stock item was added
  StockLastUpdated: Date, // Date when the stock item was last updated

});

module.exports = mongoose.model('Stock', StockSchema, "Stocks"); //collection name users