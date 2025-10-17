const mongoose = require ('mongoose');

//String, Boolean, Date, Number - Need to install another module for double or use String.
//No need for ID as MongoDB will auto-gen one for us :)
const ProductSchema = mongoose.Schema({

  ProductBarcode: String, // Barcode of the product
  ProductGtinName: {type: String, default: "Unknown"}, // GTIN Name of the product
  ProductDescription: {type: String, default: ""}, // Description of the product
  ProductBrandName: {type: String, default: "Unknown"}, // Brand Name of the product
  ProductBrandOwnerGLN: {type: String, default: "Unknown"}, // Brand Owner GLN of the product
  ProductBrandOwnerName: {type: String, default: "Unknown"}, // Brand Owner Name of the product
  ProductGCCCode: {type: String, default: ""}, // GCC Code of the product
  ProductGCCName: {type: String, default: "Unknown"}, // GCC Name of the product
  ProductLifespan: {type: String, default: "Unknown"}, // Lifespan of the product
  ProductGrossWeight: {type: String, default: "0"}, // Gross Weight of the product
  ProductUnitOfMeasure: {type: String, default: "EA"}, // Unit of Measure of the product
  ProductCountryOfOrigin: {type: String, default: "Unknown"}, // Country of Origin of the product
  ProductImageURL: {type: String, default: ""}, // URL of the product image
  ProductLastUpdated: {type: Date, default: Date.now}, // Last updated date of the product
  ProductLastUpdatedBy: {type: String, default: "Unknown"}, // User who last updated the product
  ProductAddedDate: {type: Date, default: Date.now}, // Date when the product was added
  ProductDetailsComplete: {type: Boolean, default: false}, // Whether the product details are complete

});

module.exports = mongoose.model('Product', ProductSchema, "Products"); //collection name users