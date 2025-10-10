const mongoose = require ('mongoose');

//String, Boolean, Date, Number - Need to install another module for double or use String.
//No need for ID as MongoDB will auto-gen one for us :)
const ProductSchema = mongoose.Schema({

  ProductBarcode: String, // Barcode of the product
  ProductGtinName: String, // GTIN Name of the product
  ProductDescription: {type: String, default: ""}, // Description of the product
  ProductBrandName: String, // Brand Name of the product
  ProductBrandOwnerGLN: String, // Brand Owner GLN of the product
  ProductBrandOwnerName: String, // Brand Owner Name of the product
  ProductGCCCode: String, // GCC Code of the product
  ProductGCCName: String, // GCC Name of the product
  ProductLifespan: String, // Lifespan of the product
  ProductGrossWeight: String, // Gross Weight of the product
  ProductUnitOfMeasure: String, // Unit of Measure of the product
  ProductCountryOfOrigin: String, // Country of Origin of the product
  ProductImageURL: {type: String, default: ""}, // URL of the product image
  ProductLastUpdated: Date, // Last updated date of the product
  ProductLastUpdatedBy: String, // User who last updated the product
  ProductAddedDate: Date, // Date when the product was added

});

module.exports = mongoose.model('Product', ProductSchema, "Products"); //collection name users