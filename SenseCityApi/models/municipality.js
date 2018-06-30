// Dependencies
var restful = require('node-restful');
var mongoose = restful.mongoose;

// Schema
var municipalitySchema = new mongoose.Schema({
    municipality: String,
    municipality_desc: String,
    boundaries: {
        type: { type: String },
        coordinates: { type: Array }
    },
    sms_key_fibair: { type: String, default: "" },
    mandatory_email: { type: Boolean, default: false },
    mandatory_sms: { type: Boolean, default: false },
    active_sms_service: { type: String, default: "false" },
    control_department: { type: String, default: "" }
});


// Return model
module.exports = restful.model('municipality', municipalitySchema);
