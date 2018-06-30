// Dependencies
var restful = require('node-restful');
var mongoose = restful.mongoose;

// Schema
var userSchema = new mongoose.Schema({
    position: { type: String, required: true },
    name: { type: String, default: "" },
    surname: { type: String, default: "" },
    email: { type: String, unique: true, required: true },
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role_id: { type: Array, required: true },
    city: { type: String, required: true },
    last_login: { type: Number },
    departments: { type: Array },
    uuid: { type: String },
    active: { type: Boolean, default: true, required: true }
});

// Return model
module.exports = restful.model('user', userSchema);