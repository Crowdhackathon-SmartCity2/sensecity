// Dependencies
var restful = require('node-restful');
var mongoose = restful.mongoose;

// Schema
var neighBorSchema = new mongoose.Schema({
    loc: { type: { type: String }, coordinates: [Number] },
    email: String,
    memberID: String
});

neighBorSchema.index({ loc: "2dsphere" });

// Return model
module.exports = restful.model('neighBor', neighBorSchema);