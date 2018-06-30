// Dependencies
var restful = require('node-restful');
var mongoose = restful.mongoose;

// Schema
var user_roleSchema = new mongoose.Schema({
    role_name: { type: String, unique: true, required: true }    
});

// Return model
module.exports = restful.model('user_Roles', user_roleSchema);