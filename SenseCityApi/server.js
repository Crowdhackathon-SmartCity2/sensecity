﻿var express = require('express');
var app = express();
var http = require('http');
var config = require('app-config');
var bodyParser = require('body-parser');
var fs = require('fs');
var rfs = require('rotating-file-stream');
var morgan = require('morgan');
var mongoose = require('mongoose');
var http_server = http.createServer(app);
var api = require('./routes/api');

if (config.config.req_https == '1') {

    var key = fs.readFileSync(config.config.priv);
    var cert = fs.readFileSync(config.config.cert);
    var options = {
        key: key,
        cert: cert
    };

    var https = require('https');

    var my_server = https.createServer(options, app);
}

/*app.use(bodyParser.urlencoded({limit: '10mb'},{extended: true}));*/
app.use(bodyParser.json({ limit: '100mb' }));

//var logDirectory = path.join(config.config.path_log, '');

// ensure log directory exists
fs.existsSync(config.config.log_path) || fs.mkdirSync(config.config.log_path);

var dateObj = new Date();

// create a rotating write stream
//var accessLogStream = rfs(dateObj.getUTCFullYear() + '' + (dateObj.getUTCMonth() + 1) + '' +dateObj.getUTCDate() +'.log', {

var accessLogStream = rfs("API.log", {
    history: "API.log",
    interval: '1d', // rotate daily1\
    maxSize: '10M',
    path: config.config.log_path
});

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }));




//headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length,x-uuid,Cookie,Set-Cookie,Host,Accept,User-Agent,x-role');
    res.header('Access-Control-Expose-Headers', 'Content-Type,Content-Length,x-uuid,Cookie,Set-Cookie,Host,Accept,User-Agent,x-role');
    //    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

var bugUrl = config.config.bugUrl;


function authorization(req, res, next) {
    Role.find({ uuid: req.get('x-uuid') }, function (err, response) {
        if (response.length > 0 && response[0]["timestamp"] >= Date.now()) {
            if (req.path === '/admin/bugs/search') {
                if (req.get('x-role') === 'departmentAdmin' || req.get('x-role') === 'sensecityAdmin' || req.get('x-role') === 'departmentUser' || req.get('x-role') === 'cityAdmin') {
                    next();
                } else {
                    res.send("failure");
                }
            }
        } else {
            res.send("failure");
        }
    });

}


var Role = require('./models/roles.js');

function authentication(req, res, next) {
    Role.find({ uuid: req.get('x-uuid') }, function (err, response) {
        if (response.length > 0 && response[0]["timestamp"] >= Date.now()) {
            next();
        } else {  /* res.send("failure"); */ }
    });
}



mongoose.connection.once('open', function () {
    app.post('/dashboard', function (req, res) {
        Role.find({ username: req.body.username, password: req.body.password }, function (err, response) {
            if (response.length > 0) {
                var wordArray = crypto.enc.Utf8.parse(req.body.username, req.body.password);
                var uuid = crypto.enc.Base64.stringify(wordArray); app.use('/mobilemap', require('./routes/api'));
                Role.update({ username: req.body.username, password: req.body.password }, { $set: { "uuid": uuid, "timestamp": Date.now() * 1000 * 3600 } }, { multi: true }, function (err, doc) { });
                return res.send(response[0]["city"] + ";" + response[0]["role"] + ";" + response[0]["department"] + ";" + response[0]["email"] + ";" + uuid + ";" + req.body.username);
            } else {
                return res.send("failure");
            }
        });
    });
    app.get('/get', authentication, function (req, res) {
        res.send("success");
    });
    app.get('/logout', authentication, function (req, res) {

        Role.update({ uuid: req.get('x-uuid') }, { $unset: { "uuid": 1, "timestamp": 1 } }, function (err, response) {
            res.send("logout");
        });
    });

    app.post('/admin/bugs/search', authorization, function (req, res) {
        var bugToken = "";
        var loginData = { "method": "User.login", "params": [{ "login": config.config.login, "password": config.config.pwd }], "id": 1 };
        request({
            url: bugUrl,
            method: "POST",
            json: loginData
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                bugToken = body.result.token;
                req.body.params[0].token = bugToken;
                request({
                    url: config.config.bugUrl,
                    method: "POST",
                    headers: { 'content-type': 'application/json' },
                    json: req.body
                }, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        if (response.body.result !== null) {
                            res.send(response.body.result.bugs);
                        } else {
                            res.send([response.body.error]);
                        }
                    } else {
                        console.log("error: " + error);
                    }
                });
            } else {
                console.log("error: " + error);
            }
        });
    });

});



// Routes 
app.use('/api/1.0', require('./routes/api'));

//app.use('/api/1.0', require('./routes/api'));
//app.use('/api/1.0/admin', require('./routes/api'));

//app.use('/fixed-point', require('./routes/lighting'));

//app.use('/api/1.0/issue',require('./routes/image_return')); 
app.use('/fix_point', require('./routes/fix_point'));
//app.use('/api/1.0/mobilemap', require('./routes/api'));

//app.use('/api/1.1', require('./routes/api1_1'));
//app.use('/api/1.1/issue',require('./routes/image_return')); 
//app.use('/api/1.1/mobilemap', require('./routes/api1_1')); 

// start server 
http_server.listen(config.config.http_port);
if (config.config.req_https == '1') {
    my_server.listen(config.config.https_port);
}

console.log('API is running on port ' + config.config.port); 