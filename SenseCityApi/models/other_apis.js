// Dependencies
var restful = require('node-restful');
var mongoose = restful.mongoose;

// Schema
var other_ApisSchema = new mongoose.Schema({
    name: String,
    description: String,
    name_contact: String,
    email_contact: String,
    mobile_contact: String,
    active: { type: Boolean, default: false, required: true }
});

// Return model
module.exports = restful.model('other_Apis', other_ApisSchema);