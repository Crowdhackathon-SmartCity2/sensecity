// Dependencies
var restful = require('node-restful');
var mongoose = restful.mongoose;

// Schema
var action_per_roleSchema = new mongoose.Schema({
    action_name: { type: String, required: true },
    role_id: { type: Array, required: true },
    method: { type: String, required: true }
});

// Return model
module.exports = restful.model('action_per_role', action_per_roleSchema);