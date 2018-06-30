// Dependencies
var restful = require('node-restful');
var mongoose = restful.mongoose;

// Schema
var binAliveSchema = new mongoose.Schema({
    hwid: String,
    binID: String,
    binTypeID: String,
    binSuperTypeID: String,
    loc: { type: { type: String }, coordinates: [Number] },//latitude: String, longitude: String,
    interval: String,
    binAddress: String,
    zoneID: String,
    binStatus: String,
    binClearDates: String,
    notes: String,
    customID: String
});

binAliveSchema.index({ loc: "2dsphere" });

// Return model
module.exports = restful.model('binAlive', binAliveSchema);