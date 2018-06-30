// Dependencies
var restful = require('node-restful');
var mongoose = restful.mongoose;

// Schema
var cityPolicy_Schema = new mongoose.Schema({
    city: String,
    category: String,
    policy_desc: String,
    anonymous: { type: String, default: "true" },
    add_issue: { type: Number, default: 1 }
});

// Return model
module.exports = restful.model('citypolicy', cityPolicy_Schema);
