var express = require('express');
var router = express.Router();
var config = require('app-config');
var Minio = require('minio');
var morgan = require('morgan');
var app = express();
var mongoose = require('mongoose');
var request = require('request');
var merge = require('merge');
var crypto = require('crypto');
var path = require('path');
var file_exitst = require('exists-file');
var resizeCrop = require('resize-crop');
var formidable = require('formidable');
var rp = require('request-promise');
var bluebird = require('bluebird');
var nodemailer = require('nodemailer');
var fs = require('fs');

var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
/*
var visualRecognition = new VisualRecognitionV3({
    url: '<service_url>',
    version: '2018-03-19',
    iam_apikey: '<iam_api_key>',
});*/

var visualRecognition = new VisualRecognitionV3({
    /*url: 'https://gateway.watsonplatform.net/visual-recognition/api/v3',*/
    version: config.config.watsonVersion,
    iam_apikey: config.config.watson_api_key
});

var bugzilla_default_email = config.config.bugzilla_default_email;

var minioClient = new Minio.Client({
    endPoint: config.config.minio_endPoint,
    port: config.config.minio_port,
    secure: false,
    accessKey: config.config.minio_accessKey,
    secretKey: config.config.minio_secretKey
});

app.use(morgan('combined'));

mongoose.connect('mongodb://' + config.config.my_hostname + '/' + config.config.database, { autoIndex: false, reconnectTries: 30, reconnectInterval: 500, poolSize: 10, bufferMaxEntries: 0 });

// Models
var Issue = require('../models/issue');
var act_User = require('../models/active_user');
var act_email = require('../models/activate_email');
var act_mobile = require('../models/activate_mobile');
var Role = require('../models/roles.js');
var Municipality = require('../models/municipality');
var cityPolicy = require('../models/citypolicy');
//var user_Role = require('../models/user_roles');
//var ActionPerRole = require('../models/action_per_role');
var User = require('../models/user');
var otherApis = require('../models/other_apis');

var jsonfile = require('jsonfile');
var role_obj;
var perm_per_role_obj;

// Routes
//Issue.methods(['get', 'put', 'post', 'delete']);
//Issue.register(router, '/issues');

var bugUrlRest = config.config.bugUrlRest;

jsonfile.readFile(process.cwd() + '/config/roles.json', function (err, obj) {
    role_obj = obj;
    console.log(role_obj);
});

jsonfile.readFile(process.cwd() + '/config/perm_per_role.json', function (err, obj) {
    perm_per_role_obj = obj;
    console.log(perm_per_role_obj);
});


//Authorization middleware
function authorization(req, res, next) {


    Role.find({ uuid: req.get('x-uuid') }, function (err, response) {
        if (response.length > 0 && response[0]["timestamp"] >= Date.now()) {
            var mypath = req.path;

            if (mypath.indexOf("admin") != -1) { //req.path === '/admin/bugs/search' || req.path === '/admin/bugs/update' || req.path === '/admin/bugs/comment' || req.path === '/admin/bugs/comment/tags' || req.path === '/admin/bugs/comment/add') {
                if (req.get('x-role') === 'departmentAdmin' || req.get('x-role') === 'sensecityAdmin' || req.get('x-role') === 'departmentUser' || req.get('x-role') === 'cityAdmin') {
                    next();
                } else {
                    res.send("failure");
                }
            } else {
                res.send("failure");
            }
        } else {
            res.send("failure");
        }
    });
}

function authentication(req, res, next) {

    if (req.get('x-uuid') != undefined) {
        Role.find({ uuid: req.get('x-uuid') }, function (err, response) {
            //response[0]["mongo"]

            if (response.length > 0 && response[0]["timestamp"] >= Date.now()) {
                next();
            } else {
                res.send("failure");
            }
        });
    } else {
        res.send("failure1");
    }
}

//Bugzilla login
var bugUrl = config.config.bugUrl;

var loginData1 = "?login=" + config.config.login + "&password=" + config.config.pwd;

//console.log(bugUrlRest);
//console.log(loginData1);

var bugToken = "";
request({
    url: bugUrlRest + "/rest/login" + loginData1,
    method: "GET"
}, function (error, response, body) {
    //console.log(response);
    if (error)
        console.log(error);
    if (body.indexOf("Access forbidden!") != -1) {
        console.log("No connection with Bugzilla!");
    } else {
        var body_variable = JSON.parse(body);

        if (!error && response.statusCode === 200) {
            bugToken = body_variable.token;

            console.log("Login in bugzilla as: " + config.config.login);
            console.log("And assigned token: " + body_variable.token);

        } else {
            console.log("error: " + error);
            console.log("response.statusCode: " + response.statusCode);
            console.log("response.statusText: " + response.statusText);
        }
    }
});



/*              ----------             */
/*              ----------             */
/*            CRUD USER START            */
/*              ----------             */
/*              ----------             */


router.post('/admin/add_user', authorize, function (req, res) {

    var roleIDs = [];
    if (req.body.position == undefined || req.body.email == undefined || req.body.username == undefined || req.body.password == undefined || req.body.role_name == undefined || req.body.city == undefined) {
        res.status(404).send("Bad Request");
    } else {
        User.find({ "uuid": req.headers['x-uuid'] }, { "role_id": 1 }, function (req1, res1) {

            for (var i = 0; i < role_obj.length; i++) {
                for (var k = 0; k < req.body.role_name.length; k++) {
                    if (role_obj[i].role_name == req.body.role_name[k]) {
                        roleIDs.push(role_obj[i].id);
                    }
                }
            }

            if (roleIDs.length == 0) {
                res.status(405).send("error_rolename");
            } else {

                if (!perm_per_role(res1[0].role_id, '/admin/add_user', 'POST')) {
                    res.status(403).send("Forbidden");
                } else {

                    var timestamp_ = (new Date).getTime();

                    var entry = new User({
                        position: req.body.position,
                        name: req.body.name,
                        surname: req.body.surname,
                        email: req.body.email,
                        username: req.body.username,
                        password: crypto.createHash('md5').update(req.body.password).digest("hex"),
                        role_id: roleIDs,
                        city: req.body.city,
                        last_login: timestamp_
                    });

                    entry.save(function (err1, resp) {

                        if (err1) {
                            console.log(err1);
                            if ((err1.errmsg).indexOf("email") > -1) {
                                res.status(405).send("duplicate_email");
                            } else if ((err1.errmsg).indexOf("username") > -1) {
                                res.status(405).send("duplicate_username");
                            }
                        }

                        var text_act = '';
                        var possible = "0123456789ABCDEFGHIJ";

                        for (var i = 0; i < 10; i++)
                            text_act += possible.charAt(Math.floor(Math.random() * possible.length));

                        request({
                            url: bugUrlRest + "/rest/user",
                            method: "POST",
                            json: { "token": bugToken, "email": req.body.email, "full_name": req.body.surname + " " + req.body.name, "password": text_act }
                        }, function (error, bugResponse, body) {

                            res.send(resp);
                        });
                    });
                }
            }
        });
    }
});

router.post('/login', function (req, res) {

    if (req.body.username == undefined || req.body.username == '') {
        res.status(403).send('Forbidden');
    } else if (req.body.password == undefined || req.body.password == '') {
        res.status(403).send('Forbidden');
    } else {
        var uuid = '';
        var currentdate1 = new Date();
        var currentdate = currentdate1.toString();
        var buffer = new Buffer(req.body.username + req.body.password + currentdate);
        var toBase64 = buffer.toString('base64');
        uuid = toBase64;
        var timestamp_ = (new Date).getTime();
        var _roleName = [];

        User.findOneAndUpdate({ "username": req.body.username, "password": crypto.createHash('md5').update(req.body.password).digest("hex") }, { $set: { "uuid": uuid, "last_login": timestamp_ } }, { "new": true }, function (err, doc) {
            if (err)
                console.log(err);

            if (doc != null) {

                for (var j = 0; j < role_obj.length; j++) {
                    for (var k = 0; k < doc.role_id.length; k++) {
                        console.log(role_obj[j].id + '==' + doc.role_id[k]);
                        if (role_obj[j].id == doc.role_id[k])
                            _roleName.push(role_obj[j].role_name);

                    }
                }

                res.send([{
                    _id: doc._id,
                    name: doc.name,
                    email: doc.email,
                    username: doc.username,
                    city: doc.city,
                    last_login: doc.last_login,
                    uuid: doc.uuid,
                    departments: doc.departments,
                    role_id: _roleName,
                    surname: doc.surname,
                    position: doc.position
                }]);

            } else {
                res.send("failure");
            }
        });
    }

});

router.post('/admin/edit_user', authorize, function (req, res) {

    var roleIDs = [];

    console.log(req.body);
    console.log(req.headers['x-uuid']);
    if (req.body.id == undefined || req.headers['x-uuid'] == undefined || req.body.role_name == undefined || req.body.position == undefined) {
        res.status(400).send("Bad Request");
    } else {
        User.find({ "_id": req.body.id }, { "role_id": 1, "city": 1, "email": 1, "username": 1, "password": 1 }, function (req1, res1) {
            if (req1)
                console.log(req1);
            User.find({
                uuid: req.headers['x-uuid']
            }, { "role_id": 1 }, function (err6, res6) {
            
                for (var i = 0; i < role_obj.length; i++) {
                    for (var k = 0; k < req.body.role_name.length; k++) {
                        if (role_obj[i].role_name == req.body.role_name[k]) {
                            roleIDs.push(role_obj[i].id);
                        }
                    }
                }

                if (roleIDs.length == 0 || roleIDs.length < k) {
                    res.status(405).send("error_rolename");
                } else {
                    if (!perm_per_role(res6[0].role_id, '/admin/edit_user', 'POST')) {
                        res.status(403).send("Forbidden");
                    } else {
                        User.find({
                            "_id": req.body.id
                        }, { "email": 1 }, function (err1, resp1) {
                            if (err1)
                                console.log(err1);


                            var _name = '';
                            var _surname = '';
                            var _username = '';

                            if (req.body.name != undefined) {
                                _name = req.body.name;
                            }

                            if (req.body.surname != undefined) {
                                _surname = req.body.surname;
                            }

                            if (req.body.username != undefined) {
                                _username = req.body.username;
                            } else {
                                _username = res1[0].username;
                            }

                            var _password;

                            if (req.body.password == undefined || req.body.password == '') {
                                console.log('1');
                                _password = res1[0].password;
                            } else {
                                console.log('2');
                                _password = crypto.createHash('md5').update(req.body.password).digest("hex");
                            }

                            if (resp1 != undefined) {
                                User.update({ "_id": req.body.id }, {
                                    $set: {
                                        "position": req.body.position, "role_id": roleIDs, "name": _name, "surname": _surname, "username": _username, "password": _password
                                    }
                                }, function (err, resp) {
                                    if (err) {
                                        console.log(err);

                                        if ((err.errmsg).indexOf("username") != -1) {
                                            res.status(405).send("duplicate_username");
                                        }
                                    } else {
                                        res.send(resp);
                                    }
                                });
                            } else {
                                res.status(404).send("WRONG_USER");
                            }

                        });
                    }
                }
            });
        });
    }
});

router.post('/admin/edit_user_account', authorize, function (req, res) {

    var roleIDs = [];
    if (req.body.id == undefined || req.headers['x-uuid'] == undefined || req.body.position == undefined) {
        res.status(400).send("Bad Request");
    } else {

        User.find({ "uuid": req.headers['x-uuid'] }, { "role_id": 1, "email": 1 }, function (req1, res1) {

            if (res1[0]._id == req.body.id) {
                for (var i = 0; i < role_obj.length; i++) {
                    for (var k = 0; k < req.body.role_name.length; k++) {
                        if (role_obj[i].role_name == req.body.role_name[k]) {
                            roleIDs.push(role_obj[i].id);
                        }
                    }
                }

                if (roleIDs.length == 0 || roleIDs.length < k) {
                    res.status(405).send("error_rolename");
                } else {

                    if (!perm_per_role(res1[0].role_id, '/admin/edit_user_account', 'POST')) {
                        res.status(403).send("Forbidden");
                    } else {

                        var timestamp_ = (new Date).getTime();
                        User.update({ "uuid": req.headers['x-uuid'], "_id": req.body.id }, {
                            $set: { "name": req.body.name, "surname": req.body.surname, "role_id": roleIDs, "position": req.body.position }
                        }, function (err, resp) {
                            if (err)
                                console.log(err);

                            res.send(resp);

                        });
                    }
                }

            } else {
                res.status(403).send("Forbidden");
            }

        });
    }
});

router.post('/admin/change_user_pass', authorize, function (req, res) {
    if (req.body.old_pass == undefined || req.body.pass == undefined) {
        res.status(404).send("Bad Request");
    } else {
        User.find({ "uuid": req.headers['x-uuid'], "password": crypto.createHash('md5').update(req.body.old_pass).digest("hex") }, function (err1, resp1) {
            if (err1)
                console.log(err1);

            if (resp1.length == 0) {
                res.send({ "status": "WRONG_PASS" });
            }
            else {
                User.findOneAndUpdate({ "uuid": req.headers['x-uuid'], "password": crypto.createHash('md5').update(req.body.old_pass).digest("hex") }, {
                    $set: { "password": crypto.createHash('md5').update(req.body.pass).digest("hex") }
                }, function (err, resp) {
                    if (err)
                        console.log(err);

                    if (resp == null) {
                        res.status(403).send("Forbidden");
                    }
                    else {
                        res.send({ "status": "ok" });
                    }
                });
            }
        });
    }
});

router.get('/admin/user/:username', authorize, function (req, res) {

    var roleIDs = [];
    var _departments = [];
    User.find({ "uuid": req.headers['x-uuid'] }, { "role_id": 1, "city": 1 }, function (req1, res1) {

        if (!perm_per_role(res1[0].role_id, '/admin/user/:username', 'GET')) {
            res.status(403).send("Forbidden");
        } else {

            request({
                url: bugUrlRest + "/rest/product?names=" + res1[0].city,
                method: "GET"
            }, function (error, bugResponse, body) {
                var department_arr = [];

                console.log(JSON.parse(body).products);

                for (p = 0; p < JSON.parse(body).products[0].components.length; p++) {
                    if (JSON.parse(body).products[0].components[p].name != "default") {
                        department_arr.push({ "id": JSON.parse(body).products[0].components[p].id, "name": JSON.parse(body).products[0].components[p].name });
                    }
                }
                console.log(JSON.stringify(department_arr));


                User.find({
                    "username": req.params.username, "city": res1[0].city
                }, function (err_user, res_user) {
                    console.log(res_user);
                    if (res_user.length == 0) {
                        res.send([]);
                    } else {
                        for (var i = 0; i < role_obj.length; i++) {
                            for (var k = 0; k < res_user[0].role_id.length; k++) {
                                if (role_obj[i].id == res_user[0].role_id[k]) {
                                    roleIDs.push(role_obj[i].role_name);
                                }
                            }
                        }

                        console.log(">>>>" + res_user[0].departments[0]);
                        if (res_user[0].departments != undefined) {
                            for (var j = 0; j < res_user[0].departments.length; j++) {
                                for (var z = 0; z < department_arr.length; z++) {
                                    console.log("id>" + res_user[0].departments[j]);
                                    if (department_arr[z].id == res_user[0].departments[j]) {
                                        _departments.push(department_arr[z].name);
                                    }
                                }
                            }
                        }
                        var position_ = '';
                        console.log(res_user[0].position);
                        if (res_user[0].position != undefined) {
                            position_ = res_user[0].position;
                        }

                        res.send([
                            {
                                "_id": res_user[0]._id,
                                "name": res_user[0].name,
                                "surname": res_user[0].surname,
                                "email": res_user[0].email,
                                "username": res_user[0].username,
                                "city": res_user[0].city,
                                "last_login": res_user[0].last_login,
                                "__v": 0,
                                "uuid": res_user[0].uuid,
                                "departments": _departments,
                                "role_name": roleIDs,
                                "position": position_
                            }

                        ]);
                    }
                });



            });


        }
    });
});
router.post('/check_user', function (req, res) {

    //check email + username

    if (req.body.email != undefined && req.body.username != undefined) {
        User.find({ "email": req.body.email }, function (err, resp1) {
            User.find({ "username": req.body.username }, function (err, resp2) {
                var _email;
                var _username;
                if (resp1.length == 0) { _email = { "email": "0" }; } else { _email = { "email": "1" }; }
                if (resp2.length == 0) { _username = { "username": "0" }; } else { _username = { "username": "1" }; }
                res.send([_email, _username]);
            });

        });
    } else if (req.body.email != undefined && req.body.username == undefined) {
        User.find({ "email": req.body.email }, function (err, resp1) {
            var _email;
            if (resp1.length == 0) { _email = { "email": "0" }; } else { _email = { "email": "1" }; }
            res.send([_email]);
        });
    } else if (req.body.email == undefined && req.body.username != undefined) {
        User.find({ "username": req.body.username }, function (err, resp2) {
            var _username;
            if (resp2.length == 0) { _username = { "username": "0" }; } else { _username = { "username": "1" }; }
            res.send([_username]);
        });

    } else {
        res.status(400).send("Bad Request");
    }
});

router.get('/admin/users', authorize, function (req, res) {

    var _results = [];

    User.find({ "uuid": req.headers['x-uuid'] }, { "role_id": 1, "city": 1 }, function (req1, res1) {

        if (!perm_per_role(res1[0].role_id, '/admin/users', 'GET')) {
            res.status(403).send("Forbidden");
        } else {

            request({
                url: bugUrlRest + "/rest/product?names=" + res1[0].city,
                method: "GET"
            }, function (error, bugResponse, body) {
                var department_arr = [];

                for (p = 0; p < JSON.parse(body).products[0].components.length; p++) {
                    if (JSON.parse(body).products[0].components[p].name != "default") {
                        department_arr.push({ "id": JSON.parse(body).products[0].components[p].id, "name": JSON.parse(body).products[0].components[p].name });
                    }
                }
        

                var max_rolID_admin = 1;
                for (var x = 0; x < res1[0].role_id.length; x++) {
                    if (res1[0].role_id[x] != 1) { // I can't return the sensecityAdmin users! 
                        if (res1[0].role_id[x] < max_rolID_admin) {
                            max_rolID_admin = res1[0].role_id[x];
                        }
                    }
                }

                User.find({ "city": res1[0].city }, function (err_user, res_user) {
                    for (var j = 0; j < res_user.length; j++) {

                        var roleIDs = [];
                        var _departments = [];

                        var max_rolID = 1;

                        for (var i = 0; i < role_obj.length; i++) {
                            for (var k = 0; k < res_user[j].role_id.length; k++) {

                                if (role_obj[i].id == res_user[j].role_id[k]) {
                                    roleIDs.push(role_obj[i].role_name);
                                }

                                if (res_user[j].role_id[k] > max_rolID) {
                                    max_rolID = res_user[j].role_id[k];
                                }
                            }
                        }

                        if (res_user[j].departments[0] != undefined || res_user[j].departments[0] != null) {
                            if (res_user[j].departments[0] != null) {
                                for (var t = 0; t < res_user[j].departments.length; t++) {
                                    if (res_user[j].departments[t] != null) {
                                        for (var z = 0; z < department_arr.length; z++) {
                                            if (department_arr[z].id == res_user[j].departments[t]) {
                                                _departments.push(department_arr[z].name);
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        var position_ = '';

                        if (res_user[j].position != undefined) {
                            position_ = res_user[j].position;
                        }

                        if (max_rolID_admin <= max_rolID) {
                            if (res_user[j].departments[0] == undefined || res_user[j].departments[0][0] == null) {
                                _results.push({
                                    "_id": res_user[j]._id,
                                    "name": res_user[j].name,
                                    "surname": res_user[j].surname,
                                    "email": res_user[j].email,
                                    "username": res_user[j].username,
                                    "city": res_user[j].city,
                                    "last_login": res_user[j].last_login,
                                    "__v": 0,
                                    "uuid": res_user[j].uuid,
                                    "departments": _departments,
                                    "role_name": roleIDs,
                                    "position": position_
                                });
                            } else {
                                _results.push({
                                    "_id": res_user[j]._id,
                                    "name": res_user[j].name,
                                    "surname": res_user[j].surname,
                                    "email": res_user[j].email,
                                    "username": res_user[j].username,
                                    "city": res_user[j].city,
                                    "last_login": res_user[j].last_login,
                                    "__v": 0,
                                    "uuid": res_user[j].uuid,
                                    "departments": _departments,
                                    "role_name": roleIDs,
                                    "position": position_
                                });
                            }
                        }
                        if ((res_user.length - 1) == j)
                            res.send(_results);
                    }
                });

            });

        }
    });
});

router.get('/admin/myprofile', authorize, function (req, res) {

    var roleIDs = [];
    var _departments = [];

    User.find({ "uuid": req.headers['x-uuid'] }, function (req1, res1) {
        console.log(res1);
        if (!perm_per_role(res1[0].role_id, '/admin/myprofile', 'GET')) {
            res.status(403).send("Forbidden");
        } else {

            request({
                url: bugUrlRest + "/rest/product?names=" + res1[0].city,
                method: "GET"
            }, function (error, bugResponse, body) {
                var department_arr = [];

                console.log(JSON.parse(body).products);

                for (p = 0; p < JSON.parse(body).products[0].components.length; p++) {
                    if (JSON.parse(body).products[0].components[p].name != "default") {
                        department_arr.push({ "id": JSON.parse(body).products[0].components[p].id, "name": JSON.parse(body).products[0].components[p].name });
                    }
                }
                console.log(JSON.stringify(department_arr));

                for (var i = 0; i < role_obj.length; i++) {
                    for (var k = 0; k < res1[0].role_id.length; k++) {
                        if (role_obj[i].id == res1[0].role_id[k]) {
                            roleIDs.push(role_obj[i].role_name);
                        }
                    }
                }

                var position_ = '';
                console.log(res1[0].position);
                if (res1[0].position != undefined) {
                    position_ = res1[0].position;
                }

                if (res1[0].departments != undefined || res_user[j].departments != null) {
                    if (res1[0].departments != null) {
                        for (var t = 0; t < res1[0].departments.length; t++) {

                            if (res1[0].departments[t] != null) {
                                for (var z = 0; z < department_arr.length; z++) {
                                    if (department_arr[z].id == res1[0].departments[t]) {
                                        _departments.push(department_arr[z].name);
                                    }
                                }
                            }
                        }
                    }
                }


                res.send([
                    {
                        "_id": res1[0]._id,
                        "name": res1[0].name,
                        "surname": res1[0].surname,
                        "email": res1[0].email,
                        "username": res1[0].username,
                        "city": res1[0].city,
                        "last_login": res1[0].last_login,
                        "uuid": res1[0].uuid,
                        "departments": _departments,
                        "role_id": roleIDs,
                        "position": position_
                    }

                ]);



            });

        }
    });

});

/*              ----------             */
/*              ----------             */
/*            CRUD USER END            */
/*              ----------             */
/*              ----------             */





/*              ----------             */
/*              ----------             */
/*     ADD ACTION PER ROLE START       */
/*              ----------             */
/*              ----------             */

router.get('/admin/roles', authorize, function (req, res) {

    User.find({ "uuid": req.headers['x-uuid'] }, function (req1, res1) {
        console.log(JSON.stringify(res1[0].role_id));
        if (!perm_per_role(res1[0].role_id, '/admin/roles', 'GET')) {
            res.status(403).send("Forbidden");
        } else {
            res.send(role_obj);
        }
    });
});

/*              ----------             */
/*              ----------             */
/*      ADD ACTION PER ROLE END        */
/*              ----------             */
/*              ----------             */

/*-------------------------------------*/

/*              ----------             */
/*              ----------             */
/*         ADD Product Start           */
/*              ----------             */
/*              ----------             */


router.post('/admin/add_city', function (req, res) {
    console.log(req.body);
    var flag_city_exist = false;
    //search if the city exist if exist message
    //var bugData1 = { "token": bugToken };

    request({
        url: bugUrlRest + "/rest/product?type=accessible",
        method: "GET"
    }, function (error, bugResponse, body1) {
        console.log(JSON.parse(body1));
        console.log(JSON.parse(body1).products.length);
        for (var q = 0; q < JSON.parse(body1).products.length; q++) {
            if (JSON.parse(body1).products[q].name == req.body.city) {
                flag_city_exist = true;
            }
        }

        if (flag_city_exist) {
            res.status(400).send("Bad Request");
        } else {

            var bugData2 = { "token": bugToken, "name": req.body.city, "description": req.body.city, "classification": "Unclassified", "is_open": true, "has_unconfirmed": true, "version": "unspecified" };
            //1. Add City (bugzilla)
            request({
                url: bugUrlRest + "/rest/product",
                method: "POST",
                json: bugData2
            }, function (error, bugResponse, body2) {
                //2. Add user Bugzilla
                console.log("2=>" + JSON.stringify(body2));
                var text_act;
                var possible = "0123456789";
                for (var i = 0; i < 10; i++)
                    text_act += possible.charAt(Math.floor(Math.random() * possible.length));

                var bugData3 = { "token": bugToken, "email": req.body.default_assignee, "full_name": req.body.name + " " + req.body.surname, "password": text_act };

                console.log("bugData3===>>>" + req.body.city);

                request({
                    url: bugUrlRest + "/rest/user",
                    method: "POST",
                    json: bugData3
                }, function (error, bugResponse, body3) {
                    console.log("3=>>" + JSON.stringify(body3));
                    //3. Add User in Mongo
                    var entry = new User({
                        position: req.body.position,
                        name: req.body.name,
                        surname: req.body.surname,
                        email: req.body.default_assignee,
                        username: req.body.username,
                        password: crypto.createHash('md5').update(req.body.password).digest("hex"),
                        role_id: [2, 3],
                        city: req.body.city,
                        departments: []
                    });

                    entry.save(function (err1, resp1) {

                        //4. Add Department
                        console.log("r1==>" + err1);
                        console.log("r1==>" + resp1);
                        var bugData4 = { "token": bugToken, "product": req.body.city, "name": "default", "description": "default", "default_assignee": bugzilla_default_email };
                        request({
                            url: bugUrlRest + "/rest/component",
                            method: "POST",
                            json: bugData4
                        }, function (error, bugResponse, body4) {
                            console.log("4==>>" + JSON.stringify(body4));
                            var bugData5 = { "token": bugToken, "product": req.body.city, "name": req.body.department, "description": req.body.department, "default_assignee": req.body.default_assignee };
                            request({
                                url: bugUrlRest + "/rest/component",
                                method: "POST",
                                json: bugData5
                            }, function (error, bugResponse, body5) {

                                /* ***Send Email*** */


                                var transporter = nodemailer.createTransport('smtps://' + config.config.email + ':' + config.config.password_email + '@smtp.gmail.com');

                                // setup e-mail data with unicode symbols 
                                var mailOptions = {
                                    from: '"Sense.City " <info@sense.city>', // sender address 
                                    to: req.body.default_assignee, // list of receivers 
                                    subject: ' SenseCity Info ', // Subject line 
                                    text: 'Συγχαρητήρια! \n\n Μόλις εισαγάγατε την πόλη ' + req.body.city +' με επιτυχία. \n\n Μπορείτε να μπείτε https://patras.sense.city/admin/ μετα στοιχεία που δηλώσατε και να ξεκινήσετε την διαχείριση της πόλης.\n\n\n <h2>1. Δημιουργία Χρηστών</h2> <h2>2. Δημιουργία Τμημάτων</h2>  <h2>3. Ανάθεση χρηστών σε τμήματα</h2> <h2>4. Εύρεση και αποστολή των ορίων της πόλης</h2>  \n\n\n Για οποιαδήποτε διευρκίνιση είμαστε στην διάθεση σας! \n\n\n Φιλικά, \n Η ομάδα του <b>SenseCity</b>', // plaintext body 
                                    html: 'Συγχαρητήρια! <br /><p> Μόλις εισαγάγατε την πόλη ' + req.body.city + ' με επιτυχία.</p> <p>Μπορείτε να μπείτε https://sense.city/admin/ μετα στοιχεία που δηλώσατε και να ξεκινήσετε την διαχείριση της πόλης.<br /><p>Τα βήματα που θα πρέπει να ακολουθήσετε είναι :</p> <h4>1. Δημιουργία Χρηστών</h4> <h4>2. Δημιουργία Τμημάτων</h4>  <h4>3. Ανάθεση χρηστών σε τμήματα</h4> <h4>4. Εύρεση και αποστολή των ορίων της πόλης</h4>  <br /> <p>Για οποιαδήποτε διευρκίνιση είμαστε στην διάθεση σας!</p><br /><br /> Φιλικά, <br /> Η ομάδα του <b>SenseCity</b><br /><img src="" />'
                                };

                                // send mail with defined transport object 
                                transporter.sendMail(mailOptions, function (error, info) {

                                    console.log(info);

                                    if (error) {
                                        console.log('error');
                                        res.send(["error"]);
                                        return console.log(error);

                                    }
                                    res.send(["ok"]);
                                    console.log('Message sent: ' + info.response);
                                });


                                /* ***Email Send*** */
                                console.log("4==>>" + JSON.stringify(body5));
                                var cityEntry = new Municipality({
                                    municipality: req.body.city,
                                    municipality_desc: req.body.city,
                                    boundaries: [{}],
                                    control_department: req.body.department
                                });

                                cityEntry.save(function (err1, resp1) {
                                    if (err1) {
                                        console.log(err1);
                                        res.status(400).send("Bad Request");
                                    } else {
                                        res.send("OK");
                                    }
                                });
                            });

                        });

                    });



                });
            });




        }
    });

});

router.post('/admin/edit_city', authorize, function (req, res) {

    var queryStr = {};
    
    if (req.body.municipality_desc != undefined) {
        queryStr["municipality_desc"] = req.body.municipality_desc;
    }
    if (req.body.boundaries != undefined) {
        queryStr["boundaries"] = req.body.boundaries;
    }
    if (req.body.sms_key_fibair != undefined) {
        queryStr["sms_key_fibair"] = req.body.sms_key_fibair;
    }
    if (req.body.mandatory_email != undefined) {
        if (req.body.mandatory_email) {
            queryStr["mandatory_email"] = req.body.mandatory_email;
        } else {
            queryStr["mandatory_email"] = req.body.mandatory_email;
        }
    }
    if (req.body.mandatory_sms != undefined) {
        queryStr["mandatory_sms"] = req.body.mandatory_sms;
    }
    if (req.body.active_sms_service != undefined) {
        queryStr["active_sms_service"] = req.body.active_sms_service;
    }
    if (req.body.control_department != undefined) {
        queryStr["control_department"] = req.body.control_department;
    }

    console.log(queryStr);

    User.find({ "uuid": req.headers['x-uuid'] }, function (err, resp) {
        if (err)
            console.log(err);

        console.log(resp);

        if (resp[0] != undefined) { 
        Municipality.update({
            "municipality": resp[0].city
        }, {
                $set: queryStr
            }, function (err2, resp2) {
                if (err2) { console.log(err2); }

                console.log(resp2);
                res.send(resp2);
            });
    }
    });


});

router.get('/available_city', function (req, res) {
    /*
    *
    *   ?city=cityname
    *
    *
    */
    var bool_flag = false;
    request({
        url: bugUrlRest + "/rest/product?type=accessible&include_fields=name",
        method: "GET"
    }, function (error, bugResponse, body) {
        for (var i = 0; i < JSON.parse(body).products.length; i++) {
            if (req.query.city == JSON.parse(body).products[i].name) {
                bool_flag = true;
            }
        }
        res.send({ bool_flag });
    });



});


router.get('/admin/cities', authorize, function (req, res) {

    User.find({ "uuid": req.headers['x-uuid'] }, function (req1, res1) {
        if (!perm_per_role(res1[0].role_id, '/admin/cities', 'GET')) {
            res.status(403).send("Forbidden");
        } else {
            request({
                url: bugUrlRest + "/rest/product?type=accessible&include_fields=name",
                method: "GET"
            }, function (error, bugResponse, body) {
                res.send(body);
            });
        }
    });
});


/*              ----------             */
/*              ----------             */
/*          ADD Product end            */
/*              ----------             */
/*              ----------             */

/*-------------------------------------*/

/*              ----------             */
/*              ----------             */
/*        ADD Component Start          */
/*              ----------             */
/*              ----------             */


router.get('/admin/departments', authorize, function (req, res) {

    var role = [];
    var return_array = [];
    var user_arr = [];
    var username_assignee = '';
    var position_assignee = '';
    var username_cp_access = '';
    var email_cp_access = '';
    var position_cp_access = '';
    var cc_username_assignee = '';
    var cc_position_assignee = '';

    User.find({ uuid: req.headers['x-uuid'] }, { role_id: 1, city: 1 }, function (err, response) {
    
        for (var i = 0; i < response[0].role_id[0].length; i++) {
            role.push(response[0].role_id[0][i]);
        }
        
        var g = 0;
        var no_dep = 0;
        
        request({
            url: bugUrlRest + "/rest/product?names=" + response[0].city + "&include_fields=components.id,components.name, components.default_assigned_to, components.default_cc_list, components.is_active",
            method: "GET"
        }, function (error, bugResponse, body) {
        
            User.find({ "city": response[0].city }, {
                "email": 1, "position": 1, "username": 1, "departments": 1
            }, function (err4, res4) {
            
                for (let tt = 0; tt < res4.length; tt++) {
                    user_arr.push({ "email": res4[tt].email, "position": res4[tt].position, "username": res4[tt].username, "departments": res4[tt].departments });
                }

                console.log("user_arr" + user_arr);

                var xxxs = JSON.parse(body).products[0].components;
                var k = 0;
                xxxs.forEach(function (entry) {
                    
                    User.find({
                        "email": entry.default_assigned_to
                    }, { "position": 1, "username": 1, "departments": 1 }, function (err3, resp3) {
                        
                        console.log("resp3=>" + JSON.stringify(resp3));
                        var objct = {};
                        
                        if (resp3[0] != null) {

                            no_dep = 1;
                            var cp_access = [];
                            var cc_list = [];

                            for (let ii = 0; ii < user_arr.length; ii++) {
                                if (entry.default_assigned_to == user_arr[ii].email) {
                                    username_assignee = res4[ii].username;
                                    position_assignee = res4[ii].position;
                                    cp_access.push({ "email": entry.default_assigned_to, "username": username_assignee, "position": position_assignee });
                                } else if ((user_arr[ii].departments).indexOf(entry.id) != -1) {
                                    cp_access.push({ "email": res4[ii].email, "username": res4[ii].username, "position": res4[ii].position });
                                }

                                if (entry.default_cc_list != undefined) {
                                    for (let ww = 0; ww < entry.default_cc_list.length; ww++) {
                                        if (entry.default_cc_list[ww].login_name == user_arr[ii].email) {
                                            cc_username_assignee = res4[ii].username;
                                            cc_position_assignee = res4[ii].position;
                                            cc_list.push({ "email": entry.default_cc_list[ww].login_name, "username": cc_username_assignee, "position": cc_position_assignee });
                                        }
                                    }
                                }

                            }

                            objct.departmentID = entry.id;
                            objct.default_assigned_email = [{ "assignee_email": entry.default_assigned_to, "username": username_assignee, "position": position_assignee }];

                            objct.default_cc_list = cc_list;
                            objct.cp_access = cp_access;
                            objct.is_active = entry.is_active;
                            objct.component_name = entry.name;
                            
                            if (objct.component_name !== "default") {
                                return_array.push(objct);
                            }

                            console.log((g + 1) + ' ==' + xxxs.length);

                            if ((g + 1) == xxxs.length) {
                                res.send(return_array);
                            }
                        } 

                        console.log("=>"+g);
                        g++;
                    });

                    k++;


                });
            }); //end user find

        });
    });
});

router.post('/admin/add_departments', authorize, function (req, res) {

    console.log(req.body);
    console.log(req.headers['x-uuid']);



    User.find({ uuid: req.headers['x-uuid'] }, { role_id: 1, city: 1 }, function (err, response) {

        var arr_users = [];

        var bugData1 = { "token": bugToken, "product": response[0].city, "name": req.body.department, "description": req.body.department, "default_assignee": req.body.default_assignee, "default_cc": req.body.default_cc };
        //arr_users = req.body.default_cc;        
        for (var p = 0; p < req.body.cp_access.length; p++) {
            arr_users.push(req.body.cp_access[p]);
        }
        //arr_users.push(req.body.default_assignee);

        request({
            url: bugUrlRest + "/rest/component",
            method: "POST",
            json: bugData1
        }, function (error, bugResponse, body) {
            if (error)
                console.log(error);

            console.log(body);

            if (body.error != undefined) {
                var string_rtrn = "Bad Request";
                if (body.code == 1200) {
                    string_rtrn = "DUPLICATE_DEPARTMENT";
                }
                res.status(400).send(string_rtrn);
            } else {
                var q = 0;

                for (var i = 0; i < arr_users.length; i++) {


                    User.find({ "email": arr_users[q] }, function (err1, resp1) {
                        if (err1)
                            console.log(err1);

                        if (resp1.length != 0) {

                            var department_id = [];
                            if (resp1[0].departments.length > 0) {
                                for (w = 0; w < resp1[0].departments.length; w++) {
                                    console.log(w);
                                    if (resp1[0].departments[w] != body.id) {
                                        department_id.push(body.id);
                                    } else {
                                        department_id.push(resp1[0].departments[w]);
                                    }
                                }
                            } else {

                                department_id.push(body.id);
                            }

                            if ((resp1[0].departments).indexOf(body.id) == -1) {
                                User.update({ "email": arr_users[q] }, { $set: { "departments": department_id } }, function (err3, res3) {
                                    if (err3)
                                        console.log(err3);
                                    console.log("User.update");
                                });
                            } else {

                            }

                            q++;

                            if (q == arr_users.length) {
                                res.send(body);
                            }
                        } else {
                            res.status(400).send("Bad Request");
                        }
                    });
                }
            }
        });
    });
});



router.post('/admin/edit_departments', authorize, function (req, res) {

    console.log(req.body);
    console.log(req.headers['x-uuid']);



    User.find({ uuid: req.headers['x-uuid'] }, { role_id: 1, city: 1 }, function (err, response) {

        var arr_users = [];

        var bugData1 = { "token": bugToken, "product": response[0].city, "ids": req.body.id, "name": req.body.department, "description": req.body.department, "default_assignee": req.body.default_assignee, "default_cc": req.body.default_cc };
        //arr_users = req.body.default_cc;        
        for (var p = 0; p < req.body.cp_access.length; p++) {
            arr_users.push(req.body.cp_access[p]);
        }
        //arr_users.push(req.body.default_assignee);

        request({
            url: bugUrlRest + "/rest/component/84",
            method: "PUT",
            json: bugData1
        }, function (error, bugResponse, body) {
            console.log(body);
            if (error)
                console.log(error);
            if (body.error != undefined) {
                var string_rtrn = "Bad Request";
                if (body.code == 1200) {
                    string_rtrn = "DUPLICATE_DEPARTMENT";
                }
                res.status(400).send(string_rtrn);
            } else {
                var q = 0;

                for (var i = 0; i < arr_users.length; i++) {


                    User.find({ "email": arr_users[q] }, function (err1, resp1) {
                        if (err1)
                            console.log(err1);

                        if (resp1.length != 0) {

                            var department_id = [];
                            if (resp1[0].departments.length > 0) {
                                for (w = 0; w < resp1[0].departments.length; w++) {
                                    console.log(w);
                                    if (resp1[0].departments[w] != body.id) {
                                        department_id.push(body.id);
                                    } else {
                                        department_id.push(resp1[0].departments[w]);
                                    }
                                }
                            } else {

                                department_id.push(body.id);
                            }

                            if ((resp1[0].departments).indexOf(body.id) == -1) {
                                User.update({ "email": arr_users[q] }, { $set: { "departments": department_id } }, function (err3, res3) {
                                    if (err3)
                                        console.log(err3);
                                    console.log("User.update");
                                });
                            } else {

                            }

                            q++;

                            if (q == arr_users.length) {
                                res.send(body);
                            }
                        } else {
                            res.status(400).send("Bad Request");
                        }
                    });
                }
            }
        });
    });
});



/*              ----------             */
/*              ----------             */
/*         ADD Component end           */
/*              ----------             */
/*              ----------             */

/*-------------------------------------*/

/*              ----------             */
/*              ----------             */
/*   Check Function permission start   */
/*              ----------             */
/*              ----------             */

//authorize middleware
function authorize(req, res, next) {
    if (req.headers['x-uuid'] != undefined) {
        User.find({ uuid: req.headers['x-uuid'] }, function (err, response) {
            if (response.length > 0)
                next();
            else
                res.send("failure");
        });
    } else {
        res.status(403).send("Forbidden");
    }
}


function perm_per_role(_role, _url, _method) {

    var i = 0;
    var flag_ = false;
    console.log(_role + "||" + _url + "||" + _method);

    for (i = 0; i < perm_per_role_obj.length; i++) {
        
        if (_url == perm_per_role_obj[i]._url && _method == perm_per_role_obj[i]._method) {
            for (var j = 0; j < _role.length; j++) {
                for (var k = 0; k < perm_per_role_obj[i]._role_ids.length; k++) {
                    if (_role[j] == perm_per_role_obj[i]._role_ids[k]) {
                        flag_ = true;
                        k = perm_per_role_obj[i]._role_ids.length - 1;
                        j = _role.length - 1;
                        i = perm_per_role_obj.length - 1;
                    }
                }

            }
        }


    }
    console.log(flag_);
    return flag_;




}

/*              ----------             */
/*              ----------             */
/*    Check Function permission end    */
/*              ----------             */
/*              ----------             */

/*-------------------------------------*/


router.get('/admin/roles', authorize, function (req, res) {

});



router.get('/image_issue', function (req, res) {

    var bugParams1 = "?bug_id=" + req.query.bug_id + "&include_fields=id,alias";
    request({
        url: bugUrlRest + "/rest/bug" + bugParams1,
        method: "GET"
    }, function (error, response, body) {        
        if (JSON.parse(response.body).bugs != undefined) {
            var img_alias = JSON.parse(response.body).bugs[0].alias[0];
            if (img_alias != undefined) {
                file_exitst(config.config.img_path + "original/" + img_alias + "_0.png", function (err, resp) {
                    if (err)
                        console.log(err);

                    if (resp) {
                        if (req.query.resolution == "full") {
                            res.type('png').sendFile(config.config.img_path + "original/" + img_alias + "_0.png");
                        } else if (req.query.resolution == "medium") {
                            res.type('png').sendFile(config.config.img_path + "medium/" + img_alias + "_0_450x450.png");
                        } else if (req.query.resolution == "small") {
                            res.type('png').sendFile(config.config.img_path + "small/" + img_alias + "_0_144x144.png");
                        } else {
                            res.status(404).send('Not found');
                        }
                    }
                    else {
                        res.status(404).send('Not found');
                    }
                });
            } else {
                res.status(404).send('Not found');
            }
        }
        else { 
            res.status(404).send('Not found');
        }
    });

});

//POST router
router.post('/issue', function (req, res) {

    if (req.body.mobile_num != undefined) {
        var _mobile_num = '';
        var _email_user = '';

        if (req.body.mobile_num != undefined) {
            _mobile_num = req.body.mobile_num;
        }

        if (req.body.email_user != undefined) {
            _email_user = req.body.email_user;
        }

        // Start Check The logic send email - sms mandatory

        Municipality.find({ boundaries: { $geoIntersects: { $geometry: { "type": "Point", "coordinates": [req.body.loc.coordinates[0], req.body.loc.coordinates[1]] } } } }, { "municipality": 1, "sms_key_fibair": 1, "mandatory_sms": 1, "mandatory_email": 1 }, function (req1, res1) {
            var _res1 = JSON.stringify(res1);
            console.log("Municipality.find()");
            if (JSON.parse(_res1)[0].mandatory_email == true && _email_user == '') {
                //Forbidden
                res.status(403).send([{ "error_msg": "Required_email" }]);
            }

            if (JSON.parse(_res1)[0].mandatory_sms == true && _mobile_num == '') {
                res.status(403).send([{ "error_msg": "Required_sms" }]);
            }
        });

        // end Check The logic send email - sms mandatory
    }

    var anonymous_status = "true";

    var return_var;
    var city_name = '';
    var city_address = '';

    //console.log(req);

    if (req.body.hasOwnProperty('city_address')) {
        city_address = req.body.city_address;
    }

    if (!req.body.hasOwnProperty('issue') ||
        !req.body.hasOwnProperty('loc') ||
        !req.body.hasOwnProperty('value_desc') ||
        !req.body.hasOwnProperty('device_id')) {
        res.statusCode = 403;
        return res.send({ "message": "Forbidden" });
    } else {

        Municipality.find({
            boundaries:
                {
                    $geoIntersects:
                        {
                            $geometry: {
                                "type": "Point",
                                "coordinates": req.body.loc.coordinates
                            }
                        }
                }
        }, function (err, response) {

            console.log();
            console.log("Municipality.find()");

            if (req.body.issue == "garbage") {

                console.log(req.body.loc.coordinates);
                console.log(parseFloat(req.body.loc.coordinates[0]));
                console.log(parseFloat(req.body.loc.coordinates[1]));

                binAlive.find({ loc: { $nearSphere: { $geometry: { type: "Point", "coordinates": [parseFloat(req.body.loc.coordinates[0]), parseFloat(req.body.loc.coordinates[1])] }, $maxDistance: 30}}}, function (error1, response1) {
                    if (error1) { console.log(error1); }

                    
                    if (response1[0] != undefined) {
                        console.log(response1);
                        console.log("length===>"+response1.length);
                        var ww = 0;
                        
                        for (ww = 0; ww< response1.length; ww++) {
                            var objectPost = {
                                "hwid": response1[ww].hwid, "binID": response1[ww].binID, "isAlarm": "1", "alarmMessage": req.body.value_desc, "binAddress": response1[ww].binAddress, "binTypeID": response1[ww].binTypeID, "latitude": req.body.loc.coordinates[1], "longitude": req.body.loc.coordinates[0], "zoneID": response1[ww].zoneID, "customID": response1[ww].customID, "accx": "0", "accy": "0", "accz": "0", "measurement": "0", "temperature": "0", "batteryLevel": "0", "signal": "0"
                            };

                            console.log("send BinAlive");

                            request({
                                url: "http://api.motesense.com:8080/motesense2/api/wmsapi/insertNewReading",
                                headers: {
                                    "userName": "georgoud",
                                    "session": "1"
                                },
                                method: "POST",
                                json: objectPost
                            }, function (errbin, resbin) {

                                console.log("BinAlive");
                                console.log(resbin);
                                console.log("  -----------------------------------------------------  ");
                            });
                            
                        }
                        /*
                         hwid;
                         binID;
                         isAlarm;
                         alarmMessage;
                         binAddress;
                         binTypeID;
                         latitude;
                         longitude;
                         zoneID;
                         customID;
                         accx;  
                         accy;
                        accz; 
                        measurement; 
                        temperature; 
                        batteryLevel;
                        signal;
                         */

                        /* Attributes binAlive that not send it in post request */
                        /*
                        wmsReadingID;   valid;  dateTime; binTypeName;
                        maxGreenHeight; maxYellowHeight;
                        */


                        /*[{
                            loc: { coordinates: [Array], type: 'Point' },
                            _id: 5b352d975c6c8d23b4d26fb6,
                            hwid: 'String1',
                            binID: 'String2',
                            binTypeID: 'String3',
                            binSuperTypeID: 'String4',
                            interval: 'String5',
                            binAddress: 'String6',
                            zoneID: 'String7',
                            binStatus: 'String8',
                            binClearDates: 'String9',
                            notes: 'String10',
                            customID: 'String11',
                            __v: 0
                        }]*/


                    } else {
                        console.log("No entry");
                    }
                });



                /*   NeighBor   */




                neighBor.find({ loc: { $nearSphere: { $geometry: { type: "Point", "coordinates": [parseFloat(req.body.loc.coordinates[0]), parseFloat(req.body.loc.coordinates[1])] }, $maxDistance: 50 } } }, function (errneighBor, respneighBor) {
                    if (errneighBor) { console.log(errneighBor); }

                    console.log(respneighBor);
                    /*
                    request({
                        url: "https://apis.nbg.gr/public/sandbox/socialnetwork.sandbox/v1/SocialActivities/userMessageSend",
                        headers: {
                            "accept": "text/json",
                            "content-type": "application/json",
                            "provider_id": "NBG.gr",
                            "provider": "NBG",
                            "user_id": resp2.body.payload.UserId,
                            "username": req.body.userEmail,
                            "sandbox_id": "hackathonSenseCity",
                            "application_id": "5b5b297e-9061-4bbe-ab61-b4094fd2709e",
                            "x-ibm-client-id": "5b5b297e-9061-4bbe-ab61-b4094fd2709e"
                        },
                        method: "POST",
                        json: {
                            "header": {
                                "ID": "5b5b297e-9061-4bbe-ab61-b4094fd2709e",
                                "application": "5b5b297e-9061-4bbe-ab61-b4094fd2709e",
                                "bank": "NBG",
                                "hostSession": null,
                                "channel": "web",
                                "customer": 0,
                                "logitude": 0,
                                "latitude": 0,
                                "go4moreMember": "true",
                                "TAN": null
                            },
                            "payload": {
                                "socialNetworkId": "b3660585-74ca-45cf-ba32-ec3e6c0268e8",
                                "memberId": "{{memberId1}}",
                                "contactId": "{{contactIdMember2}}",
                                "content": req.body.value_desc
                            }
                        }
                    }, function (errbin, resbin) {

                    });
                    
                    */


                });












                 /*   END NeighBor   */






            }
                /*db.places.find(
                    {
                        location:
                            {
                                $near:
                                    {
                                        $geometry: { type: "Point", coordinates: [-73.9667, 40.78] },
                                        $minDistance: 1000,
                                        $maxDistance: 5000
                                    }
                            }
                    }
                )
            }*/

            var entry = new Issue({
                loc: { type: 'Point', coordinates: req.body.loc.coordinates },
                issue: req.body.issue,
                device_id: req.body.device_id,
                value_desc: req.body.value_desc,
                comments: req.body.comments,
                city_address: city_address
            });

            entry.image_name = '';

            var has_img = 0;
            if (req.body.image_name.indexOf("base64") !== -1) {
                has_img = 1;
            }
            if (response.length > 0) {

                entry.municipality = response[0]["municipality"];

                city_name = response[0].municipality_desc;
            } else {
                entry.municipality = '';
                city_name = '';
            }
            entry.save(function (err1, resp) {
                if(err1)
                    console.log(err1);

                console.log("entry.save");
                if (err1) {
                    console.log(err1);
                } else {

                    if (has_img == 1) {

                        var base64img = req.body.image_name;
                        var base64Data = base64img.split(",");

                        var default_img_id = 0;
                        var source_img_file = config.config.img_path;

                        require("fs").writeFile(source_img_file + "original/" + resp._id + "_" + default_img_id + ".png", base64Data[1], 'base64', function (err) {
                            if (err) {
                                console.log(err);
                            }

                            console.log("----");
                            resizeCrop({
                                src: source_img_file + "original/" + resp._id + "_" + default_img_id + ".png",
                                dest: source_img_file + "small/" + resp._id + "_" + default_img_id + "_144x144.png",
                                height: 144,
                                width: 144,
                                gravity: "center"
                            }, function (err1, filePath) {
                                // do something
                                console.log("ok 144x144");

                                if (err1) {
                                    console.log(err1);
                                }

                            });

                            console.log("----");
                            resizeCrop({
                                src: source_img_file + "original/" + resp._id + "_" + default_img_id + ".png",
                                dest: source_img_file + "medium/" + resp._id + "_" + default_img_id + "_450x450.png",
                                height: 450,
                                width: 450,
                                gravity: "center"
                            }, function (err2, filePath) {
                                // do something 
                                console.log("ok 450x450");
                                if (err2) {
                                    console.log(err2);
                                }
                            });

                        });

                        if (resp.issue == "garbage" || resp.issue == "road-constructor" || resp.issue == "lighting" || resp.issue == "plumbing" || resp.issue == "protection-policy" || resp.issue == "green" || resp.issue == "environment") {
                            if (response.length > 0) {

                                var bugData1 = { "token": bugToken, "summary": resp.issue, "priority": "normal", "bug_severity": "normal", "cf_city_name": city_name, "alias": [resp._id.toString()], "url": resp.value_desc, "product": response[0]["municipality"], "component": config.config.bug_component, "version": "unspecified", "cf_city_address": city_address };

                                request({
                                    url: bugUrlRest + "/rest/bug",
                                    method: "POST",
                                    json: bugData1
                                }, function (error, bugResponse, body) {
                                    console.log("/rest/bug");
                                    if (error != null) { console.log(error) };

                                    if (!error && bugResponse.statusCode === 200) {
                                        res.send({ "_id": resp._id, "bug_id": body.id });
                                    } else {
                                        console.log("error: " + error);
                                        console.log("bugResponse.statusCode: " + bugResponse.statusCode);
                                        console.log("bugResponse.statusText: " + bugResponse.statusText);
                                    }
                                });
                            }
                        }



                    } else {

                        if (resp.issue == "garbage" || resp.issue == "road-constructor" || resp.issue == "lighting" || resp.issue == "plumbing" || resp.issue == "protection-policy" || resp.issue == "green" || resp.issue == "environment" || resp.issue == "enviroment") {
                            if (response.length > 0) {

                                var bugData1 = { "token": bugToken, "summary": resp.issue, "priority": "normal", "bug_severity": "normal", "cf_city_name": city_name, "alias": [resp._id.toString()], "url": resp.value_desc, "product": response[0]["municipality"], "component": config.config.bug_component, "version": "unspecified", "cf_city_address": city_address };
                                console.log("1234567===>>" + bugData1);
                                request({
                                    url: bugUrlRest + "/rest/bug",
                                    method: "POST",
                                    json: bugData1
                                }, function (error, bugResponse, body) {
                                    console.log("/rest/bug");
                                    if (error != null) { console.log(error) };

                                    if (!error && bugResponse.statusCode === 200) {
                                        // console.log(body);                                        
                                        res.send({ "_id": resp._id });
                                    } else {
                                        console.log("error: " + error);
                                        console.log("bugResponse.statusCode: " + bugResponse.statusCode);
                                        console.log("bugResponse.statusText: " + bugResponse.statusText);
                                    }
                                });
                            }
                        }
                    }
                }
            });
        });
    }
});

router.post('/issue/:id', function (req, res) {
    var bodyParams;

    Issue.find({ "_id": req.params.id }, { "municipality": 1, "issue": 1 }, function (req1, res1) {
        console.log("/issue/:id -> Issue.find()");
        if (res1 != undefined) {
            cityPolicy.find({
                "city": res1[0].municipality,
                "category": res1[0].issue
            }, { "anonymous": 1 }, function (req2, res2) {
                Municipality.find({ "municipality": res1[0].municipality }, { "control_department": 1 }, function (req4, res4) {
                    console.log("/issue/:id -> Municipality.find()");
                    var default_department = JSON.stringify(res4);
                    if (res2[0].anonymous == "true") {
                        ///* Update the issue with a specific id 
                        ///* Add cc list and move from default component to "ΤΜΗΜΑ ΕΠΙΛΥΣΗΣ ΠΡΟΒΛΗΜΑΤΩΝ" and Custom field values
                        bodyParams = { "token": bugToken, "ids": [body_parse.bugs[0].id], "component": JSON.parse(default_department)[0].control_department, "reset_assigned_to": true, "cf_issues": resp.issue };
                        request({
                            url: bugUrlRest + "/rest/bug/" + req.params.id,
                            method: "PUT",
                            json: bodyParams
                        }, function (error1, response1, body1) {
                            console.log("/issue/:id -> /rest/bug/id");
                            if (resp.comments === null || resp.comments === "") {
                                resp.comments = "undefined";
                            }
                            var bugComment1 = { "token": bugToken, "id": body_parse.bugs[0].id, "comment": resp.comments };

                            request({
                                url: bugUrlRest + "/rest/bug/" + body_parse.bugs[0].id + "/comment",
                                method: "POST",
                                json: bugComment1
                            }, function (error2, bugResponse2, body2) {
                                console.log("/issue/:id -> /rest/bug/id/comment");
                                if (body2.id != null) {
                                    request({
                                        url: bugUrlRest + "/rest/bug/comment/" + body2.id + "/tags",
                                        method: "PUT",
                                        json: { "add": ["DEPARTMENT:all", "STATUS:CONFIRMED"], "id": body2.id, "token": bugToken }
                                    }, function (error4, response4, body4) {
                                        console.log("/issue/:id -> /rest/bug/comment/id/tags");
                                    });
                                }
                            });

                            request({
                                url: "/rest/bug/" + body_parse.bugs[0].id + "/comment",
                                method: "GET"
                            }, function (error3, bugResponse3, body3) {
                                console.log("/issue/:id -> /rest/bug/id/comment");
                            });

                        });


                    } else {
                        Municipality.find({ "municipality": res1[0].municipality }, { "mandatory_sms": 1, "mandatory_email": 1 }, function (req4, res4) {
                            console.log("/issue/:id -> Municipality.find()");
                            var result_ = JSON.stringify(res4);
                            if (JSON.parse(result_)[0].mandatory_sms == true) {
                                console.log('/issue/:id -> sms');
                            }
                            if (JSON.parse(result_)[0].mandatory_email == true) {
                                console.log('/issue/:id -> email');
                            }

                            if (req.body.uuid != '' && req.body.name != '') {
                                Issue.findOneAndUpdate({ "_id": req.params.id }, {
                                    user: { uuid: req.body.uuid, name: req.body.name, email: req.body.email, phone: req.body.mobile_num }
                                }, function (err, resp) {
                                    console.log("/issue/:id -> Update Issue with name,email & mobile num!");
                                    var _resp = JSON.stringify(resp);

                                    if (err)
                                        throw err;

                                    ///* Create user acount to bugzilla			
                                    var bugCreateuser1 = { "token": bugToken, "email": req.body.email };

                                    request({
                                        url: bugUrlRest + "/rest/user",
                                        method: "POST",
                                        json: bugCreateuser1
                                    }, function (error, response, body) {
                                        if (error) {
                                            console.log("/issue/:id -> User doesnot created! Error : " + error);
                                            return false;
                                        }
                                        console.log("/issue/:id -> User Created/already exist at bugzilla");

                                        ///* Find to bugzilla the issue and return the id
                                        var bugParams1 = "?alias=" + req.params.id + "&include_fields=id,alias";

                                        request({
                                            url: bugUrlRest + "/rest/bug" + bugParams1,
                                            method: "GET"
                                        }, function (error, response, body) {
                                            var body_parse = JSON.parse(body);

                                            if (body_parse.bugs[0] != undefined) {
                                                ///* Update the issue with a specific id 
                                                ///* Add cc list and move from default component to "ΤΜΗΜΑ ΕΠΙΛΥΣΗΣ ΠΡΟΒΛΗΜΑΤΩΝ" and Custom field values
                                                bodyParams = { "token": bugToken, "ids": [body_parse.bugs[0].id], "component": JSON.parse(default_department)[0].control_department, "cc": { "add": [req.body.email] }, "cf_creator": req.body.name, "cf_email": req.body.email, "cf_mobile": req.body.mobile_num, "reset_assigned_to": true, "cf_authedicated": 1, "cf_issues": resp.issue };
                                                request({
                                                    url: bugUrlRest + "/rest/bug/" + req.params.id,
                                                    method: "PUT",
                                                    json: bodyParams
                                                }, function (error1, response1, body1) {
                                                    console.log(error1);
                                                    if (resp.comments === null || resp.comments === "") {

                                                        resp.comments = "undefined";
                                                    }
                                                    var bugComment1 = { "token": bugToken, "id": body_parse.bugs[0].id, "comment": resp.comments };
                                                    request({
                                                        url: bugUrlRest + "/rest/bug/" + body_parse.bugs[0].id + "/comment",
                                                        method: "POST",
                                                        json: bugComment1
                                                    }, function (error2, bugResponse2, body2) {
                                                        console.log("/issue/:id -> Insert comments to bugzilla");

                                                        if (body2.id != null) {
                                                            Municipality.find({ "municipality": JSON.parse(_resp).municipality }, { "sms_key_fibair": 1 }, function (req11, res11) {
                                                                //console.log(res11[0].sms_key_fibair);
                                                                var mob_sms_key_fibair_base64 = new Buffer(res11[0].sms_key_fibair + ":").toString("base64");

                                                                if (mob_sms_key_fibair_base64 != undefined) {

                                                                    if (mob_sms_key_fibair_base64 != '') {

                                                                        if (req.body.mobile_num != '') {
                                                                            request({
                                                                                url: "https://api.theansr.com/v1/sms",
                                                                                method: "POST",
                                                                                form: { 'sender': JSON.parse(_resp).municipality, 'recipients': '30' + req.body.mobile_num, 'body': JSON.parse(_resp).municipality + '.sense.city! ΤΟ ΑΙΤΗΜΑ ΣΑΣ ΚΑΤΑΧΩΡΗΘΗΚΕ ΣΤΟ ΔΗΜΟ ΜΕ ΚΩΔΙΚΟ ' + body_parse.bugs[0].id + '. ΛΕΠΤΟΜΕΡΕΙΕΣ: https://' + JSON.parse(_resp).municipality + '.sense.city/bug/' + body_parse.bugs[0].id },
                                                                                headers: { "Authorization": 'Basic ' + mob_sms_key_fibair_base64, 'content-type': 'application/form-data' }
                                                                            }, function (err, response) {
                                                                                console.log("/issue/:id -> Insert comments to bugzilla");
                                                                            });

                                                                        }
                                                                    }
                                                                }
                                                            });
                                                            
                                                            var department = `DEPARTMENT:${JSON.parse(default_department)[0].control_department}`;
                                                            request({
                                                                url: bugUrlRest + "/rest/bug/comment/" + body2.id + "/tags",
                                                                method: "PUT",
                                                                json: { "add": [department, "STATUS:CONFIRMED"], "id": body2.id, "token": bugToken }
                                                            }, function (error4, response4, body4) {

                                                                console.log("/issue/:id -> Insert Tags to comment");

                                                            });
                                                        }
                                                    });

                                                    request({
                                                        url: "/rest/bug/" + body_parse.bugs[0].id + "/comment",
                                                        method: "GET"
                                                    }, function (error3, bugResponse3, body3) {
                                                        console.log("/issue/:id -> /rest/bug/id/comment");
                                                    });
                                                });
                                            }
                                        });
                                    });
                                    res.send({ "description": "ok" });
                                });
                            } else {
                                res.send({ "description": "no-update" });
                            }
                        });
                    }

                });
            });
        } else {
            res.send({ "description": "no-update" });
        }
    });
});

/* ** Test ** */





router.get('/issue', function (req, res) {

    req.send_user = 0;
    req.send_component = 1;
    req.send_severity = 0;
    req.send_priority = 0;
    req.admin_user = 0;

    get_issues(req, function (result) {
        //console.log(result);

        res.send(result);
    });

});

//router.get('/admin/issue', authentication, function (req, res) {
router.get('/admin/issue', authorize, function (req, res) {

    req.send_user = 1;
    req.send_component = 1;
    req.send_severity = 1;
    req.send_priority = 1;
    req.admin_user = 1;

    var _city_department = '';
    var _city_department_count = '';
    //Role.find({ "uuid": req.headers['x-uuid'], "role": req.headers['x-role'] }, { "city": 1, "departments": 1 }, function (error, resp) {
    User.find({ "uuid": req.headers['x-uuid'] }, { "city": 1, "departments": 1 }, function (error, resp) {

        console.log(JSON.stringify(resp[0].departments.length));

        var bugParams = '';
        var depart_ini = '';
        console.log("/admin/issue -> Role.find()");



        request({
            url: bugUrlRest + "/rest/product?names=" + resp[0].city,//bugParams,
            method: "GET"
        }, function (error5, response5, body5) {
            var compnts = JSON.parse(body5).products[0].components;
            console.log(compnts.length);

            for (var k = 0; k < compnts.length; k++) {
                console.log(compnts[k].id);
                console.log(compnts[k].name);
            }






            //if resp[0].city == undefined -> bad request
            Municipality.find({ "municipality": resp[0].city }, { "control_department": 1 }, function (req8, res8) {
                var default_department = JSON.stringify(res8);

                console.log("/admin/issue -> Municipality.find()");

                if (resp != undefined) {
                    console.log("OK-1!");
                    if (resp[0].departments.length > 1) {
                        console.log("OK-2!");
                        for (var i = 0; i < compnts.length; i++) {
                            for (var k = 0; k < resp[0].departments.length; k++) {
                                if (resp[0].departments[k].department == compnts[i].id) {
                                    if (i > 0) {
                                        _city_department += "&";
                                    }

                                    _city_department_count = compnts[i].name;
                                    _city_department += "f" + (4 + i) + "=component&o" + (4 + i) + "=equals&v" + (4 + i) + "=" + encodeURIComponent(_city_department_count);
                                }
                            }
                        }
                        /*for (var i = 0; i < resp[0].departments.length; i++) {
                            if (i > 0) {
                                _city_department += "&";
                            }
    
                            _city_department_count = resp[0].departments[i].department;
                            _city_department += "f" + (4 + i) + "=component&o" + (4 + i) + "=equals&v" + (4 + i) + "=" + encodeURIComponent(_city_department_count);
                        }*/
                        _city_department += "&j3=OR&f3=OP&f" + (i + 4) + "=CP";
                    } else if (resp[0].departments.length == 1 && resp[0].departments[0].department == undefined) {
                        _city_department = "f4=component&o4=equals&v4=" + encodeURIComponent(JSON.parse(default_department)[0].control_department);
                        depart_ini = JSON.parse(default_department)[0].control_department;
                    } else {
                        depart_ini = JSON.parse(default_department)[0].control_department;//"Τμήμα επίλυσης προβλημάτων";
                        _city_department_count = resp[0].departments;
                        _city_department = "f4=component&o4=equals&v4=" + encodeURIComponent(_city_department_count);
                    }
                }

                console.log(_city_department);

                if (req.query.bug_id != undefined) {
                    if (depart_ini == JSON.parse(default_department)[0].control_department) {
                        bugParams = "?f2=bug_id&o2=equals&v2=" + req.query.bug_id + "&f3=product&o3=equals&v3=" + resp[0].city + "&include_fields=id,alias,status,component";
                    } else {
                        bugParams = "?" + _city_department + "&f1=bug_id&o1=equals&v1=" + req.query.bug_id + "&f2=product&o2=equals&v2=" + resp[0].city + "&include_fields=id,alias,status,component";
                    }
                } else {
                    if (JSON.parse(default_department)[0] != undefined) {
                        if (depart_ini == JSON.parse(default_department)[0].control_department) {
                            bugParams = "?f3=product&o3=equals&v3=" + resp[0].city + "&include_fields=id,alias,status,component";
                        } else {
                            bugParams = "?" + _city_department + "&f1=product&o1=equals&v1=" + resp[0].city + "&include_fields=id,alias,status,component";
                        }
                    }

                }

                request({
                    url: bugUrlRest + "/rest/bug" + bugParams,//bugParams,
                    method: "GET"
                }, function (error1, response, body) {

                    //console.log(JSON.stringify(body));

                    console.log("/admin/issue -> /rest/bug");
                    if (JSON.parse(body).bugs != undefined) {
                        if (JSON.parse(body).bugs.length > 0) {
                            var _component_dep = JSON.parse(body).bugs[0].component;

                            _component_dep = encodeURIComponent(_component_dep);

                            //if (_city_department.indexOf(_component_dep) > -1 || depart_ini == JSON.parse(default_department)[0].control_department) {
                            if (resp[0].departments.length > 0 || depart_ini == JSON.parse(default_department)[0].control_department) {
                                get_issues(req, function (result) {
                                    res.send(result);
                                });
                            }
                            else {
                                console.log('f1');
                                res.status(403).send('Forbidden');
                            }
                        } else {
                            res.send([]);
                        }
                    } else {
                        console.log('f2');
                        res.status(403).send('Forbidden');
                    }
                });



            });




        });

    });
});

var get_issues = function (req, callback) {
    
    var _bug_extra = "";
    var _user_extra = 0;

    if (req.send_user == 1) {
        _user_extra = 1;
    } else {
        _user_extra = 0;
    }

    if (req.send_component == 1) {
        _bug_extra += ",component";
    } else {
        _bug_extra += "";
    }

    if (req.send_severity == 1) {
        _bug_extra += ",priority";
    } else {
        _bug_extra += "";
    }

    if (req.send_priority == 1) {
        _bug_extra += ",severity";
    } else {
        _bug_extra += "";
    }

    var x_uuid = req.get('x-uuid');
    if ((req.query.hasOwnProperty("bug_id") || req.query.hasOwnProperty("mobile") || req.query.hasOwnProperty("email"))) {

        console.log("--1--");

        if (req.query.bug_id == "" && req.query.mobile == "" && req.query.email == "") {
            callback([]);
        } else {
            var _bug_id;
            var _mobile;
            var _email;
            var _limit;
            var _sort;
            var _offset;
            var _image;

            if (req.query.hasOwnProperty("bug_id")) {
                _bug_id = req.query.bug_id;
            }


            if (req.query.hasOwnProperty("mobile")) {
                _mobile = req.query.mobile;
            }

            if (req.query.hasOwnProperty("email")) {
                _email = req.query.email;
            }

            if (!req.query.hasOwnProperty('limit')) {
                _limit = 1000;
            } else {
                _limit = req.query.limit;
            }

            if (!req.query.hasOwnProperty('sort')) {
                _sort = "&order=bug_id%20DESC";
                _sort_mongo = -1;
            } else {
                if (req.query.sort == 1) {
                    _sort = "&order=bug_id%20ASC";
                    _sort_mongo = 1;
                } else if (req.query.sort == -1) {
                    _sort = "&order=bug_id%20DESC";
                    _sort_mongo = -1;
                }

            }

            if (!req.query.hasOwnProperty('offset')) {
                _offset = "";
            } else {
                _offset = "&offset=" + req.query.offset;
            }

            var bugParams1 = "?f1=bug_id&o1=equals&f2=cf_mobile&o2=equals&f3=cf_email&o3=equals&limit=" + _limit + _sort + _offset;

            if (_bug_id != undefined) {
                bugParams1 += "&v1=" + _bug_id;
            }
            if (_mobile != undefined) {
                bugParams1 += "&v2=" + _mobile;
            }
            if (_email != undefined) {
                bugParams1 += "&v3=" + _email;
            }

            if (req.admin_user == 1) {
                //isadmin
                bugParams1 += "&include_fields=id,alias,status,cf_authedicated,resolution,cf_city_address,cf_cc_mobile,cf_cc_name,cc" + _bug_extra;
            } else if (req.admin_user == 0) {
                //simpleuser
                bugParams1 += "&include_fields=id,alias,status,cf_authedicated,resolution,cf_city_address" + _bug_extra;
            }

            if (!req.query.hasOwnProperty('image_field')) {
                _image = 0;
            } else {
                if (req.query.image_field == 0) {
                    _image = 0;
                } else {
                    _image = 1;
                }
            }

            var ids = [];
            var bugzilla_results = [];
            var issue_return = [];

            request({
                url: bugUrlRest + "/rest/bug" + bugParams1,
                method: "GET"
            }, function (error, response, body) {
                var i_count = 0;
                var bugs_length = 0;

                if (JSON.parse(body).bugs != undefined) {
                    bugs_length = JSON.parse(body).bugs.length;
                }
                for (i_count = 0; i_count < bugs_length; i_count++) {
                    ids.push(JSON.parse(body).bugs[i_count].alias[0]);
                    bugzilla_results = JSON.parse(body).bugs;
                }

                if (_image == 0) {
                    if (_user_extra == 0) {
                        Issue.find({ "_id": { $in: ids } }, { "user": 0, "image_name": _image }, function (err, issue) {

                            //new start
                            if (err != null) { console.log("err   =   " + err); }
                            issue_return += '[';

                            for (var i = 0; i < issue.length; i++) {

                                var bug_id = 0;
                                var bug_status = "";
                                var bug_authenticate = "0";

                                var bug_component;
                                var bug_priority;
                                var bug_severity;
                                var bug_resolution;
                                var bug_address;
                                var cf_cc_mobile;
                                var cf_cc_name;
                                var cc;

                                for (var j = 0; j < bugzilla_results.length; j++) {

                                    if (bugzilla_results[j].alias[0] == issue[i]._id) {
                                        bug_id = bugzilla_results[j].id;
                                        bug_status = bugzilla_results[j].status;
                                        bug_authenticate = bugzilla_results[j].cf_authedicated;

                                        if (bugzilla_results[j].component != undefined) {
                                            bug_component = bugzilla_results[j].component;
                                        }
                                        if (bugzilla_results[j].priority != undefined) {
                                            bug_priority = bugzilla_results[j].priority;
                                        }
                                        if (bugzilla_results[j].severity != undefined) {
                                            bug_severity = bugzilla_results[j].severity;
                                        }

                                        if (bugzilla_results[j].resolution != undefined) {
                                            bug_resolution = bugzilla_results[j].resolution;
                                        }

                                        if (bugzilla_results[j].cf_city_address != undefined) {
                                            bug_address = bugzilla_results[j].cf_city_address;
                                        }

                                        if (bugzilla_results[j].cf_cc_mobile != undefined) {
                                            cf_cc_mobile = bugzilla_results[j].cf_cc_mobile;
                                        }

                                        if (bugzilla_results[j].cf_cc_name != undefined) {
                                            cf_cc_name = bugzilla_results[j].cf_cc_name;
                                        }

                                        if (bugzilla_results[j].cc != undefined) {
                                            cc = bugzilla_results[j].cc;
                                        }

                                    }
                                }

                                if (req.admin_user == 1) {
                                    //isadmin
                                    issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '","cf_cc_mobile":"' + cf_cc_mobile + '","cf_cc_name":"' + cf_cc_name + '","cc":"' + cc + '"}';
                                } else if (req.admin_user == 0) {
                                    //simpleuser
                                    issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '"}';
                                }


                                if (i < issue.length - 1) {
                                    issue_return += ',';
                                }
                            }

                            issue_return += ']';

                            callback(issue_return);


                        }).sort({ "create_at": _sort_mongo });
                    } else {
                        Issue.find({ "_id": { $in: ids } }, { "image_name": _image }, function (err, issue) {

                            //new start
                            if (err != null) { console.log("err   =   " + err); }
                            issue_return += '[';

                            for (var i = 0; i < issue.length; i++) {

                                var bug_id = 0;
                                var bug_status = "";
                                var bug_authenticate = "0";

                                var bug_component;
                                var bug_priority;
                                var bug_severity;
                                var bug_resolution;
                                var bug_address;
                                var cf_cc_mobile;
                                var cf_cc_name;
                                var cc;

                                for (var j = 0; j < bugzilla_results.length; j++) {
                                    if (bugzilla_results[j].alias[0] == issue[i]._id) {
                                        bug_id = bugzilla_results[j].id;
                                        bug_status = bugzilla_results[j].status;
                                        bug_authenticate = bugzilla_results[j].cf_authedicated;

                                        if (bugzilla_results[j].component != undefined) {
                                            bug_component = bugzilla_results[j].component;
                                        }
                                        if (bugzilla_results[j].priority != undefined) {
                                            bug_priority = bugzilla_results[j].priority;
                                        }
                                        if (bugzilla_results[j].severity != undefined) {
                                            bug_severity = bugzilla_results[j].severity;
                                        }

                                        if (bugzilla_results[j].resolution != undefined) {
                                            bug_resolution = bugzilla_results[j].resolution;
                                        }
                                        if (bugzilla_results[j].cf_city_address != undefined) {
                                            bug_address = bugzilla_results[j].cf_city_address;
                                        }

                                        if (bugzilla_results[j].cf_cc_mobile != undefined) {
                                            cf_cc_mobile = bugzilla_results[j].cf_cc_mobile;
                                        }

                                        if (bugzilla_results[j].cf_cc_name != undefined) {
                                            cf_cc_name = bugzilla_results[j].cf_cc_name;
                                        }

                                        if (bugzilla_results[j].cc != undefined) {
                                            cc = bugzilla_results[j].cc;
                                        }

                                    }
                                }

                                if (req.admin_user == 1) {
                                    //isadmin                                    
                                    issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","name":"' + issue[i].user.name + '","phone":"' + issue[i].user.phone + '","email":"' + issue[i].user.email + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '","cf_cc_mobile":"' + cf_cc_mobile + '","cf_cc_name":"' + cf_cc_name + '","cc":"' + cc + '"}';
                                } else if (req.admin_user == 0) {
                                    //simpleuser
                                    issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '"}';
                                }


                                if (i < issue.length - 1) {
                                    issue_return += ',';
                                }
                            }

                            issue_return += ']';

                            callback(issue_return);

                        }).sort({ "create_at": _sort_mongo });
                    }
                }
                else {
                    if (_user_extra == 0) {
                        Issue.find({ "_id": { $in: ids } }, { "user": 0 }, function (err, issue) {
                            //new start
                            if (err != null) { console.log("err   =   " + err); }

                            issue_return += '[';

                            for (var i = 0; i < issue.length; i++) {

                                var bug_id = 0;
                                var bug_status = "";
                                var bug_authenticate = "0";

                                var bug_component;
                                var bug_priority;
                                var bug_severity;
                                var bug_resolution;
                                var bug_address;
                                var cf_cc_mobile;
                                var cf_cc_name;
                                var cc;

                                for (var j = 0; j < bugzilla_results.length; j++) {
                                    if (bugzilla_results[j].alias[0] == issue[i]._id) {
                                        bug_id = bugzilla_results[j].id;
                                        bug_status = bugzilla_results[j].status;
                                        bug_authenticate = bugzilla_results[j].cf_authedicated;

                                        if (bugzilla_results[j].component != undefined) {
                                            bug_component = bugzilla_results[j].component;
                                        }
                                        if (bugzilla_results[j].priority != undefined) {
                                            bug_priority = bugzilla_results[j].priority;
                                        }
                                        if (bugzilla_results[j].severity != undefined) {
                                            bug_severity = bugzilla_results[j].severity;
                                        }

                                        if (bugzilla_results[j].resolution != undefined) {
                                            bug_resolution = bugzilla_results[j].resolution;
                                        }
                                        if (bugzilla_results[j].cf_city_address != undefined) {
                                            bug_address = bugzilla_results[j].cf_city_address;
                                        }

                                        if (bugzilla_results[j].cf_cc_mobile != undefined) {
                                            cf_cc_mobile = bugzilla_results[j].cf_cc_mobile;
                                        }

                                        if (bugzilla_results[j].cf_cc_name != undefined) {
                                            cf_cc_name = bugzilla_results[j].cf_cc_name;
                                        }

                                        if (bugzilla_results[j].cc != undefined) {
                                            cc = bugzilla_results[j].cc;
                                        }


                                    }
                                }

                                if (req.admin_user == 1) {
                                    //isadmin                                    
                                    issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '","cf_cc_mobile":"' + cf_cc_mobile + '","cf_cc_name":"' + cf_cc_name + '","cc":"' + cc + '"}';
                                } else if (req.admin_user == 0) {
                                    //simpleuser
                                    issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","bug_address":"' + bug_address + '"}';
                                }


                                if (i < issue.length - 1) {
                                    issue_return += ',';
                                }
                            }
                            issue_return += ']';
                            callback(issue_return);
                        }).sort({ "create_at": _sort_mongo });
                    }
                    else {
                        Issue.find({ "_id": { $in: ids } }, function (err, issue) {
                            //new start
                            if (err != null) { console.log("err   =   " + err); }

                            issue_return += '[';

                            for (var i = 0; i < issue.length; i++) {

                                var bug_id = 0;
                                var bug_status = "";
                                var bug_authenticate = "0";

                                var bug_component;
                                var bug_priority;
                                var bug_severity;
                                var bug_resolution;
                                var bug_address;
                                var cf_cc_mobile;
                                var cf_cc_name;
                                var cc;

                                for (var j = 0; j < bugzilla_results.length; j++) {
                                    if (bugzilla_results[j].alias[0] == issue[i]._id) {
                                        bug_id = bugzilla_results[j].id;
                                        bug_status = bugzilla_results[j].status;
                                        bug_authenticate = bugzilla_results[j].cf_authedicated;

                                        if (bugzilla_results[j].component != undefined) {
                                            bug_component = bugzilla_results[j].component;
                                            //console.log("bug_component 2====>" + bug_component);
                                        }
                                        if (bugzilla_results[j].priority != undefined) {
                                            bug_priority = bugzilla_results[j].priority;
                                        }
                                        if (bugzilla_results[j].severity != undefined) {
                                            bug_severity = bugzilla_results[j].severity;
                                        }

                                        if (bugzilla_results[j].resolution != undefined) {
                                            bug_resolution = bugzilla_results[j].resolution;
                                        }

                                        if (bugzilla_results[j].cf_city_address != undefined) {
                                            bug_address = bugzilla_results[j].cf_city_address;
                                        }

                                        if (bugzilla_results[j].cf_cc_mobile != undefined) {
                                            cf_cc_mobile = bugzilla_results[j].cf_cc_mobile;
                                        }

                                        if (bugzilla_results[j].cf_cc_name != undefined) {
                                            cf_cc_name = bugzilla_results[j].cf_cc_name;
                                        }

                                        if (bugzilla_results[j].cc != undefined) {
                                            cc = bugzilla_results[j].cc;
                                        }

                                    }
                                }

                                if (req.admin_user == 1) {
                                    //isadmin                                    
                                    issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","name":"' + issue[i].user.name + '","phone":"' + issue[i].user.phone + '","email":"' + issue[i].user.email + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '","cf_cc_mobile":"' + cf_cc_mobile + '","cf_cc_name":"' + cf_cc_name + '","cc":"' + cc + '"}';
                                } else if (req.admin_user == 0) {
                                    //simpleuser
                                    issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '"}';
                                }

                                if (i < issue.length - 1) {
                                    issue_return += ',';
                                }
                            }
                            issue_return += ']';
                            callback(issue_return);
                        }).sort({ "create_at": _sort_mongo });
                    }
                }
            });
        }
    }
    else if (!req.query.hasOwnProperty("bug_id") && !req.query.hasOwnProperty("mobile") && !req.query.hasOwnProperty("email") && req.query.hasOwnProperty("city")) {


        var _startdate = new Date();
        var _enddate = new Date();
        var _coordinates;
        var _distance;
        var _issue;
        var _limit;
        var _sort;
        var _loc_var;
        var newdate = new Date();
        var _image;
        var _list_issue;
        var _product;
        var _status = [];
        var _cf_authedicated = 1;
        var _cf_authedicated_contition = "equals";
        var _kml;
        var _offset;
        var _user = false;
        var _default_issue = "";
        var _departments;
        var _summary;
        var yyyy1;
        var yyyy2;
        var mm1;
        var mm2;
        var dd1;
        var dd2;
        var _resolution;
        var _priority;
        var _severity;

        if (!req.query.hasOwnProperty("city") && !req.query.hasOwnProperty("coordinates")) {
            res.send([{ "response": "no-data", "message": "You don't send city - coordinates values!" }]);
        }
        else {
            if (!req.query.hasOwnProperty('startdate')) {
                _startdate = new Date(_startdate) - 1000 * 60 * 60 * 24 * 3;

                _startdate = new Date(_startdate);

                yyyy1 = _startdate.getFullYear();
                if (_startdate.getMonth() < 9) {
                    mm1 = "0" + (_startdate.getMonth() + 1);
                } else {
                    mm1 = _startdate.getMonth() + 1;
                }
                if (_startdate.getDate() <= 9) {
                    dd1 = "0" + _startdate.getDate();
                } else {
                    dd1 = _startdate.getDate();
                }

                _startdate = yyyy1 + "-" + mm1 + "-" + dd1 + "T00:00:00.000";

            } else {
                var partsOfStr = req.query.startdate.split('-');
                _startdate = partsOfStr[0] + "-" + partsOfStr[1] + "-" + partsOfStr[2] + "T00:00:00.000";
            }

            if (req.query.hasOwnProperty('enddate')) {
                var partsOfStr = req.query.enddate.split('-');
                _enddate = partsOfStr[0] + "-" + partsOfStr[1] + "-" + partsOfStr[2] + "T23:59:59.999";
            } else {
                yyyy2 = _enddate.getFullYear();
                if (_enddate.getMonth() < 9) {
                    mm2 = "0" + (_enddate.getMonth() + 1);
                } else {
                    mm2 = _enddate.getMonth() + 1;
                }
                if (_enddate.getDate() <= 9) {
                    dd2 = "0" + _enddate.getDate();
                } else {
                    dd2 = _enddate.getDate();
                }
                _enddate = yyyy2 + "-" + mm2 + "-" + dd2 + "T23:59:59.999";
            }

            if (!req.query.hasOwnProperty('coordinates')) {
                _coordinates = '';
            } else {
                _coordinates = req.query.coordinates;
            }

            if (!req.query.hasOwnProperty('distance')) {
                _distance = '10000';
            } else {
                _distance = req.query.distance;
            }

            if (!req.query.hasOwnProperty('includeAnonymous')) {
                _cf_authedicated = 1;
                _cf_authedicated_contition = "equals";
            }
            else {
                if (req.query.includeAnonymous == 1) {
                    _cf_authedicated = 2;
                    _cf_authedicated_contition = "lessthan";
                    _default_issue = "---";
                } else {
                    _cf_authedicated = 1;
                    _cf_authedicated_contition = "equals";
                }

            }

            if (!req.query.hasOwnProperty('issue') || req.query.issue === 'all') {
                if (_default_issue == "---") {
                    _issue = "---,garbage,plumbing,lighting,road-constructor,green,protection-policy,environment";
                    _summary = "&f6=short_desc&o6=anywordssubstr&v6=garbage, plumbing, lighting, road-constructor, green, protection-policy, environment";
                } else {
                    _issue = "garbage,plumbing,lighting,road-constructor,green,protection-policy,environment";
                    _summary = "&f6=short_desc&o6=anywordssubstr&v6=garbage, plumbing, lighting, road-constructor, green, protection-policy, environment";
                }
            } else {

                var issue_split = req.query.issue.split("|");

                switch (issue_split.length) {
                    case 1:
                        if (_default_issue == "---") {
                            _issue = "---," + issue_split[0].toString();
                            _summary = "&f6=short_desc&o6=anywordssubstr&v6=" + issue_split[0].toString();
                        } else {
                            _issue = issue_split[0].toString();
                            _summary = "&f6=short_desc&o6=anywordssubstr&v6=" + issue_split[0].toString();
                        }
                        break;
                    case 2:
                        if (_default_issue == "---") {
                            _issue = "---," + issue_split[0].toString() + "," + issue_split[1].toString();
                            _summary = "&f6=short_desc&o6=anywordssubstr&v6=" + issue_split[0].toString() + ", " + issue_split[1].toString();
                        } else {
                            _issue = issue_split[0].toString() + "," + issue_split[1].toString();
                            _summary = "&f6=short_desc&o6=anywordssubstr&v6=" + issue_split[0].toString() + ", " + issue_split[1].toString();
                        }
                        break;
                    case 3:
                        if (_default_issue == "---") {
                            _issue = "---," + issue_split[0].toString() + "," + issue_split[1].toString() + "," + issue_split[2].toString();
                            _summary = "&f6=short_desc&o6=anywordssubstr&v6=" + issue_split[0].toString() + ", " + issue_split[1].toString() + ", " + issue_split[2].toString();
                        } else {
                            _issue = issue_split[0].toString() + "," + issue_split[1].toString() + "," + issue_split[2].toString();
                            _summary = "&f6=short_desc&o6=anywordssubstr&v6=" + issue_split[0].toString() + ", " + issue_split[1].toString() + ", " + issue_split[2].toString();

                        }
                        break;
                    case 4:
                        if (_default_issue == "---") {
                            _issue = "---," + issue_split[0].toString() + "," + issue_split[1].toString() + "," + issue_split[2].toString() + "," + issue_split[3].toString();
                            _summary = "&f6=short_desc&o6=anywordssubstr&v6=" + issue_split[0].toString() + ", " + issue_split[1].toString() + ", " + issue_split[2].toString() + ", " + issue_split[3].toString();
                        } else {
                            _issue = issue_split[0].toString() + "," + issue_split[1].toString() + "," + issue_split[2].toString() + "," + issue_split[3].toString();
                            _summary = "&f6=short_desc&o6=anywordssubstr&v6=" + issue_split[0].toString() + ", " + issue_split[1].toString() + ", " + issue_split[2].toString() + ", " + issue_split[3].toString();
                        }
                        break;
                    case 5:
                        if (_default_issue == "---") {
                            _issue = "---," + issue_split[0].toString() + "," + issue_split[1].toString() + "," + issue_split[2].toString() + "," + issue_split[3].toString() + "," + issue_split[4].toString();
                            _summary = "&f6=short_desc&o6=anywordssubstr&v6=" + issue_split[0].toString() + ", " + issue_split[1].toString() + ", " + issue_split[2].toString() + ", " + issue_split[3].toString() + ", " + issue_split[4].toString();
                        } else {
                            _issue = issue_split[0].toString() + "," + issue_split[1].toString() + "," + issue_split[2].toString() + "," + issue_split[3].toString() + "," + issue_split[4].toString();
                            _summary = "&f6=short_desc&o6=anywordssubstr&v6=" + issue_split[0].toString() + ", " + issue_split[1].toString() + ", " + issue_split[2].toString() + ", " + issue_split[3].toString() + ", " + issue_split[4].toString();
                        }
                        break;
                    case 6:
                        if (_default_issue == "---") {
                            _issue = "---," + issue_split[0].toString() + "," + issue_split[1].toString() + "," + issue_split[2].toString() + "," + issue_split[3].toString() + "," + issue_split[4].toString() + "," + issue_split[5].toString();
                            _summary = "&f6=short_desc&o6=anywordssubstr&v6=" + issue_split[0].toString() + ", " + issue_split[1].toString() + ", " + issue_split[2].toString() + ", " + issue_split[3].toString() + ", " + issue_split[4].toString() + ", " + issue_split[5].toString();
                        } else {
                            _issue = issue_split[0].toString() + "," + issue_split[1].toString() + "," + issue_split[2].toString() + "," + issue_split[3].toString() + "," + issue_split[4].toString() + "," + issue_split[5].toString();
                            _summary = "&f6=short_desc&o6=anywordssubstr&v6=" + issue_split[0].toString() + ", " + issue_split[1].toString() + ", " + issue_split[2].toString() + ", " + issue_split[3].toString() + ", " + issue_split[4].toString() + ", " + issue_split[5].toString();
                        }
                        break;
                    case 7:
                        if (_default_issue == "---") {
                            _issue = "---," + issue_split[0].toString() + "," + issue_split[1].toString() + "," + issue_split[2].toString() + "," + issue_split[3].toString() + "," + issue_split[4].toString() + "," + issue_split[5].toString() + "," + issue_split[6].toString();
                            _summary = "&f6=short_desc&o6=anywordssubstr&v6=" + issue_split[0].toString() + ", " + issue_split[1].toString() + ", " + issue_split[2].toString() + ", " + issue_split[3].toString() + ", " + issue_split[4].toString() + ", " + issue_split[5].toString() + ", " + issue_split[6].toString();
                        } else {
                            _issue = issue_split[0].toString() + "," + issue_split[1].toString() + "," + issue_split[2].toString() + "," + issue_split[3].toString() + "," + issue_split[4].toString() + "," + issue_split[5].toString() + "," + issue_split[6].toString();
                            _summary = "&f6=short_desc&o6=anywordssubstr&v6=" + issue_split[0].toString() + ", " + issue_split[1].toString() + ", " + issue_split[2].toString() + ", " + issue_split[3].toString() + ", " + issue_split[4].toString() + ", " + issue_split[5].toString() + ", " + issue_split[6].toString();
                        }
                        break;
                    default:
                        if (_default_issue == "---") {
                            _issue = "---,garbage,plumbing,lighting,road-constructor,green,protection-policy,environment";
                            _summary = "&f6=short_desc&o6=anywordssubstr&v6=garbage, plumbing, lighting, road-constructor, green, protection-policy, environment";
                        } else {
                            _issue = "garbage,plumbing,lighting,road-constructor,green,protection-policy,environment";
                            _summary = "&f6=short_desc&o6=anywordssubstr&v6=garbage, plumbing, lighting, road-constructor, green, protection-policy, environment";
                        }
                        break;
                }
            }

            if (!req.query.hasOwnProperty('departments')) {
                _departments = "";
            } else {
                var department_split = req.query.departments.split("|");

                var i_dep = 0;

                _departments = "";
                for (i_dep = 0; i_dep < department_split.length; i_dep++) {
                    _departments += "&component=" + encodeURIComponent(department_split[i_dep]);
                }

            }

            if (!req.query.hasOwnProperty('limit')) {
                _limit = 1000;
            } else {
                _limit = req.query.limit;
            }

            if (!req.query.hasOwnProperty('sort')) {
                _sort = "&order=bug_id%20DESC";
                _sort_mongo = -1;
            } else {
                if (req.query.sort == 1) {
                    _sort = "&order=bug_id%20ASC";
                    _sort_mongo = 1;
                } else if (req.query.sort == -1) {
                    _sort = "&order=bug_id%20DESC";
                    _sort_mongo = -1;
                }

            }

            if (!req.query.hasOwnProperty('image_field')) {
                _image = 0;
            } else {
                if (req.query.image_field == 0) {
                    _image = 0;
                } else {
                    _image = 1;
                }
            }

            if (!req.query.hasOwnProperty('list_issue')) {
                _list_issue = false;
            } else {
                if (req.query.image_field == 0) {
                    _list_issue = false;
                } else {
                    _list_issue = true;
                }
            }



            if (!req.query.hasOwnProperty('status')) {

                _status = "&f7=bug_status&o7=anywordssubstr&v7=CONFIRMED, IN_PROGRESS";
            } else {
                var status_split = req.query.status.split("|");

                switch (status_split.length) {
                    case 1:
                        _status = "&f7=bug_status&o7=anywordssubstr&v7=" + status_split[0];
                        break;
                    case 2:
                        _status = "&f7=bug_status&o7=anywordssubstr&v7=" + status_split[0] + ", " + status_split[1];
                        break;
                    case 3:
                        _status = "&f7=bug_status&o7=anywordssubstr&v7=" + status_split[0] + ", " + status_split[1] + ", " + status_split[2];
                        break;
                    default:
                        _status = "&f7=bug_status&o7=anywordssubstr&v7=CONFIRMED, IN_PROGRESS";
                        break;
                }
            }

            var null_resolution = '';

            if (_status.indexOf("IN_PROGRESS") > -1 || _status.indexOf("CONFIRMED") > -1) {
                null_resolution = ",---";
            }

            if (!req.query.hasOwnProperty('resolution')) {
                _resolution = "&f8=resolution&o8=anyexact&v8=FIXED,INVALID,WONTFIX,DUPLICATE" + null_resolution;
            } else {
                var resolution_split = req.query.resolution.split("|");

                switch (resolution_split.length) {
                    case 1:
                        _resolution = "&f8=resolution&o8=anyexact&v8=" + resolution_split[0] + null_resolution;
                        break;
                    case 2:
                        _resolution = "&f8=resolution&o8=anyexact&v8=" + resolution_split[0] + ", " + resolution_split[1] + null_resolution;
                        break;
                    case 3:
                        _resolution = "&f8=resolution&o8=anyexact&v8=" + resolution_split[0] + ", " + resolution_split[1] + ", " + resolution_split[2] + null_resolution;
                        break;
                    default:
                        _resolution = "&f8=resolution&o8=anyexact&v8=FIXED,INVALID,WONTFIX,DUPLICATE" + null_resolution;
                        break;
                }
            }

            /* --------- Priority ---------- */

            if (!req.query.hasOwnProperty('priority')) {
                _priority = "";
            } else {
                var priority_split = req.query.priority.split("|");

                switch (priority_split.length) {
                    case 1:
                        _priority = "&f9=priority&o9=anyexact&v9=" + priority_split[0];
                        break;
                    case 2:
                        _priority = "&f9=priority&o9=anyexact&v9=" + priority_split[0] + ", " + priority_split[1];
                        break;
                    case 3:
                        _priority = "&f9=priority&o9=anyexact&v9=" + priority_split[0] + ", " + priority_split[1] + ", " + priority_split[2];
                        break;
                    case 4:
                        _priority = "&f8=priority&o9=anyexact&v9=" + priority_split[0] + ", " + priority_split[1] + ", " + priority_split[2] + ", " + priority_split[3];
                        break;
                    case 5:
                        _priority = "&f9=priority&o9=anyexact&v9=" + priority_split[0] + ", " + priority_split[1] + ", " + priority_split[2] + ", " + priority_split[3] + ", " + priority_split[4];
                        break;
                    default:
                        _priority = "";
                        break;
                }
            }

            /* --------- END Priority ---------- */

            /* --------- Severity ---------- */

            if (!req.query.hasOwnProperty('severity')) {
                _severity = "";
            } else {
                var severity_split = req.query.severity.split("|");

                switch (severity_split.length) {
                    case 1:
                        _severity = "&f10=bug_severity&o10=anyexact&v10=" + severity_split[0];
                        break;
                    case 2:
                        _severity = "&f10=bug_severity&o10=anyexact&v10=" + severity_split[0] + ", " + severity_split[1];
                        break;
                    case 3:
                        _severity = "&f10=bug_severity&o10=anyexact&v10=" + severity_split[0] + ", " + severity_split[1] + ", " + severity_split[2];
                        break;
                    case 4:
                        _severity = "&f10=bug_severity&o10=anyexact&v10=" + severity_split[0] + ", " + severity_split[1] + ", " + severity_split[2] + ", " + severity_split[3];
                        break;
                    case 5:
                        _severity = "&f10=bug_severity&o10=anyexact&v10=" + severity_split[0] + ", " + severity_split[1] + ", " + severity_split[2] + ", " + severity_split[3] + ", " + severity_split[4];
                        break;
                    case 6:
                        _severity = "&f10=bug_severity&o10=anyexact&v10=" + severity_split[0] + ", " + severity_split[1] + ", " + severity_split[2] + ", " + severity_split[3] + ", " + severity_split[4] + ", " + severity_split[5];
                        break;
                    case 7:
                        _severity = "&f10=bug_severity&o10=anyexact&v10=" + severity_split[0] + ", " + severity_split[1] + ", " + severity_split[2] + ", " + severity_split[3] + ", " + severity_split[4] + ", " + severity_split[5] + ", " + severity_split[6];
                        break;
                    default:
                        _severity = "";
                        break;
                }
            }

            /* --------- END Severity ---------- */


            if (!req.query.hasOwnProperty('kml')) {
                _kml = 0;
            } else {
                _kml = req.query.kml;
            }

            if (!req.query.hasOwnProperty('offset')) {
                _offset = "";
            } else {
                _offset = "&offset=" + req.query.offset;
            }

            _user = false;

            if (!req.query.hasOwnProperty('city') && _coordinates != '') {

                var _cordinates_ar = JSON.parse(req.query.coordinates);

                Municipality.find({ boundaries: { $geoIntersects: { $geometry: { "type": "Point", "coordinates": [_cordinates_ar[0], _cordinates_ar[1]] } } } }, { "municipality": 1, "municipality_desc": 1 }, function (err, response) {
                    console.log("issue.get -> Municipality.find()");
                    if (response.length > 0) {

                        _product = response[0]["municipality"];

                        if (req.admin_user == 1) {
                            //isadmin                                    
                            var bugParams1 = "?product=" + _product + "&query_format=advanced&limit=" + _limit + _status + "&v2=" + _enddate + "&f2=creation_ts&o2=lessthaneq&v3=" + _startdate + "&f3=creation_ts&o3=greaterthaneq&v5=" + _cf_authedicated + _offset + "&f5=cf_authedicated&o5=" + _cf_authedicated_contition + _departments + _sort + _summary + _resolution + _severity + _priority + "&include_fields=id,alias,status,cf_authedicated,resolution,cf_city_address,cf_cc_mobile,cf_cc_name,cc" + _bug_extra;
                        } else if (req.admin_user == 0) {
                            //simpleuser
                            var bugParams1 = "?product=" + _product + "&query_format=advanced&limit=" + _limit + _status + "&v2=" + _enddate + "&f2=creation_ts&o2=lessthaneq&v3=" + _startdate + "&f3=creation_ts&o3=greaterthaneq&v5=" + _cf_authedicated + _offset + "&f5=cf_authedicated&o5=" + _cf_authedicated_contition + _departments + _sort + _summary + _resolution + _severity + _priority + "&include_fields=id,alias,status,cf_authedicated,resolution,cf_city_address" + _bug_extra;
                        }



                        var ids = [];
                        var bugzilla_results = [];
                        var issue_return = [];

                        request({
                            url: bugUrlRest + "/rest/bug" + bugParams1,
                            method: "GET"
                        }, function (error, response, body) {

                            var bugs_body = JSON.parse(body).bugs;
                            
                            console.log("issue.get -> /rest/bug");
                            if (error != undefined) { console.log(JSON.stringify(error)); }

                            var i_count = 0;
                            var bugs_length = 0;

                            if (bugs_body != undefined) {
                                bugs_length = bugs_body.length;
                            }
                            for (i_count = 0; i_count < bugs_length; i_count++) {
                                ids.push(bugs_body[i_count].alias[0]);
                                
                            }
                            bugzilla_results = bugs_body;
                            if (_image == 0) {
                                if (_user_extra == 0) {

                                    Issue.find({ "_id": { $in: ids } }, { "user": 0, "image_name": _image }, function (err, issue) {

                                        //new start
                                        if (err != null) { console.log("err   =   " + err); }
                                        if (_kml == 0) {
                                            issue_return += '[';
                                        } else if (_kml == 1) {
                                            issue_return += '<?xml version="1.0" encoding="UTF-8"?> <kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom"> <Document>' +
                                                '<name>sensecity.kml</name>' +
                                                '<Style id="s_ylw-pushpin_hl">' +
                                                '<IconStyle>' +
                                                '<color>ff7fffff</color>' +
                                                '<scale>1.3</scale>' +
                                                '<Icon>' +
                                                '<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>' +
                                                '</Icon>' +
                                                '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
                                                '</IconStyle>' +
                                                '</Style>' +
                                                '<StyleMap id="m_ylw-pushpin">' +
                                                '<Pair>' +
                                                '<key>normal</key>' +
                                                '<styleUrl>#s_ylw-pushpin</styleUrl>' +
                                                '</Pair>' +
                                                '<Pair>' +
                                                '<key>highlight</key>' +
                                                '<styleUrl>#s_ylw-pushpin_hl</styleUrl>' +
                                                '</Pair>' +
                                                '</StyleMap>' +
                                                '<Style id="s_ylw-pushpin">' +
                                                '<IconStyle>' +
                                                '<color>ff7fffff</color>' +
                                                '<scale>1.1</scale>' +
                                                '<Icon>' +
                                                '<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>' +
                                                '</Icon>' +
                                                '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
                                                '</IconStyle>' +
                                                '</Style>' +
                                                '<Folder>' +
                                                '<name>sensecity</name>' +
                                                '<open>1</open>';
                                        }

                                        for (var i = 0; i < issue.length; i++) {

                                            var bug_id = 0;
                                            var bug_status = "";
                                            var bug_authenticate = "0";
                                            var bug_component;
                                            var bug_priority;
                                            var bug_severity;
                                            var bug_resolution;
                                            var bug_address;
                                            var cf_cc_mobile;
                                            var cf_cc_name;
                                            var cc;

                                            for (var j = 0; j < bugzilla_results.length; j++) {
                                                if (bugzilla_results[j].alias[0] == issue[i]._id) {
                                                    bug_id = bugzilla_results[j].id;
                                                    bug_status = bugzilla_results[j].status;
                                                    bug_authenticate = bugzilla_results[j].cf_authedicated;

                                                    if (bugzilla_results[j].component != undefined) {
                                                        bug_component = bugzilla_results[j].component;
                                                    }
                                                    if (bugzilla_results[j].priority != undefined) {
                                                        bug_priority = bugzilla_results[j].priority;
                                                    }
                                                    if (bugzilla_results[j].severity != undefined) {
                                                        bug_severity = bugzilla_results[j].severity;
                                                    }

                                                    if (bugzilla_results[j].resolution != undefined) {
                                                        bug_resolution = bugzilla_results[j].resolution;
                                                    }

                                                    if (bugzilla_results[j].cf_city_address != undefined) {
                                                        bug_address = bugzilla_results[j].cf_city_address;
                                                    }

                                                    if (bugzilla_results[j].cf_cc_mobile != undefined) {
                                                        cf_cc_mobile = bugzilla_results[j].cf_cc_mobile;
                                                    }

                                                    if (bugzilla_results[j].cf_cc_name != undefined) {
                                                        cf_cc_name = bugzilla_results[j].cf_cc_name;
                                                    }

                                                    if (bugzilla_results[j].cc != undefined) {
                                                        cc = bugzilla_results[j].cc;
                                                    }
                                                }
                                            }

                                            if (_kml == 0) {
                                                if (req.admin_user == 1) {
                                                    //isadmin                                    
                                                    issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '","cf_cc_mobile":"' + cf_cc_mobile + '","cf_cc_name":"' + cf_cc_name + '","cc":"' + cc + '"}';
                                                } else if (req.admin_user == 0) {
                                                    //simpleuser
                                                    issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '"}';
                                                }


                                                if (i < issue.length - 1) {
                                                    issue_return += ',';
                                                }
                                            } else if (_kml == 1) {
                                                issue_return += '<Placemark>' +
                                                    '<name>' + issue[i].issue + ' - ' + issue[i].value_desc + '</name>' +
                                                    '<description><![CDATA[<img src="' + issue[i].image_name + '"/><a href="https://' + issue[i].municipality + '.sense.city/issue/' + issue[i]._id + '">https://' + issue[i].municipality + '.sense.city/issue/' + issue[i]._id + '</a>]]></description>' +
                                                    '<LookAt>' +
                                                    '<longitude>' + issue[i].loc.coordinates[0] + '</longitude>' +
                                                    '<latitude>' + issue[i].loc.coordinates[1] + '</latitude>' +
                                                    '<altitude>0</altitude>' +
                                                    '<heading>-176.4101948194351</heading>' +
                                                    '<tilt>70.72955317497231</tilt>' +
                                                    '<range>1952.786634342951</range>' +
                                                    '<gx:altitudeMode>relativeToSeaFloor</gx:altitudeMode>' +
                                                    '</LookAt>' +
                                                    '<styleUrl>#m_ylw-pushpin</styleUrl>' +
                                                    '<Point>' +
                                                    '<gx:drawOrder>1</gx:drawOrder>' +
                                                    '<coordinates>' + issue[i].loc.coordinates[0] + ',' + issue[i].loc.coordinates[1] + ',0</coordinates>' +
                                                    '</Point>' +
                                                    '</Placemark>';
                                            }
                                        }

                                        if (_kml == 0) {
                                            issue_return += ']';

                                            callback(issue_return);

                                        } else if (_kml == 1) {
                                            issue_return += '</Folder> </Document> </kml>';

                                            callback(issue_return);

                                        }

                                        //new end


                                        //res.send(issue);
                                    }).sort({ "create_at": _sort_mongo });//.limit(_limit);

                                } else {

                                    Issue.find({ "_id": { $in: ids } }, { "image_name": _image }, function (err, issue) {

                                        //new start
                                        if (err != null) { console.log("err   =   " + err); }
                                        if (_kml == 0) {
                                            issue_return += '[';
                                        } else if (_kml == 1) {
                                            issue_return += '<?xml version="1.0" encoding="UTF-8"?> <kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom"> <Document>' +
                                                '<name>sensecity.kml</name>' +
                                                '<Style id="s_ylw-pushpin_hl">' +
                                                '<IconStyle>' +
                                                '<color>ff7fffff</color>' +
                                                '<scale>1.3</scale>' +
                                                '<Icon>' +
                                                '<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>' +
                                                '</Icon>' +
                                                '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
                                                '</IconStyle>' +
                                                '</Style>' +
                                                '<StyleMap id="m_ylw-pushpin">' +
                                                '<Pair>' +
                                                '<key>normal</key>' +
                                                '<styleUrl>#s_ylw-pushpin</styleUrl>' +
                                                '</Pair>' +
                                                '<Pair>' +
                                                '<key>highlight</key>' +
                                                '<styleUrl>#s_ylw-pushpin_hl</styleUrl>' +
                                                '</Pair>' +
                                                '</StyleMap>' +
                                                '<Style id="s_ylw-pushpin">' +
                                                '<IconStyle>' +
                                                '<color>ff7fffff</color>' +
                                                '<scale>1.1</scale>' +
                                                '<Icon>' +
                                                '<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>' +
                                                '</Icon>' +
                                                '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
                                                '</IconStyle>' +
                                                '</Style>' +
                                                '<Folder>' +
                                                '<name>sensecity</name>' +
                                                '<open>1</open>';
                                        }

                                        for (var i = 0; i < issue.length; i++) {

                                            var bug_id = 0;
                                            var bug_status = "";
                                            var bug_authenticate = "0";
                                            var bug_component;
                                            var bug_priority;
                                            var bug_severity;
                                            var bug_resolution;
                                            var bug_address;
                                            var cf_cc_mobile;
                                            var cf_cc_name;
                                            var cc;

                                            for (var j = 0; j < bugzilla_results.length; j++) {
                                                if (bugzilla_results[j].alias[0] == issue[i]._id) {
                                                    bug_id = bugzilla_results[j].id;
                                                    bug_status = bugzilla_results[j].status;
                                                    bug_authenticate = bugzilla_results[j].cf_authedicated;

                                                    if (bugzilla_results[j].component != undefined) {
                                                        bug_component = bugzilla_results[j].component;
                                                    }
                                                    if (bugzilla_results[j].priority != undefined) {
                                                        bug_priority = bugzilla_results[j].priority;
                                                    }
                                                    if (bugzilla_results[j].severity != undefined) {
                                                        bug_severity = bugzilla_results[j].severity;
                                                    }

                                                    if (bugzilla_results[j].resolution != undefined) {
                                                        bug_resolution = bugzilla_results[j].resolution;
                                                    }

                                                    if (bugzilla_results[j].cf_city_address != undefined) {
                                                        bug_address = bugzilla_results[j].cf_city_address;
                                                    }

                                                    if (bugzilla_results[j].cf_cc_mobile != undefined) {
                                                        cf_cc_mobile = bugzilla_results[j].cf_cc_mobile;
                                                    }

                                                    if (bugzilla_results[j].cf_cc_name != undefined) {
                                                        cf_cc_name = bugzilla_results[j].cf_cc_name;
                                                    }

                                                    if (bugzilla_results[j].cc != undefined) {
                                                        cc = bugzilla_results[j].cc;
                                                    }

                                                }
                                            }

                                            if (_kml == 0) {
                                                if (req.admin_user == 1) {
                                                    //isadmin                                    
                                                    issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","name":"' + issue[i].user.name + '","phone":"' + issue[i].user.phone + '","email":"' + issue[i].user.email + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '","cf_cc_mobile":"' + cf_cc_mobile + '","cf_cc_name":"' + cf_cc_name + '","cc":"' + cc + '"}';
                                                } else if (req.admin_user == 0) {
                                                    //simpleuser
                                                    issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '"}';
                                                }


                                                if (i < issue.length - 1) {
                                                    issue_return += ',';
                                                }
                                            } else if (_kml == 1) {
                                                issue_return += '<Placemark>' +
                                                    '<name>' + issue[i].issue + ' - ' + issue[i].value_desc + '</name>' +
                                                    '<description><![CDATA[<img src="' + issue[i].image_name + '"/><a href="https://' + issue[i].municipality + '.sense.city/issue/' + issue[i]._id + '">https://' + issue[i].municipality + '.sense.city/issue/' + issue[i]._id + '</a>]]></description>' +
                                                    '<LookAt>' +
                                                    '<longitude>' + issue[i].loc.coordinates[0] + '</longitude>' +
                                                    '<latitude>' + issue[i].loc.coordinates[1] + '</latitude>' +
                                                    '<altitude>0</altitude>' +
                                                    '<heading>-176.4101948194351</heading>' +
                                                    '<tilt>70.72955317497231</tilt>' +
                                                    '<range>1952.786634342951</range>' +
                                                    '<gx:altitudeMode>relativeToSeaFloor</gx:altitudeMode>' +
                                                    '</LookAt>' +
                                                    '<styleUrl>#m_ylw-pushpin</styleUrl>' +
                                                    '<Point>' +
                                                    '<gx:drawOrder>1</gx:drawOrder>' +
                                                    '<coordinates>' + issue[i].loc.coordinates[0] + ',' + issue[i].loc.coordinates[1] + ',0</coordinates>' +
                                                    '</Point>' +
                                                    '</Placemark>';
                                            }
                                        }

                                        if (_kml == 0) {
                                            issue_return += ']';

                                            callback(issue_return);

                                        } else if (_kml == 1) {
                                            issue_return += '</Folder> </Document> </kml>';

                                            callback(issue_return);

                                        }

                                        //new end


                                        //res.send(issue);
                                    }).sort({ "create_at": _sort_mongo });//.limit(_limit);
                                }

                            } else {
                                console.log("--6--");
                                if (_user_extra == 0) {

                                    Issue.find({ "_id": { $in: ids } }, { "user": 0 }, function (err, issue) {

                                        //new start
                                        if (err != null) { console.log("err1   =   " + err); }
                                        if (_kml == 0) {
                                            issue_return += '[';
                                        } else if (_kml == 1) {
                                            issue_return += '<?xml version="1.0" encoding="UTF-8"?> <kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom"> <Document>' +
                                                '<name>sensecity.kml</name>' +
                                                '<Style id="s_ylw-pushpin_hl">' +
                                                '<IconStyle>' +
                                                '<color>ff7fffff</color>' +
                                                '<scale>1.3</scale>' +
                                                '<Icon>' +
                                                '<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>' +
                                                '</Icon>' +
                                                '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
                                                '</IconStyle>' +
                                                '</Style>' +
                                                '<StyleMap id="m_ylw-pushpin">' +
                                                '<Pair>' +
                                                '<key>normal</key>' +
                                                '<styleUrl>#s_ylw-pushpin</styleUrl>' +
                                                '</Pair>' +
                                                '<Pair>' +
                                                '<key>highlight</key>' +
                                                '<styleUrl>#s_ylw-pushpin_hl</styleUrl>' +
                                                '</Pair>' +
                                                '</StyleMap>' +
                                                '<Style id="s_ylw-pushpin">' +
                                                '<IconStyle>' +
                                                '<color>ff7fffff</color>' +
                                                '<scale>1.1</scale>' +
                                                '<Icon>' +
                                                '<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>' +
                                                '</Icon>' +
                                                '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
                                                '</IconStyle>' +
                                                '</Style>' +
                                                '<Folder>' +
                                                '<name>sensecity</name>' +
                                                '<open>1</open>';
                                        }

                                        for (var i = 0; i < issue.length; i++) {

                                            var bug_id = 0;
                                            var bug_status = "";
                                            var bug_authenticate = "0";
                                            var bug_component;
                                            var bug_priority;
                                            var bug_severity;
                                            var bug_resolution;
                                            var bug_address;
                                            var cf_cc_mobile;
                                            var cf_cc_name;
                                            var cc;

                                            for (var j = 0; j < bugzilla_results.length; j++) {
                                                if (bugzilla_results[j].alias[0] == issue[i]._id) {
                                                    bug_id = bugzilla_results[j].id;
                                                    bug_status = bugzilla_results[j].status;
                                                    bug_authenticate = bugzilla_results[j].cf_authedicated;

                                                    if (bugzilla_results[j].component != undefined) {
                                                        bug_component = bugzilla_results[j].component;
                                                    }
                                                    if (bugzilla_results[j].priority != undefined) {
                                                        bug_priority = bugzilla_results[j].priority;
                                                    }
                                                    if (bugzilla_results[j].severity != undefined) {
                                                        bug_severity = bugzilla_results[j].severity;
                                                    }

                                                    if (bugzilla_results[j].resolution != undefined) {
                                                        bug_resolution = bugzilla_results[j].resolution;
                                                    }

                                                    if (bugzilla_results[j].cf_city_address != undefined) {
                                                        bug_address = bugzilla_results[j].cf_city_address;
                                                    }

                                                    if (bugzilla_results[j].cf_cc_mobile != undefined) {
                                                        cf_cc_mobile = bugzilla_results[j].cf_cc_mobile;
                                                    }

                                                    if (bugzilla_results[j].cf_cc_name != undefined) {
                                                        cf_cc_name = bugzilla_results[j].cf_cc_name;
                                                    }

                                                    if (bugzilla_results[j].cc != undefined) {
                                                        cc = bugzilla_results[j].cc;
                                                    }

                                                }
                                            }

                                            if (_kml == 0) {
                                                if (req.admin_user == 1) {
                                                    //isadmin                                                                                        
                                                    issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '","cf_cc_mobile":"' + cf_cc_mobile + '","cf_cc_name":"' + cf_cc_name + '","cc":"' + cc + '"}';
                                                } else if (req.admin_user == 0) {
                                                    //simpleuser
                                                    issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '"}';
                                                }


                                                if (i < issue.length - 1) {
                                                    issue_return += ',';
                                                }
                                            } else if (_kml == 1) {
                                                issue_return += '<Placemark>' +
                                                    '<name>' + issue[i].issue + ' - ' + issue[i].value_desc + '</name>' +
                                                    '<description><![CDATA[<img src="' + issue[i].image_name + '"/><a href="https://' + issue[i].municipality + '.sense.city/issue/' + issue[i]._id + '">https://' + issue[i].municipality + '.sense.city/issue/' + issue[i]._id + '</a>]]></description>' +
                                                    '<LookAt>' +
                                                    '<longitude>' + issue[i].loc.coordinates[0] + '</longitude>' +
                                                    '<latitude>' + issue[i].loc.coordinates[1] + '</latitude>' +
                                                    '<altitude>0</altitude>' +
                                                    '<heading>-176.4101948194351</heading>' +
                                                    '<tilt>70.72955317497231</tilt>' +
                                                    '<range>1952.786634342951</range>' +
                                                    '<gx:altitudeMode>relativeToSeaFloor</gx:altitudeMode>' +
                                                    '</LookAt>' +
                                                    '<styleUrl>#m_ylw-pushpin</styleUrl>' +
                                                    '<Point>' +
                                                    '<gx:drawOrder>1</gx:drawOrder>' +
                                                    '<coordinates>' + issue[i].loc.coordinates[0] + ',' + issue[i].loc.coordinates[1] + ',0</coordinates>' +
                                                    '</Point>' +
                                                    '</Placemark>';
                                            }
                                        }

                                        if (_kml == 0) {
                                            issue_return += ']';

                                            callback(issue_return);
                                        } else if (_kml == 1) {
                                            issue_return += '</Folder> </Document> </kml>';

                                            callback(issue_return);
                                        }
                                    }).sort({ "create_at": _sort_mongo });//.limit(_limit);
                                } else {

                                    Issue.find({ "_id": { $in: ids } }, function (err, issue) {

                                        //new start
                                        if (err != null) { console.log("err1   =   " + err); }
                                        if (_kml == 0) {
                                            issue_return += '[';
                                        } else if (_kml == 1) {
                                            issue_return += '<?xml version="1.0" encoding="UTF-8"?> <kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom"> <Document>' +
                                                '<name>sensecity.kml</name>' +
                                                '<Style id="s_ylw-pushpin_hl">' +
                                                '<IconStyle>' +
                                                '<color>ff7fffff</color>' +
                                                '<scale>1.3</scale>' +
                                                '<Icon>' +
                                                '<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>' +
                                                '</Icon>' +
                                                '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
                                                '</IconStyle>' +
                                                '</Style>' +
                                                '<StyleMap id="m_ylw-pushpin">' +
                                                '<Pair>' +
                                                '<key>normal</key>' +
                                                '<styleUrl>#s_ylw-pushpin</styleUrl>' +
                                                '</Pair>' +
                                                '<Pair>' +
                                                '<key>highlight</key>' +
                                                '<styleUrl>#s_ylw-pushpin_hl</styleUrl>' +
                                                '</Pair>' +
                                                '</StyleMap>' +
                                                '<Style id="s_ylw-pushpin">' +
                                                '<IconStyle>' +
                                                '<color>ff7fffff</color>' +
                                                '<scale>1.1</scale>' +
                                                '<Icon>' +
                                                '<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>' +
                                                '</Icon>' +
                                                '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
                                                '</IconStyle>' +
                                                '</Style>' +
                                                '<Folder>' +
                                                '<name>sensecity</name>' +
                                                '<open>1</open>';
                                        }

                                        for (var i = 0; i < issue.length; i++) {

                                            var bug_id = 0;
                                            var bug_status = "";
                                            var bug_authenticate = "0";
                                            var bug_component;
                                            var bug_priority;
                                            var bug_severity;
                                            var bug_resolution;
                                            var bug_address;
                                            var cf_cc_mobile;
                                            var cf_cc_name;
                                            var cc;

                                            for (var j = 0; j < bugzilla_results.length; j++) {
                                                if (bugzilla_results[j].alias[0] == issue[i]._id) {
                                                    bug_id = bugzilla_results[j].id;
                                                    bug_status = bugzilla_results[j].status;
                                                    bug_authenticate = bugzilla_results[j].cf_authedicated;

                                                    if (bugzilla_results[j].component != undefined) {
                                                        bug_component = bugzilla_results[j].component;
                                                    }
                                                    if (bugzilla_results[j].priority != undefined) {
                                                        bug_priority = bugzilla_results[j].priority;
                                                    }
                                                    if (bugzilla_results[j].severity != undefined) {
                                                        bug_severity = bugzilla_results[j].severity;
                                                    }

                                                    if (bugzilla_results[j].resolution != undefined) {
                                                        bug_resolution = bugzilla_results[j].resolution;
                                                    }

                                                    if (bugzilla_results[j].cf_city_address != undefined) {
                                                        bug_address = bugzilla_results[j].cf_city_address;
                                                    }

                                                    if (bugzilla_results[j].cf_cc_mobile != undefined) {
                                                        cf_cc_mobile = bugzilla_results[j].cf_cc_mobile;
                                                    }

                                                    if (bugzilla_results[j].cf_cc_name != undefined) {
                                                        cf_cc_name = bugzilla_results[j].cf_cc_name;
                                                    }

                                                    if (bugzilla_results[j].cc != undefined) {
                                                        cc = bugzilla_results[j].cc;
                                                    }

                                                }
                                            }

                                            if (_kml == 0) {
                                                if (req.admin_user == 1) {
                                                    //isadmin                                                                                                                                            
                                                    issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","name":"' + issue[i].user.name + '","phone":"' + issue[i].user.phone + '","email":"' + issue[i].user.email + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '","cf_cc_mobile":"' + cf_cc_mobile + '","cf_cc_name":"' + cf_cc_name + '","cc":"' + cc + '"}';
                                                } else if (req.admin_user == 0) {
                                                    //simpleuser
                                                    issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '"}';
                                                }


                                                if (i < issue.length - 1) {
                                                    issue_return += ',';
                                                }
                                            } else if (_kml == 1) {
                                                issue_return += '<Placemark>' +
                                                    '<name>' + issue[i].issue + ' - ' + issue[i].value_desc + '</name>' +
                                                    '<description><![CDATA[<img src="' + issue[i].image_name + '"/><a href="https://' + issue[i].municipality + '.sense.city/issue/' + issue[i]._id + '">https://' + issue[i].municipality + '.sense.city/issue/' + issue[i]._id + '</a>]]></description>' +
                                                    '<LookAt>' +
                                                    '<longitude>' + issue[i].loc.coordinates[0] + '</longitude>' +
                                                    '<latitude>' + issue[i].loc.coordinates[1] + '</latitude>' +
                                                    '<altitude>0</altitude>' +
                                                    '<heading>-176.4101948194351</heading>' +
                                                    '<tilt>70.72955317497231</tilt>' +
                                                    '<range>1952.786634342951</range>' +
                                                    '<gx:altitudeMode>relativeToSeaFloor</gx:altitudeMode>' +
                                                    '</LookAt>' +
                                                    '<styleUrl>#m_ylw-pushpin</styleUrl>' +
                                                    '<Point>' +
                                                    '<gx:drawOrder>1</gx:drawOrder>' +
                                                    '<coordinates>' + issue[i].loc.coordinates[0] + ',' + issue[i].loc.coordinates[1] + ',0</coordinates>' +
                                                    '</Point>' +
                                                    '</Placemark>';
                                            }
                                        }

                                        if (_kml == 0) {
                                            issue_return += ']';

                                            callback(issue_return);
                                        } else if (_kml == 1) {
                                            issue_return += '</Folder> </Document> </kml>';

                                            callback(issue_return);
                                        }
                                    }).sort({ "create_at": _sort_mongo });//.limit(_limit);
                                }
                            }

                        });
                    } else {
                        _product = '';
                        callback([]);
                    }
                });
                //end else if there is coordinates
            } else {

                _product = req.query.city;

                //var bugParams1 = "?product=" + _product + "&j_top=OR&query_format=advanced&limit=" + _limit + _status + "&v2=" + _enddate + "&f2=creation_ts&o2=lessthan&v3=" + _startdate + "&f3=creation_ts&o3=greaterthan&v4=" + _issue + "&f4=cf_issues&o4=anywordssubstr&v5=" + _cf_authedicated + _offset + "&f5=cf_authedicated&o5=" + _cf_authedicated_contition + _departments + _sort + _summary + "&include_fields=id,alias,status,cf_authedicated";

                if (req.admin_user == 1) {
                    //isadmin                                                                                                                                                                
                    var bugParams1 = "?product=" + _product + "&query_format=advanced&limit=" + _limit + _status + "&v2=" + _enddate + "&f2=creation_ts&o2=lessthaneq&v3=" + _startdate + "&f3=creation_ts&o3=greaterthaneq&v5=" + _cf_authedicated + _offset + "&f5=cf_authedicated&o5=" + _cf_authedicated_contition + _departments + _sort + _summary + _resolution + _severity + _priority + "&include_fields=id,alias,status,cf_authedicated,resolution,cf_city_address,cf_cc_mobile,cf_cc_name,cc" + _bug_extra;
                } else if (req.admin_user == 0) {
                    //simpleuser
                    var bugParams1 = "?product=" + _product + "&query_format=advanced&limit=" + _limit + _status + "&v2=" + _enddate + "&f2=creation_ts&o2=lessthaneq&v3=" + _startdate + "&f3=creation_ts&o3=greaterthaneq&v5=" + _cf_authedicated + _offset + "&f5=cf_authedicated&o5=" + _cf_authedicated_contition + _departments + _sort + _summary + _resolution + _severity + _priority + "&include_fields=id,alias,status,cf_authedicated,resolution,cf_city_address" + _bug_extra;
                }

                var ids = [];
                var bugzilla_results = [];
                var issue_return = [];
                request({
                    url: bugUrlRest + "/rest/bug" + bugParams1,
                    method: "GET"
                }, function (error, response, body) {
                    var bugs_body = JSON.parse(body).bugs;
                    
                    console.log("issue.get -> /rest/bug");
                    var i_count = 0;
                    var bugs_length = 0;

                    if (bugs_body != undefined) {
                        bugs_length = bugs_body.length;
                    }
                    for (i_count = 0; i_count < bugs_length; i_count++) {
                        ids.push(bugs_body[i_count].alias[0]);
                        
                    }
                    bugzilla_results = bugs_body;

                    if (_image == 0) {
                        // This query works only if is valid object ids
                        // if not we have error like {CastError: Cast to ObjectId failed for value "12345g43" at path "_id"}.
                        if (_user_extra == 0) {

                            Issue.find({ "_id": { $in: ids } }, { "user": 0, "image_name": _image }, function (err, issue) {

                                //new start
                                if (err != null) { console.log("err2   =   " + err); }
                                if (_kml == 0) {
                                    issue_return += '[';
                                } else if (_kml == 1) {
                                    issue_return += '<?xml version="1.0" encoding="UTF-8"?> <kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom"> <Document>' +
                                        '<name>sensecity.kml</name>' +
                                        '<Style id="s_ylw-pushpin_hl">' +
                                        '<IconStyle>' +
                                        '<color>ff7fffff</color>' +
                                        '<scale>1.3</scale>' +
                                        '<Icon>' +
                                        '<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>' +
                                        '</Icon>' +
                                        '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
                                        '</IconStyle>' +
                                        '</Style>' +
                                        '<StyleMap id="m_ylw-pushpin">' +
                                        '<Pair>' +
                                        '<key>normal</key>' +
                                        '<styleUrl>#s_ylw-pushpin</styleUrl>' +
                                        '</Pair>' +
                                        '<Pair>' +
                                        '<key>highlight</key>' +
                                        '<styleUrl>#s_ylw-pushpin_hl</styleUrl>' +
                                        '</Pair>' +
                                        '</StyleMap>' +
                                        '<Style id="s_ylw-pushpin">' +
                                        '<IconStyle>' +
                                        '<color>ff7fffff</color>' +
                                        '<scale>1.1</scale>' +
                                        '<Icon>' +
                                        '<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>' +
                                        '</Icon>' +
                                        '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
                                        '</IconStyle>' +
                                        '</Style>' +
                                        '<Folder>' +
                                        '<name>sensecity</name>' +
                                        '<open>1</open>';
                                }


                                if (issue != undefined) {
                                    for (var i = 0; i < issue.length; i++) {

                                        var bug_id = 0;
                                        var bug_status = "";
                                        var bug_authenticate = "0";
                                        var bug_component;
                                        var bug_priority;
                                        var bug_severity;
                                        var bug_resolution;
                                        var bug_address;
                                        var cf_cc_mobile;
                                        var cf_cc_name;
                                        var cc;

                                        for (var j = 0; j < bugzilla_results.length; j++) {
                                            if (bugzilla_results[j].alias[0] == issue[i]._id) {
                                                bug_id = bugzilla_results[j].id;
                                                bug_status = bugzilla_results[j].status;
                                                bug_authenticate = bugzilla_results[j].cf_authedicated;

                                                if (bugzilla_results[j].component != undefined) {
                                                    bug_component = bugzilla_results[j].component;
                                                }
                                                if (bugzilla_results[j].priority != undefined) {
                                                    bug_priority = bugzilla_results[j].priority;
                                                }
                                                if (bugzilla_results[j].severity != undefined) {
                                                    bug_severity = bugzilla_results[j].severity;
                                                }

                                                if (bugzilla_results[j].resolution != undefined) {
                                                    bug_resolution = bugzilla_results[j].resolution;
                                                }

                                                if (bugzilla_results[j].cf_city_address != undefined) {
                                                    bug_address = bugzilla_results[j].cf_city_address;
                                                }

                                                if (bugzilla_results[j].cf_cc_mobile != undefined) {
                                                    cf_cc_mobile = bugzilla_results[j].cf_cc_mobile;
                                                }

                                                if (bugzilla_results[j].cf_cc_name != undefined) {
                                                    cf_cc_name = bugzilla_results[j].cf_cc_name;
                                                }

                                                if (bugzilla_results[j].cc != undefined) {
                                                    cc = bugzilla_results[j].cc;
                                                }

                                            }
                                        }

                                        if (_kml == 0) {
                                            if (req.admin_user == 1) {
                                                //isadmin                                                                                                                                                                                                                
                                                issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '","cf_cc_mobile":"' + cf_cc_mobile + '","cf_cc_name":"' + cf_cc_name + '","cc":"' + cc + '"}';
                                            } else if (req.admin_user == 0) {
                                                //simpleuser
                                                issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '"}';
                                            }


                                            if (i < issue.length - 1) {
                                                issue_return += ',';
                                            }
                                        } else if (_kml == 1) {
                                            issue_return += '<Placemark>' +
                                                '<name>' + issue[i].issue + ' - ' + issue[i].value_desc + '</name>' +
                                                '<description><![CDATA[<img src="' + issue[i].image_name + '"/><a href="https://' + issue[i].municipality + '.sense.city/issue/' + issue[i]._id + '">https://' + issue[i].municipality + '.sense.city/issue/' + issue[i]._id + '</a>]]></description>' +
                                                '<LookAt>' +
                                                '<longitude>' + issue[i].loc.coordinates[0] + '</longitude>' +
                                                '<latitude>' + issue[i].loc.coordinates[1] + '</latitude>' +
                                                '<altitude>0</altitude>' +
                                                '<heading>-176.4101948194351</heading>' +
                                                '<tilt>70.72955317497231</tilt>' +
                                                '<range>1952.786634342951</range>' +
                                                '<gx:altitudeMode>relativeToSeaFloor</gx:altitudeMode>' +
                                                '</LookAt>' +
                                                '<styleUrl>#m_ylw-pushpin</styleUrl>' +
                                                '<Point>' +
                                                '<gx:drawOrder>1</gx:drawOrder>' +
                                                '<coordinates>' + issue[i].loc.coordinates[0] + ',' + issue[i].loc.coordinates[1] + ',0</coordinates>' +
                                                '</Point>' +
                                                '</Placemark>';
                                        }
                                    }
                                }
                                else {
                                    issue_return = "{}";
                                }

                                if (_kml == 0) {
                                    issue_return += ']';

                                    callback(issue_return);
                                } else if (_kml == 1) {
                                    issue_return += '</Folder> </Document> </kml>';

                                    callback(issue_return);
                                }

                            }).sort({ "create_at": _sort_mongo });//.limit(_limit);
                        } else {


                            Issue.find({ "_id": { $in: ids } }, { "image_name": _image }, function (err, issue) {
                                console.log("issue.get -> Issue.find()");
                                //new start
                                if (err != null) { console.log("err2   =   " + err); }
                                if (_kml == 0) {
                                    issue_return += '[';
                                } else if (_kml == 1) {
                                    issue_return += '<?xml version="1.0" encoding="UTF-8"?> <kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom"> <Document>' +
                                        '<name>sensecity.kml</name>' +
                                        '<Style id="s_ylw-pushpin_hl">' +
                                        '<IconStyle>' +
                                        '<color>ff7fffff</color>' +
                                        '<scale>1.3</scale>' +
                                        '<Icon>' +
                                        '<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>' +
                                        '</Icon>' +
                                        '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
                                        '</IconStyle>' +
                                        '</Style>' +
                                        '<StyleMap id="m_ylw-pushpin">' +
                                        '<Pair>' +
                                        '<key>normal</key>' +
                                        '<styleUrl>#s_ylw-pushpin</styleUrl>' +
                                        '</Pair>' +
                                        '<Pair>' +
                                        '<key>highlight</key>' +
                                        '<styleUrl>#s_ylw-pushpin_hl</styleUrl>' +
                                        '</Pair>' +
                                        '</StyleMap>' +
                                        '<Style id="s_ylw-pushpin">' +
                                        '<IconStyle>' +
                                        '<color>ff7fffff</color>' +
                                        '<scale>1.1</scale>' +
                                        '<Icon>' +
                                        '<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>' +
                                        '</Icon>' +
                                        '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
                                        '</IconStyle>' +
                                        '</Style>' +
                                        '<Folder>' +
                                        '<name>sensecity</name>' +
                                        '<open>1</open>';
                                }


                                if (issue != undefined) {
                                    for (var i = 0; i < issue.length; i++) {

                                        var bug_id = 0;
                                        var bug_status = "";
                                        var bug_authenticate = "0";
                                        var bug_component;
                                        var bug_priority;
                                        var bug_severity;
                                        var bug_resolution;
                                        var bug_address;
                                        var cf_cc_mobile;
                                        var cf_cc_name;
                                        var cc;



                                        for (var j = 0; j < bugzilla_results.length; j++) {
                                            if (bugzilla_results[j].alias[0] == issue[i]._id) {
                                                bug_id = bugzilla_results[j].id;
                                                bug_status = bugzilla_results[j].status;
                                                bug_authenticate = bugzilla_results[j].cf_authedicated;

                                                if (bugzilla_results[j].component != undefined) {
                                                    bug_component = bugzilla_results[j].component;
                                                }
                                                if (bugzilla_results[j].priority != undefined) {
                                                    bug_priority = bugzilla_results[j].priority;
                                                }
                                                if (bugzilla_results[j].severity != undefined) {
                                                    bug_severity = bugzilla_results[j].severity;
                                                }

                                                if (bugzilla_results[j].resolution != undefined) {
                                                    bug_resolution = bugzilla_results[j].resolution;
                                                }

                                                if (bugzilla_results[j].cf_city_address != undefined) {
                                                    bug_address = bugzilla_results[j].cf_city_address;
                                                }

                                                if (bugzilla_results[j].cf_cc_mobile != undefined) {
                                                    cf_cc_mobile = bugzilla_results[j].cf_cc_mobile;
                                                }

                                                if (bugzilla_results[j].cf_cc_name != undefined) {
                                                    cf_cc_name = bugzilla_results[j].cf_cc_name;
                                                }

                                                if (bugzilla_results[j].cc != undefined) {
                                                    cc = bugzilla_results[j].cc;
                                                }

                                            }
                                        }

                                        if (_kml == 0) {
                                            if (req.admin_user == 1) {
                                                typeof cf_cc_mobile;
                                                //isadmin                                                                                                                                                                                                                
                                                issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '","cf_cc_mobile":"' + cf_cc_mobile + '","cf_cc_name":"' + cf_cc_name + '","cc":"' + cc + '"}';
                                            } else if (req.admin_user == 0) {
                                                //simpleuser
                                                issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '"}';
                                            }


                                            if (i < issue.length - 1) {
                                                issue_return += ',';
                                            }
                                        } else if (_kml == 1) {
                                            issue_return += '<Placemark>' +
                                                '<name>' + issue[i].issue + ' - ' + issue[i].value_desc + '</name>' +
                                                '<description><![CDATA[<img src="' + issue[i].image_name + '"/><a href="https://' + issue[i].municipality + '.sense.city/issue/' + issue[i]._id + '">https://' + issue[i].municipality + '.sense.city/issue/' + issue[i]._id + '</a>]]></description>' +
                                                '<LookAt>' +
                                                '<longitude>' + issue[i].loc.coordinates[0] + '</longitude>' +
                                                '<latitude>' + issue[i].loc.coordinates[1] + '</latitude>' +
                                                '<altitude>0</altitude>' +
                                                '<heading>-176.4101948194351</heading>' +
                                                '<tilt>70.72955317497231</tilt>' +
                                                '<range>1952.786634342951</range>' +
                                                '<gx:altitudeMode>relativeToSeaFloor</gx:altitudeMode>' +
                                                '</LookAt>' +
                                                '<styleUrl>#m_ylw-pushpin</styleUrl>' +
                                                '<Point>' +
                                                '<gx:drawOrder>1</gx:drawOrder>' +
                                                '<coordinates>' + issue[i].loc.coordinates[0] + ',' + issue[i].loc.coordinates[1] + ',0</coordinates>' +
                                                '</Point>' +
                                                '</Placemark>';
                                        }
                                    }
                                }
                                else {
                                    issue_return = ""; //issue_return = "{}";
                                }

                                if (_kml == 0) {
                                    issue_return += ']';

                                    callback(issue_return);
                                } else if (_kml == 1) {
                                    issue_return += '</Folder> </Document> </kml>';

                                    callback(issue_return);
                                }

                                //new end
                                //res.send(issue);
                            }).sort({ "create_at": _sort_mongo });//.limit(_limit);
                        }

                    } else {

                        if (_user_extra == 0) {

                            Issue.find({ "_id": { $in: ids } }, { "user": 0 }, function (err, issue) {

                                //new start
                                if (err != null) { console.log("err3   =   " + err); }
                                if (_kml == 0) {
                                    issue_return += '[';
                                } else if (_kml == 1) {
                                    issue_return += '<?xml version="1.0" encoding="UTF-8"?> <kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom"> <Document>' +
                                        '<name>sensecity.kml</name>' +
                                        '<Style id="s_ylw-pushpin_hl">' +
                                        '<IconStyle>' +
                                        '<color>ff7fffff</color>' +
                                        '<scale>1.3</scale>' +
                                        '<Icon>' +
                                        '<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>' +
                                        '</Icon>' +
                                        '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
                                        '</IconStyle>' +
                                        '</Style>' +
                                        '<StyleMap id="m_ylw-pushpin">' +
                                        '<Pair>' +
                                        '<key>normal</key>' +
                                        '<styleUrl>#s_ylw-pushpin</styleUrl>' +
                                        '</Pair>' +
                                        '<Pair>' +
                                        '<key>highlight</key>' +
                                        '<styleUrl>#s_ylw-pushpin_hl</styleUrl>' +
                                        '</Pair>' +
                                        '</StyleMap>' +
                                        '<Style id="s_ylw-pushpin">' +
                                        '<IconStyle>' +
                                        '<color>ff7fffff</color>' +
                                        '<scale>1.1</scale>' +
                                        '<Icon>' +
                                        '<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>' +
                                        '</Icon>' +
                                        '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
                                        '</IconStyle>' +
                                        '</Style>' +
                                        '<Folder>' +
                                        '<name>sensecity</name>' +
                                        '<open>1</open>';
                                }

                                for (var i = 0; i < issue.length; i++) {

                                    var bug_id = 0;
                                    var bug_status = "";
                                    var bug_authenticate = "0";
                                    var bug_component;
                                    var bug_priority;
                                    var bug_severity;
                                    var bug_resolution;
                                    var bug_address;
                                    var cf_cc_mobile;
                                    var cf_cc_name;
                                    var cc;

                                    for (var j = 0; j < bugzilla_results.length; j++) {
                                        if (bugzilla_results[j].alias[0] == issue[i]._id) {
                                            bug_id = bugzilla_results[j].id;
                                            bug_status = bugzilla_results[j].status;
                                            bug_authenticate = bugzilla_results[j].cf_authedicated;

                                            if (bugzilla_results[j].component != undefined) {
                                                bug_component = bugzilla_results[j].component;
                                            }
                                            if (bugzilla_results[j].priority != undefined) {
                                                bug_priority = bugzilla_results[j].priority;
                                            }
                                            if (bugzilla_results[j].severity != undefined) {
                                                bug_severity = bugzilla_results[j].severity;
                                            }

                                            if (bugzilla_results[j].resolution != undefined) {
                                                bug_resolution = bugzilla_results[j].resolution;
                                            }

                                            if (bugzilla_results[j].cf_city_address != undefined) {
                                                bug_address = bugzilla_results[j].cf_city_address;
                                            }

                                            if (bugzilla_results[j].cf_cc_mobile != undefined) {
                                                cf_cc_mobile = bugzilla_results[j].cf_cc_mobile;
                                            }

                                            if (bugzilla_results[j].cf_cc_name != undefined) {
                                                cf_cc_name = bugzilla_results[j].cf_cc_name;
                                            }

                                            if (bugzilla_results[j].cc != undefined) {
                                                cc = bugzilla_results[j].cc;
                                            }

                                        }
                                    }

                                    if (_kml == 0) {
                                        if (req.admin_user == 1) {
                                            //isadmin           


                                            issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '","cf_cc_mobile":"' + cf_cc_mobile + '","cf_cc_name":"' + cf_cc_name + '","cc":"' + cc + '"}';
                                        } else if (req.admin_user == 0) {
                                            //simpleuser
                                            issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '"} ';
                                        }



                                        if (i < issue.length - 1) {
                                            issue_return += ',';
                                        }
                                    } else if (_kml == 1) {
                                        issue_return += '<Placemark>' +
                                            '<name>' + issue[i].issue + ' - ' + issue[i].value_desc + '</name>' +
                                            '<description><![CDATA[<img src="' + issue[i].image_name + '"/><a href="https://' + issue[i].municipality + '.sense.city/issue/' + issue[i]._id + '">https://' + issue[i].municipality + '.sense.city/issue/' + issue[i]._id + '</a>]]></description>' +
                                            '<LookAt>' +
                                            '<longitude>' + issue[i].loc.coordinates[0] + '</longitude>' +
                                            '<latitude>' + issue[i].loc.coordinates[1] + '</latitude>' +
                                            '<altitude>0</altitude>' +
                                            '<heading>-176.4101948194351</heading>' +
                                            '<tilt>70.72955317497231</tilt>' +
                                            '<range>1952.786634342951</range>' +
                                            '<gx:altitudeMode>relativeToSeaFloor</gx:altitudeMode>' +
                                            '</LookAt>' +
                                            '<styleUrl>#m_ylw-pushpin</styleUrl>' +
                                            '<Point>' +
                                            '<gx:drawOrder>1</gx:drawOrder>' +
                                            '<coordinates>' + issue[i].loc.coordinates[0] + ',' + issue[i].loc.coordinates[1] + ',0</coordinates>' +
                                            '</Point>' +
                                            '</Placemark>';
                                    }
                                }

                                if (_kml == 0) {
                                    issue_return += ']';

                                    callback(issue_return);
                                } else if (_kml == 1) {
                                    issue_return += '</Folder> </Document> </kml>';

                                    callback(issue_return);
                                }

                                //new end

                                //res.send(issue);
                            }).sort({ "create_at": _sort_mongo });//.limit(_limit);
                        } else {
                            Issue.find({ "_id": { $in: ids } }, { /*"user": 0*/ }, function (err, issue) {

                                //new start
                                if (err != null) { console.log("err3   =   " + err); }
                                if (_kml == 0) {
                                    issue_return += '[';
                                } else if (_kml == 1) {
                                    issue_return += '<?xml version="1.0" encoding="UTF-8"?> <kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom"> <Document>' +
                                        '<name>sensecity.kml</name>' +
                                        '<Style id="s_ylw-pushpin_hl">' +
                                        '<IconStyle>' +
                                        '<color>ff7fffff</color>' +
                                        '<scale>1.3</scale>' +
                                        '<Icon>' +
                                        '<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>' +
                                        '</Icon>' +
                                        '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
                                        '</IconStyle>' +
                                        '</Style>' +
                                        '<StyleMap id="m_ylw-pushpin">' +
                                        '<Pair>' +
                                        '<key>normal</key>' +
                                        '<styleUrl>#s_ylw-pushpin</styleUrl>' +
                                        '</Pair>' +
                                        '<Pair>' +
                                        '<key>highlight</key>' +
                                        '<styleUrl>#s_ylw-pushpin_hl</styleUrl>' +
                                        '</Pair>' +
                                        '</StyleMap>' +
                                        '<Style id="s_ylw-pushpin">' +
                                        '<IconStyle>' +
                                        '<color>ff7fffff</color>' +
                                        '<scale>1.1</scale>' +
                                        '<Icon>' +
                                        '<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>' +
                                        '</Icon>' +
                                        '<hotSpot x="20" y="2" xunits="pixels" yunits="pixels"/>' +
                                        '</IconStyle>' +
                                        '</Style>' +
                                        '<Folder>' +
                                        '<name>sensecity</name>' +
                                        '<open>1</open>';
                                }

                                for (var i = 0; i < issue.length; i++) {

                                    var bug_id = 0;
                                    var bug_status = "";
                                    var bug_authenticate = "0";
                                    var bug_component;
                                    var bug_priority;
                                    var bug_severity;
                                    var bug_resolution;
                                    var bug_address;
                                    var cf_cc_mobile;
                                    var cf_cc_name;
                                    var cc;

                                    for (var j = 0; j < bugzilla_results.length; j++) {
                                        if (bugzilla_results[j].alias[0] == issue[i]._id) {
                                            bug_id = bugzilla_results[j].id;
                                            bug_status = bugzilla_results[j].status;
                                            bug_authenticate = bugzilla_results[j].cf_authedicated;

                                            if (bugzilla_results[j].component != undefined) {
                                                bug_component = bugzilla_results[j].component;
                                            }
                                            if (bugzilla_results[j].priority != undefined) {
                                                bug_priority = bugzilla_results[j].priority;
                                            }
                                            if (bugzilla_results[j].severity != undefined) {
                                                bug_severity = bugzilla_results[j].severity;
                                            }

                                            if (bugzilla_results[j].resolution != undefined) {
                                                bug_resolution = bugzilla_results[j].resolution;
                                            }

                                            if (bugzilla_results[j].cf_city_address != undefined) {
                                                bug_address = bugzilla_results[j].cf_city_address;
                                            }

                                            if (bugzilla_results[j].cf_cc_mobile != undefined) {
                                                cf_cc_mobile = bugzilla_results[j].cf_cc_mobile;
                                            }

                                            if (bugzilla_results[j].cf_cc_name != undefined) {
                                                cf_cc_name = bugzilla_results[j].cf_cc_name;
                                            }

                                            if (bugzilla_results[j].cc != undefined) {
                                                cc = bugzilla_results[j].cc;
                                            }

                                        }
                                    }

                                    if (_kml == 0) {
                                        if (req.admin_user == 1) {
                                            //isadmin                                                                                                                                                                                                                                                        
                                            issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","name":"' + issue[i].user.name + '","phone":"' + issue[i].user.phone + '","email":"' + issue[i].user.email + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '","cf_cc_mobile":"' + cf_cc_mobile + '","cf_cc_name":"' + cf_cc_name + '","cc":"' + cc + '"} ';
                                        } else if (req.admin_user == 0) {
                                            //simpleuser
                                            issue_return += '{"_id":"' + issue[i]._id + '","municipality":"' + issue[i].municipality + '","image_name":"' + issue[i].image_name + '","issue":"' + issue[i].issue + '","device_id":"' + issue[i].device_id + '","value_desc":"' + issue[i].value_desc + '","comments":"' + issue[i].comments + '","create_at":"' + issue[i].create_at + '","loc":{"type":"Point","coordinates":[' + issue[i].loc.coordinates + ']},"status":"' + bug_status + '","bug_id":"' + bug_id + '","cf_authenticate":"' + bug_authenticate + '", "bug_component":"' + bug_component + '", "bug_priority":"' + bug_priority + '", "bug_severity":"' + bug_severity + '","resolution":"' + bug_resolution + '","bug_address":"' + bug_address + '"} ';
                                        }



                                        if (i < issue.length - 1) {
                                            issue_return += ',';
                                        }
                                    } else if (_kml == 1) {
                                        issue_return += '<Placemark>' +
                                            '<name>' + issue[i].issue + ' - ' + issue[i].value_desc + '</name>' +
                                            '<description><![CDATA[<img src="' + issue[i].image_name + '"/><a href="https://' + issue[i].municipality + '.sense.city/issue/' + issue[i]._id + '">https://' + issue[i].municipality + '.sense.city/issue/' + issue[i]._id + '</a>]]></description>' +
                                            '<LookAt>' +
                                            '<longitude>' + issue[i].loc.coordinates[0] + '</longitude>' +
                                            '<latitude>' + issue[i].loc.coordinates[1] + '</latitude>' +
                                            '<altitude>0</altitude>' +
                                            '<heading>-176.4101948194351</heading>' +
                                            '<tilt>70.72955317497231</tilt>' +
                                            '<range>1952.786634342951</range>' +
                                            '<gx:altitudeMode>relativeToSeaFloor</gx:altitudeMode>' +
                                            '</LookAt>' +
                                            '<styleUrl>#m_ylw-pushpin</styleUrl>' +
                                            '<Point>' +
                                            '<gx:drawOrder>1</gx:drawOrder>' +
                                            '<coordinates>' + issue[i].loc.coordinates[0] + ',' + issue[i].loc.coordinates[1] + ',0</coordinates>' +
                                            '</Point>' +
                                            '</Placemark>';
                                    }
                                }

                                if (_kml == 0) {
                                    issue_return += ']';

                                    callback(issue_return);
                                } else if (_kml == 1) {
                                    issue_return += '</Folder> </Document> </kml>';

                                    callback(issue_return);
                                }

                                //new end

                                //res.send(issue);
                            }).sort({ "create_at": _sort_mongo });//.limit(_limit);
                        }
                    }

                });
            } //

        } //end else if no city AND coordinates
    }
    else {
        callback([]);
    }
}

/* ** End test ** */
//POST router
router.post('/send_email', function (req, res) {


    if (req.body.uuid != undefined && req.body.name != undefined && req.body.email != undefined && req.body.phonenumber != undefined) {
        act_User.find({ "uuid": req.body.uuid, "name": req.body.name, "email": req.body.email, "mobile_num": req.body.phonenumber }, function (err, response) {

            console.log(response);
            if (response.length != 0) {
                if (response[0].activate == "1") {

                    var transporter = nodemailer.createTransport('smtps://' + config.config.email + ':' + config.config.password_email + '@smtp.gmail.com');

                    // setup e-mail data with unicode symbols 
                    var mailOptions = {
                        from: '"Sense.City " <info@sense.city>', // sender address 
                        to: 'info@sense.city', // list of receivers 
                        subject: ' Αποστολή Αναφοράς από πολίτη ' + req.body.subject, // Subject line 
                        text: 'Όνομα :' + req.body.name + ' \n\n\n με email : ' + req.body.email + ' \n\n\n κινητό τηλέφωνο :' + req.body.phonenumber + ' \n\n\n μήνυμα :' + req.body.comments, // plaintext body 
                        html: 'Όνομα :' + req.body.name + ' \n\n<br /> με email : ' + req.body.email + ' \n\n<br /> κινητό τηλέφωνο :' + req.body.phonenumber + '\n\n<br /> μήνυμα :' + req.body.comments // html body 
                    };

                    // send mail with defined transport object 
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log('error');
                            res.send(["error"]);
                            return console.log(error);

                        }
                        res.send(["ok"]);
                        console.log('Message sent: ' + info.response);
                    });


                } else {
                    res.send(["no"]);
                    //console.log("response13456");
                }
            } else {
                res.send({ "message": "noUser" });
            }

        });
    } else {
        res.send(["no"]);
        //console.log("response13456");
    }
});



//POST router
router.post('/feelings', function (req, res) {

    var return_var;

    if (!req.body.hasOwnProperty('issue') ||
        !req.body.hasOwnProperty('loc') ||
        !req.body.hasOwnProperty('value_desc') ||
        !req.body.hasOwnProperty('device_id')) {
        res.statusCode = 403;
        return res.send({ "message": "Forbidden" });
    } else {

        Municipality.find({
            boundaries:
                {
                    $geoIntersects:
                        {
                            $geometry: {
                                "type": "Point",
                                "coordinates": req.body.loc.coordinates
                            }
                        }
                }
        }, function (err, response) {

            var entry = new Issue({
                loc: { type: 'Point', coordinates: req.body.loc.coordinates },
                issue: req.body.issue,
                device_id: req.body.device_id,
                value_desc: req.body.value_desc
            });

            if (response.length > 0) {
                entry.municipality = response[0]["municipality"];
            } else {
                entry.municipality = '';
            }

            // console.log(entry);
            entry.save(function (err1, resp) {
                if (err1) {
                    console.log(err1);
                } else {
                    res.send(resp);
                }
            });
        });
    }
});

router.get('/feelings', function (req, res) {

    var _startdate = new Date();
    var _enddate = new Date();
    var _coordinates;
    var _distance;
    var _feeling = [];
    var _limit;
    var _sort;
    var _city;
    var newdate = new Date();
    var _coordinates_query;

    if (!req.query.hasOwnProperty('startdate')) {
        _startdate.setDate(_startdate.getDate() - 3);
        _startdate.setHours(00);
        _startdate.setMinutes(00, 00);
    } else {
        _startdate = new Date(req.query.startdate);
        _startdate.setHours(00);
        _startdate.setMinutes(00, 00);
    }

    if (req.query.hasOwnProperty('enddate')) {
        _enddate = new Date(req.query.enddate);
        _enddate.setHours(23);
        _enddate.setMinutes(59, 59);
    } else {
        _enddate = newdate;
    }

    if (!req.query.hasOwnProperty('coordinates')) {
        _coordinates = '';
    } else {
        _coordinates = req.query.coordinates;
    }

    if (!req.query.hasOwnProperty('distance')) {
        _distance = '10000';
    } else {
        _distance = req.query.distance;
    }

    if (!req.query.hasOwnProperty('feeling') || req.query.feeling === 'all') {
        _feeling = ["happy", "neutral", "angry"];
    } else {


        var feeling_split = req.query.feeling.split("|");

        switch (feeling_split.length) {
            case 1:
                _feeling.push(feeling_split[0]);
                break;
            case 2:
                _feeling.push(feeling_split[0]);
                _feeling.push(feeling_split[1]);
                break;
            case 3:
                _feeling.push(feeling_split[0]);
                _feeling.push(feeling_split[1]);
                _feeling.push(feeling_split[2]);
                break;
            default:
                _feeling = ["happy", "neutral", "angry"];
                break;
        }
    }

    if (!req.query.hasOwnProperty('limit')) {
        _limit = 1000;
    } else {
        _limit = req.query.limit;
    }

    if (!req.query.hasOwnProperty('sort')) {
        _sort = -1;
    } else {
        _sort = req.query.sort;
    }

    if (!req.query.hasOwnProperty('city')) {
        _city = '';
    } else {
        _city = req.query.city;
    }

    if (_city == '') {
        if (_coordinates != '') {
            Issue.find({ 'loc': { $nearSphere: { $geometry: { type: 'Point', coordinates: JSON.parse(req.query.coordinates) }, $maxDistance: 2000 } }, "issue": { $in: _feeling }, "create_at": { $gte: _startdate, $lt: _enddate } }, { "user": false }, function (err, issue) {

                res.send(issue);
            }).sort({ "create_at": _sort }).limit(_limit);
        } else {
            Issue.find({ "issue": { $in: _feeling }, "create_at": { $gte: _startdate, $lt: _enddate } }, { "user": false }, function (err, issue) {

                res.send(issue);
            }).sort({ "create_at": _sort }).limit(_limit);
        }

    }
    else {
        if (_coordinates != '') {
            Issue.find({ 'loc': { $nearSphere: { $geometry: { type: 'Point', coordinates: JSON.parse(req.query.coordinates) }, $maxDistance: 2000 } }, "issue": { $in: _feeling }, "create_at": { $gte: _startdate, $lt: _enddate }, "municipality": _city }, { "user": false }, function (err, issue) {

                res.send(issue);
            }).sort({ "create_at": _sort }).limit(_limit);
        } else {
            Issue.find({ "issue": { $in: _feeling }, "create_at": { $gte: _startdate, $lt: _enddate }, "municipality": _city }, { "user": false }, function (err, issue) {

                res.send(issue);
            }).sort({ "create_at": _sort }).limit(_limit);
        }
    }

});


router.get('/mobilemap', function (req, res) {

    Issue.find({ 'loc': { $nearSphere: { $geometry: { type: 'Point', coordinates: JSON.parse(req.query.coordinates) }, $maxDistance: 2000 } } }, { 'image_name': false }, function (err, issue) {
        res.send(issue);
    }).sort({ create_at: 1 }).limit(40);

});

router.get('/city_policy', function (req, res) {
    var _coordinates = req.query.coordinates;
    var _issue = req.query.issue;
    Municipality.find({ boundaries: { $geoIntersects: { $geometry: { "type": "Point", "coordinates": JSON.parse(req.query.coordinates) } } } }, { "municipality": 1 }, function (err, response) {
        if (response[0] != undefined) {
            cityPolicy.find({ "city": response[0].municipality, "category": req.query.issue }, { "policy_desc": 1, "anonymous": 1, "city": 1, "add_issue": 1 }, function (err, city_policy) {
                //console.log(city_policy);
                res.send(city_policy);
            });
        } else {
            res.send([{ "policy_desc": "Η πόλη που βρίσκεστε δεν υποστηρίζετε από το Sense.City. Το αίτημα σας θα καταχωριθεί ως ανώνυμο." }]);
        }
    });
});

function return_fullissue_resp(id, alias, status, cf_city_address, department, callback) {

    console.log(bugUrlRest + "/rest/bug/" + id + "/comment" + id + alias + status + cf_city_address);

    request({
        url: bugUrlRest + "/rest/bug/" + id + "/comment",
        method: "GET"
    }, function (error1, response1, body1) {

        Issue.find({ "_id": alias }, { "user": 0 }, function (err, issue) {


            if (issue.length != 0) {
                var resp_body = JSON.parse(response1.body);

                for (var q = 0; q < JSON.stringify(JSON.parse(response1.body).bugs[id].comments.length); q++) {
                    for (var w = 0; w < JSON.stringify(JSON.parse(response1.body).bugs[id].comments[q].tags.length); w++) {
                        var str_tag = JSON.stringify(JSON.parse(response1.body).bugs[id].comments[q].tags[w]);

                        if (str_tag.indexOf('email:') > -1) {
                            resp_body.bugs[id].comments[q].tags[w] = 'email:undefined';
                        } else if (str_tag.indexOf('mobile:') > -1) {
                            resp_body.bugs[id].comments[q].tags[w] = 'mobile:undefined';
                        }
                    }
                    if (q == JSON.stringify(JSON.parse(response1.body).bugs[id].comments.length) - 1) {
                        var issue_rtrn = '{"_id":"' + issue[0]._id + '","municipality":"' + issue[0].municipality + '","issue":"' + issue[0].issue + '","device_id":"' + issue[0].device_id + '","value_desc":"' + issue[0].value_desc + '","comments":"' + issue[0].comments + '","create_at":"' + issue[0].create_at + '","loc":{"type":"Point","coordinates":[' + issue[0].loc.coordinates + ']},"status":"' + status + '", "city_address":"' + cf_city_address + '","bug_id":"' + id + '","department":"' + department + '","bugs":' + JSON.stringify(resp_body.bugs) + '}';
                        callback(issue_rtrn);
                    }
                }
            }
            else {
                callback([]);
            }

        });
    });


}

router.get('/fullissue/:id', function (req, res) {

    var id = req.params.id;
    var split_alias = id.split("|");
    var issue_rtrn;
    var alias_array = '';

    for (var k = 0; k < split_alias.length; k++) {

        if (k > 0) {
            alias_array += "&";
        }
        alias_array += "alias=" + split_alias[k];
    }

    var bugParams1 = "?" + alias_array + "&include_fields=id,component,alias,status,cf_city_address,product,cf_issues,creation_ts";

    request({
        url: bugUrlRest + "/rest/bug" + bugParams1,
        method: "GET"
    }, function (error, response, body) {
        var _counter = 0;
        var array_callback = [];
        var _old_counter = -1;
        var expected_responses = JSON.parse(body).bugs.length;
        var received_responses = 0;
        if (error) {
            console.log(JSON.stringify(error));
        }

        for (var _counter = 0; _counter < JSON.parse(body).bugs.length; _counter++) {

            _old_counter = _counter;

            return_fullissue_resp(JSON.parse(body).bugs[_counter].id, JSON.parse(body).bugs[_counter].alias[0], JSON.parse(body).bugs[_counter].status, JSON.parse(body).bugs[_counter].cf_city_address, JSON.parse(body).bugs[_counter].component, function (callback) {

                received_responses++;

                if (callback != '') {
                    array_callback.push(JSON.parse(callback));
                }

                if (received_responses == expected_responses) {
                    res.send(array_callback);
                } else {
                    console.log("wait...");
                }


            });

            //sleep.sleep(10);
        }




    });

});

function isseu_rtn_function(allias_issue, myid, cf_city_address, status, callback) {
    //var allias_issue = body_var.bugs[q].alias[0];

    request({
        url: bugUrlRest + "/rest/bug/" + allias_issue + "/comment",
        method: "GET"
    }, function (error1, response1, body1) {
        if (error1)
            cosnole.log("/fullissue/:id error :" + error1);

        Issue.find({ "_id": allias_issue }, { "user": 0 }, function (err, issue) {

            if (issue.length != 0) {
                var issue_rtrn = '[{"_id":"' + issue[0]._id + '","municipality":"' + issue[0].municipality + '","image_name":"' + issue[0].image_name + '","issue":"' + issue[0].issue + '","device_id":"' + issue[0].device_id + '","value_desc":"' + issue[0].value_desc + '","comments":"' + issue[0].comments + '","create_at":"' + issue[0].create_at + '","loc":{"type":"Point","coordinates":[' + issue[0].loc.coordinates + ']},"status":"' + status + '", "city_address":"' + cf_city_address + '","bug_id":"' + myid + '"},' + body1 + ']';

                callback(issue_rtrn);

            }
            else {
                callback([]);
            }

        });
    });


}

router.post('/is_activate_user', function (req, res) {

    var _activate_email = '';
    var _activate_sms = '';

    if (req.body.city != undefined || req.body.email != undefined || req.body.email != '') {
        if (req.body.city == "london") {

            //find email
            act_email.find({ "email": req.body.email }, function (err1, resp1) {

                if (resp1.length > 0) {
                    if (resp1.activate != 1) {
                        act_email.update({ "email": req.body.email }, {
                            $set: { "activate": "1" }
                        }, function (err3, resp3) {
                            res.send([{ "activate_email": "1", "activate_sms": "0" }]);
                        });
                    } else {
                        res.send([{ "activate_email": "1", "activate_sms": "0" }]);
                    }
                } else {

                    var activate_email = new act_email({
                        email: req.body.email,
                        activate: 1
                    });

                    activate_email.save(function (err2, resp2) {

                        if (err2) { console.log("err2===>" + err2); }

                        res.send([{ "activate_email": "1", "activate_sms": "0" }]);
                    });

                }
            });
            //if not exist insert with activate 1


        }
    }

    if (req.body.city != "london") {

        if (req.body.uuid == "web-site") {

            if (req.body.email != undefined || req.body.email != '') {

                act_email.find({ "email": req.body.email }, { "activate": 1 }, function (req8, res8) {
                    console.log("res8" + res8.length);
                    if (res8.length > 0) {
                        _activate_email = res8[0].activate;
                    }

                    if (req.body.mobile_num != undefined || req.body.mobile_num != '') {

                        act_mobile.find({ "mobile_num": req.body.mobile }, { "activate": 1 }, function (req9, res9) {
                            console.log("res9" + res9);
                            if (res9.length > 0) {
                                _activate_sms = res9[0].activate;
                            }
                            console.log([{ "activate_email": _activate_email, "activate_sms": _activate_sms }]);

                            res.send([{ "activate_email": _activate_email, "activate_sms": _activate_sms }]);

                        });
                    }
                });
            } else {
                console.log("email empty");
            }
        } else {
            var req_email = "";
            var req_mobile = "";

            if (req.body.email != undefined) {
                req_email = req.body.email;
            }

            if (req.body.mobile != undefined) {
                req_mobile = req.body.mobile;
            }

            if (req_email != "") {
                act_email.find({ "email": req.body.email }, { "activate": 1 }, function (req8, res8) {
                    console.log("res8" + res8.length);
                    if (res8.length > 0) {
                        _activate_email = res8[0].activate;
                    }
                    res.send([{ "activate_email": _activate_email }]);
                });
            }

            if (req_mobile != "") {

                act_mobile.find({ "mobile_num": req.body.mobile }, { "activate": 1 }, function (req9, res9) {
                    console.log("res9" + res9);
                    if (res9.length > 0) {
                        _activate_sms = res9[0].activate;
                    }

                    res.send([{ "activate_sms": _activate_sms }]);

                });

            }

        }

    }
});

router.post('/activate_user', function (req, res) {

    if (req.query.uuid != undefined) {
        if (req.query.hasOwnProperty('uuid')) {
            if (req.query.email != undefined) {
                if (req.query.uuid != "web-site") {

                    act_User.find({ "uuid": req.query.uuid }, function (err, resp) {

                        if (err) {
                            throw err;
                        }
                        var text_act = "";
                        var possible = "0123456789";

                        for (var i = 0; i < 4; i++)
                            text_act += possible.charAt(Math.floor(Math.random() * possible.length));

                        if (resp != '') {
                            act_User.update({ "_id": resp[0]._id }, { $set: { "name": req.query.name, "email": req.query.email, "permission.communicate_with.email": "true", "activate": text_act, } }, function (err1, resp1) {
                                if (resp1.ok == 1 && req.query.email != "") {
                                    console.log("Send mail verify code");


                                    // create reusable transporter object using the default SMTP transport 
                                    var transporter = nodemailer.createTransport('smtps://' + config.config.email + ':' + config.config.password_email + '@smtp.gmail.com');

                                    // setup e-mail data with unicode symbols 
                                    var mailOptions = {
                                        from: '"Sense.City " <info@sense.city>', // sender address 
                                        to: req.query.email, // list of receivers 
                                        subject: 'Αποστολή κωδικού ενεργοποίησης ', // Subject line 
                                        text: 'Κωδικός ενεργοποίησης : ', // plaintext body 
                                        html: 'Κωδικός ενεργοποίησης :' + text_act // html body 
                                    };

                                    // send mail with defined transport object 
                                    transporter.sendMail(mailOptions, function (error, info) {
                                        if (error) {
                                            return console.log(error);
                                        }
                                        res.send([{ "Status": "send" }]);
                                        transporter.close();
                                        //console.log('Message sent: ' + info.response);
                                    });

                                } else {
                                    res.send([{ "Status": "saved" }]);
                                }
                            });

                        } else {
                            var text_act = "";
                            var possible = "0123456789";

                            for (var i = 0; i < 4; i++)
                                text_act += possible.charAt(Math.floor(Math.random() * possible.length));

                            var entry_active_user = new act_User({
                                uuid: req.query.uuid,
                                name: req.query.name,
                                email: req.query.email,
                                mobile_num: '',
                                permission: { send_issues: "true", communicate_with: { email: true, sms: false } },
                                activate: text_act,
                                activate_sms: ''
                            });

                            entry_active_user.save(function (err1, resp) {
                                if (req.query.email != '') {
                                    // create reusable transporter object using the default SMTP transport 
                                    var transporter = nodemailer.createTransport('smtps://' + config.config.email + ':' + config.config.password_email + '@smtp.gmail.com');

                                    // setup e-mail data with unicode symbols 
                                    var mailOptions = {
                                        from: '"Sense.City " <info@sense.city>', // sender address 
                                        to: req.query.email, // list of receivers 
                                        subject: 'Αποστολή κωδικού ενεργοποίησης ', // Subject line 
                                        text: 'Κωδικός ενεργοποίησης : ', // plaintext body 
                                        html: 'Κωδικός ενεργοποίησης :' + text_act // html body 
                                    };

                                    // send mail with defined transport object 
                                    transporter.sendMail(mailOptions, function (error, info) {
                                        if (error) {
                                            return console.log(error);
                                        }
                                        res.send([{ "Status": "send" }]);
                                        transporter.close();
                                    });
                                } else {
                                    res.send([{ "Status": "saved" }]);
                                }
                            });
                        }
                    });
                } else {
                    //check email
                    act_email.find({ "email": req.query.email }, function (err, resp1) {

                        console.log("resp1===>" + resp1);
                        if (resp1.length > 0) {
                            var text_act = '';
                            var possible = "0123456789";

                            for (var i = 0; i < 4; i++) {
                                text_act += possible.charAt(Math.floor(Math.random() * possible.length));
                            }

                            act_email.update({ "email": req.query.email }, { $set: { "activate": text_act, } }, function (err2, resp2) {

                                if (err2)
                                    console.log(err2);

                                console.log("resp2===>" + JSON.stringify(resp2));
                                // create reusable transporter object using the default SMTP transport 
                                var transporter = nodemailer.createTransport('smtps://' + config.config.email + ':' + config.config.password_email + '@smtp.gmail.com');

                                // setup e-mail data with unicode symbols 
                                var mailOptions = {
                                    from: '"Sense.City " <info@sense.city>', // sender address 
                                    to: req.query.email, // list of receivers 
                                    subject: 'Αποστολή κωδικού ενεργοποίησης ', // Subject line 
                                    text: 'Κωδικός ενεργοποίησης : ', // plaintext body 
                                    html: 'Κωδικός ενεργοποίησης :' + text_act // html body 
                                };

                                // send mail with defined transport object 
                                transporter.sendMail(mailOptions, function (error, info) {
                                    if (error) {
                                        return console.log(error);
                                    }
                                    res.send([{ "Status": "send" }]);

                                    //console.log('Message sent: ' + info.response);
                                });
                            });
                        } else {//insert email to collection
                            var text_act = '';
                            var possible = "0123456789";

                            for (var i = 0; i < 4; i++)
                                text_act += possible.charAt(Math.floor(Math.random() * possible.length));

                            var activate_email = new act_email({
                                email: req.query.email,
                                activate: text_act
                            });

                            activate_email.save(function (err1, resp) {
                                // create reusable transporter object using the default SMTP transport 
                                var transporter = nodemailer.createTransport('smtps://' + config.config.email + ':' + config.config.password_email + '@smtp.gmail.com');

                                // setup e-mail data with unicode symbols 
                                var mailOptions = {
                                    from: '"Sense.City " <info@sense.city>', // sender address 
                                    to: req.query.email, // list of receivers 
                                    subject: 'Αποστολή κωδικού ενεργοποίησης ', // Subject line 
                                    text: 'Κωδικός ενεργοποίησης : ', // plaintext body 
                                    html: 'Κωδικός ενεργοποίησης :' + text_act // html body 
                                };

                                // send mail with defined transport object 
                                transporter.sendMail(mailOptions, function (error, info) {
                                    if (error) {
                                        return console.log(error);
                                    }
                                    res.send([{ "Status": "send" }]);
                                });
                            });
                        }
                    });
                }
            }

            if (req.query.mobile != undefined) {
                if (req.query.uuid != "web-site") {

                    var mob_municipality = '';
                    var mob_sms_key_fibair = '';

                    if (req.query.lat != undefined && req.query.long != undefined) {
                        Municipality.find({ boundaries: { $geoIntersects: { $geometry: { "type": "Point", "coordinates": [req.query.long, req.query.lat] } } } }, { "municipality": 1, "sms_key_fibair": 1 }, function (req_mun, res_mun) {
                            if (res_mun != undefined) {
                                if (res_mun[0].sms_key_fibair != undefined) {
                                    mob_municipality = res_mun[0].municipality;
                                    mob_sms_key_fibair = res_mun[0].sms_key_fibair;
                                    if (mob_sms_key_fibair != '') {
                                        console.log("pre resp");
                                        act_User.find({ "uuid": req.query.uuid, "name": req.query.name/*, "mobile_num": req.query.mobile*/ }, function (err, resp) {

                                            var mob_sms_key_fibair_base64 = new Buffer(mob_sms_key_fibair + ":").toString("base64");

                                            if (err)
                                                throw err;

                                            if (resp != '') {

                                                request({
                                                    url: "https://api.theansr.com/v1/sms/verification_pin",
                                                    method: "POST",
                                                    form: { 'sender': mob_municipality, 'recipients': '30' + req.query.mobile },
                                                    headers: { "Authorization": 'Basic ' + mob_sms_key_fibair_base64 }
                                                }, function (err1, response) {
                                                    //console.log(JSON.stringify(response));

                                                    act_User.update({ "_id": resp[0]._id }, { $set: { "name": req.query.name, "mobile_num": req.query.mobile, "permission.communicate_with.sms": "true", "activate_sms": JSON.parse(response.body).verification_pin } }, { "upsert": true }, function (err1, resp1) {
                                                        res.send({ "status": "send sms" });
                                                    });
                                                });
                                            } else {
                                                request({
                                                    url: "https://api.theansr.com/v1/sms/verification_pin",
                                                    method: "POST",
                                                    form: { 'sender': mob_municipality, 'recipients': '30' + req.query.mobile },
                                                    headers: { "Authorization": 'Basic ' + mob_sms_key_fibair_base64 }/*'content-type': 'application/form-data'*/
                                                }, function (err1, response) {
                                                    if (err)
                                                        console.log(err1);

                                                    var entry_active_user = new act_User({
                                                        uuid: req.query.uuid,
                                                        name: req.query.name,
                                                        email: '',
                                                        mobile_num: req.query.mobile,
                                                        permission: { send_issues: "true", communicate_with: { email: false, sms: true } },
                                                        activate: '',
                                                        activate_sms: JSON.parse(response.body).verification_pin
                                                    });

                                                    entry_active_user.save(function (err2, resp2) {
                                                        if (err2)
                                                            console.log(err2);

                                                        res.send([{ "status": "send sms" }]);
                                                    });
                                                });
                                            }
                                        });
                                    }
                                } else {
                                    res.send([{}]);
                                }
                            } else {
                                res.send([{}]);
                            }
                        });
                    }

                } else {
                    //Check mobile number
                    act_mobile.find({ "mobile_num": req.query.mobile }, function (err, resp1) {
                        console.log(" - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ");
                        console.log("   Web Site Search Mobile num");
                        console.log(" - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ");

                        if (resp1.length > 0) {

                            var mob_municipality = '';
                            var mob_sms_key_fibair = '';

                            if (req.query.lat != undefined && req.query.long != undefined) {
                                Municipality.find({ boundaries: { $geoIntersects: { $geometry: { "type": "Point", "coordinates": [req.query.long, req.query.lat] } } } }, { "municipality": 1, "sms_key_fibair": 1 }, function (req_mun, res_mun) {
                                    if (res_mun != undefined) {
                                        if (res_mun[0].sms_key_fibair != undefined) {
                                            mob_municipality = res_mun[0].municipality;
                                            mob_sms_key_fibair = res_mun[0].sms_key_fibair;

                                            if (mob_sms_key_fibair != '') {
                                                var mob_sms_key_fibair_base64 = new Buffer(mob_sms_key_fibair + ":").toString("base64");
                                            }
                                        }

                                        request({
                                            url: "https://api.theansr.com/v1/sms/verification_pin",
                                            method: "POST",
                                            form: { 'sender': mob_municipality, 'recipients': '30' + req.query.mobile },
                                            headers: { "Authorization": 'Basic ' + mob_sms_key_fibair_base64 }
                                        }, function (err1, response) {

                                            act_mobile.update({ "_id": resp1[0]._id }, { $set: { "mobile_num": req.query.mobile, "activate": JSON.parse(response.body).verification_pin } }, function (errr1, resp1) {
                                                res.send({ "status": "send sms" });
                                            });

                                        });

                                    }
                                });
                            }

                        } else {//insert send sms


                            var mob_municipality = '';
                            var mob_sms_key_fibair = '';

                            if (req.query.lat != undefined && req.query.long != undefined) {
                                Municipality.find({ boundaries: { $geoIntersects: { $geometry: { "type": "Point", "coordinates": [req.query.long, req.query.lat] } } } }, { "municipality": 1, "sms_key_fibair": 1 }, function (req_mun, res_mun) {
                                    if (res_mun != undefined) {
                                        if (res_mun[0].sms_key_fibair != undefined) {
                                            mob_municipality = res_mun[0].municipality;
                                            mob_sms_key_fibair = res_mun[0].sms_key_fibair;

                                            if (mob_sms_key_fibair != '') {

                                                //  act_mobile.find({ "uuid": req.query.uuid, "name": req.query.name/*, "mobile_num": req.query.mobile*/ }, function (err, resp) {
                                                var mob_sms_key_fibair_base64 = new Buffer(mob_sms_key_fibair + ":").toString("base64");

                                                request({
                                                    url: "https://api.theansr.com/v1/sms/verification_pin",
                                                    method: "POST",
                                                    form: { 'sender': mob_municipality, 'recipients': '30' + req.query.mobile },
                                                    headers: { "Authorization": 'Basic ' + mob_sms_key_fibair_base64 }
                                                }, function (err1, response) {

                                                    var activate_mobile = new act_mobile({
                                                        mobile_num: req.query.mobile,
                                                        activate: JSON.parse(response.body).verification_pin
                                                    });

                                                    activate_mobile.save(function (err1, resp) {
                                                        res.send({ "status": "send sms" });
                                                    });
                                                });
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            }
        }
    }
});

router.post('/activate_city_policy', function (req, res) {
    if (req.query.long == undefined) {
        res.send([{}]);
    }

    if (req.query.lat == undefined) {
        res.send([{}]);
    }

    Municipality.find({ boundaries: { $geoIntersects: { $geometry: { "type": "Point", "coordinates": [req.query.long, req.query.lat] } } } }, { "municipality": 1, "mandatory_sms": 1, "mandatory_email": 1, "active_sms_service": 1 }, function (req1, res1) {
        res.send(res1);
    });

});

router.post('/activate_email', function (req, res) {

    if (req.query.uuid != "web-site") {

        act_User.update({ "uuid": req.query.uuid, "email": req.query.email, "activate": req.query.code }, {
            $set: {
                "activate": "1", "permission.communicate_with.email": "true"
            }
        }, function (error, activate_user) {

            console.log(error);
            res.send(activate_user);
        });
    } else if (req.query.uuid == "web-site") {
        console.log("activate email");


        act_email.update({ "email": req.query.email.toString(), "activate": req.query.code.toString() }, {
            $set: {
                "activate": "1"
            }
        }, function (error, activate_user) {

            console.log(error);

            if (activate_user.nModified == 1) {
                res.send(activate_user);
            } else {
                res.send("");
            }
        });
    } else {
        res.send([{}]);
    }
});

router.post('/activate_mobile', function (req, res) {
    if (req.query.uuid != "web-site") {
        act_User.update({ "uuid": req.query.uuid, "mobile_num": req.query.mobile, "activate_sms": req.query.code }, {
            $set: {
                "activate_sms": "1", "permission.communicate_with.sms": "true"
            }
        }, function (error, activate_user) {

            console.log(error);
            res.send(activate_user);
        });

    } else if (req.query.uuid == "web-site") {
        act_mobile.update({ "mobile_num": req.query.mobile, "activate": req.query.code }, {
            $set: {
                "activate": "1"
            }
        }, function (error, activate_user) {

            console.log(error);
            res.send(activate_user);
        });
    } else {
        res.send([{}]);
    }

});



router.post('/active_users', function (req, res) {

    if (req.body.hasOwnProperty('uuid') && req.body.hasOwnProperty('name') && req.body.hasOwnProperty('email')) {
        if (req.body.uuid == "web-site") { //web use

            act_User.find({ "email": req.body.email, "activate": "1" }, function (error, resp) {

                if (error)
                    throw error;

                if (resp.length > 0) {

                    act_User.findOneAndUpdate({ "email": req.body.email }, {
                        name: req.body.name,
                        mobile_num: req.body.mobile_num,
                        permission: { communicate_with: { email: req.body.permission.communicate_with.email, sms: req.body.permission.communicate_with.sms } }
                    }, function (err, resp) {
                        if (err)
                            throw err;
                        res.send({ "user_exist": "1" });
                    });

                } else {
                    console.log("no email entry ");

                    var text_act = "";
                    var possible = "0123456789";

                    for (var i = 0; i < 4; i++)
                        text_act += possible.charAt(Math.floor(Math.random() * possible.length));

                    var entry_active_user = new act_User({
                        uuid: req.body.uuid,
                        name: req.body.name,
                        email: req.body.email,
                        mobile_num: req.body.mobile_num,
                        permission: { send_issues: req.body.permission.send_issues, communicate_with: { email: req.body.permission.communicate_with.email, sms: req.body.permission.communicate_with.sms } },
                        activate: text_act
                    });

                    entry_active_user.save(function (err1, resp) {
                        if (err1)
                            throw err1;
                        res.send(resp);
                        // create reusable transporter object using the default SMTP transport 
                        var transporter = nodemailer.createTransport('smtps://' + config.config.email + ':' + config.config.password_email + '@smtp.gmail.com');

                        // setup e-mail data with unicode symbols 
                        var mailOptions = {
                            from: '"Sense.City " <info@sense.city>', // sender address 
                            to: req.body.email, // list of receivers 
                            subject: 'Αποστολή κωδικού ενεργοποίησης ', // Subject line 
                            text: 'Κωδικός ενεργοποίησης : ', // plaintext body 
                            html: 'Κωδικός ενεργοποίησης :' + text_act // html body 
                        };

                        // send mail with defined transport object 
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                return console.log(error);
                            }
                            console.log('Message sent: ' + info.response);
                        });
                    });
                }
            });
        } else { // Mobile use
            act_User.find({ "uuid": req.body.uuid, "email": req.body.email }, function (error, resp) {

                if (error)
                    throw error;

                var text_act = "";
                var possible = "0123456789";

                if (resp.length > 0) {

                    if (resp[0].activate == "1") {
                        text_act = "1";
                    }
                    else {
                        for (var i = 0; i < 4; i++)
                            text_act += possible.charAt(Math.floor(Math.random() * possible.length));
                    }
                    act_User.findOneAndUpdate({ "uuid": req.body.uuid, "email": req.body.email }, {
                        name: req.body.name,
                        email: req.body.email,
                        mobile_num: req.body.mobile_num,
                        activate: text_act,
                        permission: { communicate_with: { email: req.body.permission.communicate_with.email, sms: req.body.permission.communicate_with.sms } }
                    }, function (err, resp1) {
                        if (err)
                            throw err;

                        if (resp1.activate != "1") {

                            var transporter = nodemailer.createTransport('smtps://' + config.config.email + ':' + config.config.password_email + '@smtp.gmail.com');

                            // setup e-mail data with unicode symbols 
                            var mailOptions = {
                                from: '"Sense.City " <info@sense.city>', // sender address 
                                to: req.body.email, // list of receivers 
                                subject: ' Αποστολή κωδικού ενεργοποίησης ', // Subject line 
                                text: 'Κωδικός ενεργοποίησης :' + text_act, // plaintext body 
                                html: 'Κωδικός ενεργοποίησης :' + text_act // html body 
                            };

                            // send mail with defined transport object 
                            transporter.sendMail(mailOptions, function (error, info) {
                                if (error) {
                                    return console.log(error);
                                }
                                console.log('Message sent: ' + info.response);
                            });

                        }
                        // we have the updated user returned to us
                        res.send(resp1);

                    });
                } else {

                    var text_act = "";
                    var possible = "0123456789";

                    for (var i = 0; i < 4; i++)
                        text_act += possible.charAt(Math.floor(Math.random() * possible.length));

                    var entry_active_user = new act_User({
                        uuid: req.body.uuid,
                        name: req.body.name,
                        email: req.body.email,
                        mobile_num: req.body.mobile_num,
                        permission: { send_issues: req.body.permission.send_issues, communicate_with: { email: req.body.permission.communicate_with.email, sms: req.body.permission.communicate_with.sms } },
                        activate: text_act
                    });

                    entry_active_user.save(function (err1, resp) {
                        if (err1)
                            throw err1;
                        res.send(resp);
                        // create reusable transporter object using the default SMTP transport 
                        var transporter = nodemailer.createTransport('smtps://' + config.config.email + ':' + config.config.password_email + '@smtp.gmail.com');

                        // setup e-mail data with unicode symbols 
                        var mailOptions = {
                            from: '"Sense.City " <info@sense.city>', // sender address 
                            to: req.body.email, // list of receivers 
                            subject: ' Αποστολή κωδικού ενεργοποίησης ', // Subject line 
                            text: 'Κωδικός ενεργοποίησης :' + text_act, // plaintext body 
                            html: 'Κωδικός ενεργοποίησης :' + text_act // html body 
                        };

                        // send mail with defined transport object 
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                return console.log(error);
                            }
                            console.log('Message sent: ' + info.response);
                        });
                    });
                }
            }).sort({ "create_at": -1 }).limit(1);
        }
    }
});

router.get('/policy', function (req, res) {
    res.send({ "policy": "<div class=\"container text- center\" style=\"padding- top: 100px;\"><div class=\"call- to - action\"><h1 class=\"text- primary\" style=\"color:#808080;\">Όροι και Προϋποθέσεις</h1></div><div class=\"row\" style=\"margin- left:0px;margin-right:0px; padding-top:50px; \"><div class=\"col- lg - 10 col-lg - offset - 1\"><div class=\"row\" style=\"margin- left:0px;margin-right:0px; \"><h2 style=\"color:#808080;text-align:left\">Εισαγωγή</h2><p style=\"color: #808080;text-align:justify\">Το λογισμικό SenseCity αποτελεί ένα ολοκληρωμένο πληροφοριακό σύστημα όπου οι χρήστες αποστέλλουν ηλεκτρονικά πληροφορίες σε ένα διακομιστή (server). Οι χρήστες έχουν ταυτοποιηθεί μέσω του κινητού τηλεφώνου ή το email τους και αποδέχονται κάθε φορά να στείλουν τα δεδομένα όπως όνομα, email &amp; αριθμό τηλεφώνου τους. Επίσης περιλαμβάνονται πληροφορίες δεδομένα γεωτοποθεσίας, φωτογραφικό υλικό και αλφαριθμητικά δεδομένα (κείμενο) . Ο διακομιστής συλλέγει αυτά τα δεδομένα και τα διατηρεί με ασφάλεια. Πρόσβαση παρέχεται σε πιστοποιημένο προσωπικό της εταιρίας καθώς και σε νομικά πρόσωπα (ΟΤΑ) που ως πιστοποιημένοι χρήστες έχουν αποδεχτεί του όρους χρήσης με την χρήση της πλατφόρμας.Ειδικό πληροφοριακό υποσύστημα (διαχειριστικό σύστημα) παρέχει πρόσβαση μέσω σύνδεσης στο διαδίκτυο στα δεδομένα που αποθηκεύει ο διακομιστής. Πρόσβαση έχουν Νομικά Πρόσωπα Δημοσίου Δικαίου και εξουσιοδοτημένοι εκπρόσωποι τους . ΝΠΔΔ δύναται να αποτελούν Δήμοι, Δημοτικές Επιχειρήσεις, Υπουργεία κ.α. </p><h2 style=\"color: #808080;text-align:left\">Πολιτική Προστασίας Προσωπικών Δεδομένων</h2><p style=\"color: #808080;text-align:justify\">Σκοπός της παρούσας Πολιτικής Προστασίας Προσωπικών Δεδομένων είναι να περιγραφεί η διαχείριση της παρούσας ιστοσελίδας και διαδικτυακών εφαρμογών φορητών συσκευών (mobile applications) με την εμπορική ονομασία SenseCity που ανήκει στην Ομάδα Αρχιτεκτονικής και Διαχείρισης Δικτύων του Τμ. ΗΜΤΥ του Παν. Πατρών (Η Εταιρία) αναφορικά με την αποθήκευση και επεξεργασία των προσωπικών δεδομένων των χρηστών της ιστοσελίδας και των εφαρμογών φορητών συσκευών. Η εταιρία εγγυάται το απόρρητο και την ασφάλεια των προσωπικών δεδομένων των χρηστών σύμφωνα με τους νόμους 2471/1997 και 3471/2006 όπως ισχύουν τροποποιημένοι.</p><h2 style=\"color: #808080;text-align:left\">Δεδομένα Πλοήγησης</h2><p style=\"color: #808080;text-align:justify\">Κατά τη διάρκεια της κανονικής λειτουργίας της παρούσας ιστοσελίδας και των εφαρμογών φορητών συσκευών το λογισμικό που χρησιμοποιείται για την ομαλή λειτουργία των συστημάτων και υποσυστημάτων του SenseCity συλλέγουν δεδομένα που αφορούν τα κάτωθι: τύπο φυλλομετρητή, λειτουργικό σύστημα, όνομα ιστοτόπου από τον οποίο εισήλθαν στην παρούσα ιστοσελίδα, πληροφορίες για τις σελίδες που επισκέπτεται ο χρήστης εντός του παρούσας ιστοσελίδας, η ώρα πρόσβασης, ο χρόνος πλοήγησης, η γλώσσα πλοήγησης. Τα δεδομένα αυτά συλλέγονται ανώνυμα με σκοπό την βελτίωση της ποιότητας και χρηστικότητας της υπηρεσίας και την συλλογή στατιστικών πληροφοριών που αφορούν την χρήση της υπηρεσίας.</p><h2 style=\"color: #808080;text-align:left\">Δεδομένα Γεωγραφικής Θέσης</h2><p style=\"color: #808080;text-align:justify\">Με τη συναίνεση του χρήστη η υπηρεσία (ιστοσελίδα-κινητές εφαρμογές) δύναται να επεξεργάζεται δεδομένα γεωγραφικής θέσης με μη συνεχόμενο τρόπο ώστε να παρέχει τις υπηρεσίες που ζητάει ο χρήστης.</p><h2 style=\"color: #808080;text-align:left\">Ασφάλεια Δεδομένων</h2><p style=\"color: #808080;text-align:justify\">H&nbsp;Εταιρία προστατεύει αυστηρά την ασφάλεια των προσωπικών δεδομένων και τις επιλογές των υποκειμένων των δεδομένων για την προοριζόμενη χρήση τους. Χρησιμοποιεί σύγχρονα τεχνολογικά και βιομηχανικά πρότυπα για την τήρηση της εμπιστευτικότητας και της ακρίβειας των πληροφοριών που της παρέχονται. Ωστόσο, το Διαδίκτυο δεν είναι ένα ασφαλές μέσο, έτσι ώστε η Εταιρία να μπορεί να εγγυηθεί ότι οι πληροφορίες, που υποβάλλονται σε αυτή θα είναι απαλλαγμένες από μη εξουσιοδοτημένη παρεμβολή τρίτων.</p><h2 style=\"color: #808080;text-align:left\">Κανόνες Επεξεργασίας Δεδομένων</h2><p style=\"color: #808080;text-align:justify\">Η επεξεργασία&nbsp; δεδομένων εκτελείται μέσω αυτοματοποιημένων μέσων (ήτοι χρησιμοποιώντας ηλεκτρονικές διαδικασίες) και / ή χειροκίνητα (ήτοι εγγράφως) για το χρόνο που απαιτείται ώστε να επιτευχθούν οι σκοποί για τους οποίους τα δεδομένα έχουν συλλεχθεί και σύμφωνα με την ισχύουσα νομοθεσία για τα προσωπικά δεδομένα.</p><h2 style=\"color: #808080;text-align:left\">Χρήση Δεδομένων από τους Δήμους</h2><p style=\"color: #808080;text-align:justify\">Ο Δήμος σύμφωνα και την σχετική σύμβαση που υπογράφει με την Εταιρία, επιτρέπεται σύμφωνα με το Άρθρο 20 του ν. &nbsp;3979/2011 να προβαίνει στη στατιστική επεξεργασία των δεδομένων που θα συλλέγει από τους χρήστες των εφαρμογών κινητών συσκευών που καταχωρούν αναφορές στο χωρικό πλαίσιο δράσης και ευθύνης του. Η συλλογή και επεξεργασία των δεδομένων από την πλευρά του Δήμου τελείται με σεβασμό του δικαιώματος προστασίας δεδομένων προσωπικού χαρακτήρα και της ιδιωτικότητας των φυσικών προσώπων σύμφωνα με το άρθρο 7 του ν. &nbsp;3979/2011 παρ. 1. Απαγορεύεται ρητά η λήψη, αποθήκευση, μεταβίβαση, αποστολή και αναπαραγωγή οπτικοακουστικών μηνυμάτων ή εγγράφων, που περιέχουν ευαίσθητα δεδομένα προσωπικού χαρακτήρα, σύμφωνα με τις διατάξεις της κείμενης νομοθεσίας για την προστασία ατόμων από την επεξεργασία δεδομένων προσωπικού χαρακτήρα.</p> <h2 style=\"color: #808080;text-align:left\">Αλλαγές Πολιτικής και Όρων</h2><p style=\"color: #808080;text-align:justify\">Οι παρόντες όροι διέπουν τις μεθόδους για την επεξεργασία προσωπικών δεδομένων που παρέχονται από τους χρήστες/ επισκέπτες κατά την πλοήγηση στην ιστοσελίδα μας και τις εφαρμογές φορητών συσκευών. Αυτές οι μέθοδοι μπορεί να χρειαστεί να τροποποιηθούν, ως αποτέλεσμα νέων νόμων που εισέρχονται σε ισχύ ή μετά από εξέταση και ενημέρωση των υπηρεσιών Χρήστη. Ως εκ τούτου, οι όροι μπορεί να τροποποιηθούν με την πάροδο του χρόνου και προτρέπουμε τους επισκέπτες να συμβουλεύονται περιοδικά αυτή τη σελίδα.</p><h2 style=\"color: #808080;text-align:left\">Δήλωση Αποδοχής Όρων Χρήσης Λογισμικού SenseCity</h2><p style=\"color: #808080;text-align:justify\">Ο χρήστης της υπηρεσίας SenseCity δηλώνει τη συγκατάθεσή τους στους παραπάνω όρους χρήσης και ειδικότερα συμφωνεί: Ότι χρησιμοποιεί την υπηρεσία SenseCity με σκοπό να αποστέλλει δεδομένα σχετικά με τη διαχείριση προβλημάτων αρμοδιότητας του Δήμου του. Ότι γνωρίζει πως ο Δήμος επιτρέπεται σύμφωνα με το Άρθρο 20 του ν. &nbsp;3979/2011 να προβαίνει στη στατιστική επεξεργασία των δεδομένων που θα συλλέγει με σεβασμό του δικαιώματος προστασίας δεδομένων προσωπικού χαρακτήρα και της ιδιωτικότητας των φυσικών προσώπων. Ότι η φωτογράφηση, η κατηγοριοποίηση, ο σχολιασμός και η αποστολή συντεταγμένων εκ μέρους του θα γίνεται, λαμβάνοντας υπόψη το δικαίωμα προστασίας των προσωπικών δεδομένων και την ανάγκη να διασφαλίζεται η επεξεργασία όσο το δυνατόν λιγότερων δεδομένων προσωπικού χαρακτήρα.</p></div></div></div></div>" });
});

router.get('/bugidtoalias/:id', function (req, res) {
    var bugParams1 = "?f1=bug_id&o1=equals&v1=" + req.params.id + "&include_fields=id,alias,product";

    request({
        url: bugUrlRest + "/rest/bug" + bugParams1,
        method: "GET"
    }, function (error, response, body) {
        //console.log(body);
        res.send(body);
    });

});

router.get('/active_users', function (req, res) {


    act_User.find({ "uuid": req.query.uuid }, function (error, actice_user) {
        //console.log(actice_user);
        res.send(actice_user);

    }).sort({ "create_at": -1 }).limit(1);




});

router.post('/activate_users', function (req, res) {

    act_User.findOneAndUpdate({ "_id": req.body.id1, "uuid": req.body.id2, "activate": req.body.id3 }, {
        "activate": "1"
    }, function (error, activate_user) {

        console.log(error);
        res.send(activate_user);
    });

});

router.post('/admin/bugs/search', authorize, function (req, res) {
    request({
        url: bugUrlRest + "/rest/bug?" + querystring.stringify(req.body),
        method: "GET"
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {

            if (response.body.result !== null) {
                res.send(JSON.parse(body).bugs);
            } else {
                res.send([response.body.error]);
            }

        }
    });
});

router.post('/admin/bugs/update', authorize, function (req, res) {

    //req.body.ids[0]
    //req.headers['x-uuid']
    /*
    User.find({ uuid: req.headers['x-uuid'] }, { "departments": 1, "city": 1 }, function (err1, res1) {

        request({
            url: bugUrlRest + "/rest/bug/" + req.body.ids[0],
            method: "GET",
            json: req.body
        }, function (error, response, body) {
            //body.bugs[0].component
            //body.bugs[0].product
            request({
                url: bugUrlRest + "/rest/product?names=" + req.body.ids[0],
                method: "GET",
                json: req.body
            }, function (error1, response1, body1) {
                for (var t = 0; t < body1.product[0].components.length; t++) {

                    if (body1.product[0].components[t].name == body.bugs[0].component) {
                        if (req.body.ids.indexOf(body1.product[0].components[t].id) != -1) {

                        } else {

                        }
                    }
                }
            });
        });

    });*/


    req.body.token = bugToken;
    if (req.body.cf_city_address == undefined) {
        req.body.cf_city_address = "";
    }
    request({
        url: bugUrlRest + "/rest/bug/" + req.body.ids[0],
        method: "PUT",
        json: req.body
    }, function (error, response, body) {

        if (error) { console.log(error); }

        console.log("/admin/bugs/update : request(/rest/bug/)");
        var lat = req.body.lat; //JSON.parse(response.body).results[0].geometry.location.lat;
        var lng = req.body.lng; //JSON.parse(response.body).results[0].geometry.location.lng;        
        if (body.bugs != undefined && body.bugs.length != 0) {
            var object_id = body.bugs[0].alias[0];
            Issue.update({ "_id": body.bugs[0].alias[0] }, { $set: { "loc": { "type": "Point", "coordinates": [lng, lat] }, "city_address": req.body.cf_city_address } }, function (err, resp) {
                console.log("/admin/bugs/update : Issue.update()");
                if (error) { res.send([err]); } else {
                    res.send(["ok"]);
                }
            });
        } else {
            res.status(400).send('Bad Request');
        }
    });
});

router.post('/admin/bugs/comment', authorize, function (req, res) {
    req.body.token = bugToken;
    request({
        url: bugUrlRest + "/rest/bug/" + req.body.id + " /comment",
        method: "GET"
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            if (response.body.result !== null) {
                res.send(JSON.parse(body));
            } else {
                res.send([response.body.error]);
            }
        }
    });
});

router.post('/admin/bugs/comment/add', authorize, function (req, res) {
    req.body.token = bugToken;

    request({
        url: bugUrlRest + "/rest/bug/" + req.body.id + " /comment",
        method: "POST",
        json: req.body
    }, function (error, response, body) {

        console.log("/admin/bugs/comment/add : request(/rest/bug/-id-/comment)");
        if (body.id != undefined) {
            var bugParams1 = "?f1=bug_id&o1=equals&v1=" + req.body.id + "&include_fields=alias,status,product,cf_mobile,cf_cc_mobile";
            request({
                url: bugUrlRest + "/rest/bug" + bugParams1,
                method: "GET"
            }, function (error, response, body) {
                var _status_field = ' ';
                if (JSON.parse(body).bugs[0].status == "IN_PROGRESS") {
                    _status_field = ' ΕΙΝΑΙ ΣΕ ΕΞΕΛΙΞΗ';
                }
                else if (JSON.parse(body).bugs[0].status == "RESOLVED") {
                    _status_field = ' ΟΛΟΚΛΗΡΩΘΗΚΕ';
                }
                Municipality.find({ "municipality": JSON.parse(body).bugs[0].product }, { "sms_key_fibair": 1 }, function (req11, res11) {
                    var mob_sms_key_fibair_base64 = new Buffer(res11[0].sms_key_fibair + ":").toString("base64");
                    if (mob_sms_key_fibair_base64 != undefined) {
                        if (mob_sms_key_fibair_base64 != '') {
                            console.log("send sms (add comment)");
                            request({
                                url: "https://api.theansr.com/v1/sms",
                                method: "POST",
                                form: { 'sender': JSON.parse(body).bugs[0].product, 'recipients': '30' + JSON.parse(body).bugs[0].cf_mobile, 'body': JSON.parse(body).bugs[0].product + '.sense.city! ΤΟ ΑΙΤΗΜΑ ΣΑΣ ΜΕ ΚΩΔΙΚΟ ' + req.body.id + _status_field + '. ΛΕΠΤΟΜΕΡΕΙΕΣ: https://' + JSON.parse(body).bugs[0].product + '.sense.city/bug/' + req.body.id },
                                headers: { "Authorization": 'Basic ' + mob_sms_key_fibair_base64, 'content-type': 'application/form-data' }
                            }, function (err, response) {
                                console.log("SMS Sends");
                            });
                            if (JSON.parse(body).bugs[0].cf_cc_mobile != '') {
                                var mobile_array = JSON.parse(body).bugs[0].cf_cc_mobile.split(",");
                                for (var j = 0; j < mobile_array.length; j++) {
                                    console.log("send sms list (add comment)");
                                    request({
                                        url: "https://api.theansr.com/v1/sms",
                                        method: "POST",
                                        form: { 'sender': JSON.parse(body).bugs[0].product, 'recipients': '30' + mobile_array[j], 'body': JSON.parse(body).bugs[0].product + '.sense.city! ΤΟ ΑΙΤΗΜΑ ΣΑΣ ΜΕ ΚΩΔΙΚΟ ' + req.body.id + _status_field + '. ΛΕΠΤΟΜΕΡΕΙΕΣ: https://' + JSON.parse(body).bugs[0].product + '.sense.city/bug/' + req.body.id },
                                        headers: { "Authorization": 'Basic ' + mob_sms_key_fibair_base64, 'content-type': 'application/form-data' }
                                    }, function (err, response) {
                                        console.log("SMS's Sends");
                                    });
                                }
                            }
                        }
                    }
                });
            });
            if (!error && response.statusCode === 201) {
                if (response.body.result !== null) {
                    res.send(body);
                } else {
                    res.send([response.body.error]);
                }
            }
        } else {
            res.status(400).send('Bad Request');
        }
    });
});


var gm = require("gm").subClass({ imageMagick: true });

router.post('/admin/bugs/comment/tags', authorize, function (req, res) {

    var bug_param = { "add": ["STATUS:" + req.query.status, "DEPARTMENT:" + req.query.component], "id": req.query.comment_id, "token": bugToken };

    request({
        url: bugUrlRest + "/rest/bug/comment/" + req.query.comment_id + "/tags",
        method: "PUT",
        json: bug_param
    }, function (error, response, body) {

        var flag_email_doesnot_exist = false;

        if (req.query.bug_id == undefined || req.query.bug_id <= 0) {
            res.status(400).send('Bad Request');
        } else {


            var form = new formidable.IncomingForm();
            console.log(form);
            form.multiples = true;
            form.uploadDir = path.join(config.config.minio_temp_folder);


            form.on('file', function (field, file) {
                var timestamp_ = (new Date).getTime();

                var fileStream = fs.createReadStream(file.path);

                fs.readFile(file.path, function (err, data) {
                    if (err) throw err;
                    if ((file.type).indexOf("image") !== -1) {
                        //image                                            
                        var split_type = (file.type).split("/");
                        var fileStat = fs.stat(file.path, function (err, stats) {
                            minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '.' + split_type[1], fileStream, stats.size, function (err, etag) {

                                return console.log(err, etag) // err should be null
                            });
                        });

                        gm(data).resize(120, 120).toBuffer('PNG', function (err, buffer) {
                            var fileStat = fs.stat(file.path, function (err, stats) {
                                minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '_thumb.' + split_type[1], buffer, stats.size, function (err, etag) {

                                    request({
                                        url: bugUrlRest + "/rest/bug/comment/" + req.query.comment_id + "/tags",
                                        method: "PUT",
                                        json: { "add": ["filetype:" + file.type, "filename:" + req.query.bug_id + '_' + timestamp_ + '.' + split_type[1]], "id": req.query.comment_id, "token": bugToken }
                                    }, function (error4, response4, body4) {
                                        console.log(error4);
                                        console.log("/issue/:id -> /rest/bug/comment/id/tags");
                                    });

                                    return console.log(err, etag) // err should be null
                                });
                            });
                        });

                        /*
                        lwip.open(data, split_type[1], function (err, image) {
                            image.scale(0.2, function (err, image) {
                                image.toBuffer(split_type[1], function (err, buffer) {
                                    var fileStat = fs.stat(file.path, function (err, stats) {
                                        minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '_thumb.' + split_type[1], buffer, stats.size, function (err, etag) {

                                            request({
                                                url: bugUrlRest + "/rest/bug/comment/" + req.query.comment_id + "/tags",
                                                method: "PUT",
                                                json: { "add": ["filetype:" + file.type, "filename:" + req.query.bug_id + '_' + timestamp_ + '.' + split_type[1]], "id": req.query.comment_id, "token": bugToken }
                                            }, function (error4, response4, body4) {
                                                console.log(error4);
                                                console.log("/issue/:id -> /rest/bug/comment/id/tags");
                                            });

                                            return console.log(err, etag) // err should be null
                                        });
                                    });
                                });
                            });
                        });*/
                    } else {
                        var split_name = (file.name).split('.');
                        var fileStat = fs.stat(file.path, function (err, stats) {
                            minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '.' + split_name[(split_name.length - 1)], fileStream, stats.size, function (err, etag) {

                                request({
                                    url: bugUrlRest + "/rest/bug/comment/" + req.query.comment_id + "/tags",
                                    method: "PUT",
                                    json: { "add": ["filetype:" + file.type, "filename:" + req.query.bug_id + '_' + timestamp_ + '.' + split_name[(split_name.length - 1)]], "id": req.query.comment_id, "token": bugToken }
                                }, function (error4, response4, body4) {
                                    console.log("/issue/:id -> /rest/bug/comment/id/tags");
                                });

                                return console.log(err, etag); // err should be null
                            });
                        });

                    }

                });

            });
            // log any errors that occur
            form.on('error', function (err) {
                console.log('An error has occured: \n' + err);
            });

            // once all the files have been uploaded, send a response to the client
            form.on('end', function () {
                res.send('success');
            });

            // parse the incoming request containing the form data
            form.parse(req);
        }
    });
});

router.post('/dashboard', function (req, res) {

    var uuid = '';

    var currentdate1 = new Date();
    if (req.body.username != '' && req.body.password != '') {
        var currentdate = currentdate1.toString();
        var buffer = new Buffer(req.body.username + req.body.password + currentdate);
        var toBase64 = buffer.toString('base64');

        uuid = toBase64;

        Role.findOneAndUpdate({ "username": req.body.username, "password": req.body.password, "city": req.body.city }, { $set: { "uuid": uuid, "timestamp": Date.now() * 1000 * 3600 } }, { "new": true }, function (err, doc) {
            if (err)
                console.log(err);

            if (doc != null) {
                res.send([doc]);
            } else {
                res.send("failure");
            }
        });
    } else {
        res.send("failure");
    }
});

router.get('/get', authentication, function (req, res) {
    res.send("success");
});

router.get('/logout', authentication, function (req, res) {
    Role.update({ uuid: req.get('x-uuid') }, { $unset: { "uuid": 1, "timestamp": 1 } }, function (err, response) {
        res.send("logout");
    });
});

function is_authenticate(req, res) {
    if (req.uuid != undefined && req.role != undefined) {
        Role.find({ "uuid": req.uuid, "role": req.role }, function (request, response) {
        });
    }
    return true;
}


// Subscribe citizen to issue
router.post('/issue_subscribe', function (req, res) {

    if (req.body.bug_id != undefined && req.body.email != undefined && req.body.mobile_num != undefined) {
        if (req.body.bug_id != '' && (req.body.email != '' || req.body.mobile_num != '')) {
            var bugParams1 = "?f1=bug_id&o1=equals&v1=" + req.body.bug_id + "&include_fields=cf_email,cf_mobile,product,cf_cc_mobile,cf_cc_name,cc,cf_creator,status";
            request({
                url: bugUrlRest + "/rest/bug" + bugParams1,
                method: "GET"
            }, function (error, response, body) {
                console.log("/issue_subscribe : /rest/bug ");

                var eeeee = JSON.parse(body).bugs[0].cc;
                var req_comment = "undefined";

                if (eeeee.indexOf(req.body.email) == -1) {
                    if (req.body.comment == "" || req.body.comment == undefined) {
                        req_comment = "Προστέθηκε νέος χρήστης";
                    } else {
                        req_comment = "Προστέθηκε νέος χρήστης και σχολίασε : " + req.body.comment;
                    }
                } else {
                    console.log("Yπάρχει");
                    if (req.body.comment != "" && req.body.comment != "undefined") {
                        req_comment = req.body.comment;
                    }
                }
                if (JSON.parse(body).bugs[0].cf_email != req.body.email) {
                    for (var i = 0; i < JSON.parse(body).bugs[0].cc.length; i++) {
                        if (JSON.parse(body).bugs[0].cc[i] != req.body.email) {
                            var bodyParams_add = { "token": bugToken, "ids": [req.body.bug_id], "cc": { "add": [req.body.email] } };
                            request({
                                url: bugUrlRest + "/rest/bug/" + req.body.bug_id,
                                method: "PUT",
                                json: bodyParams_add
                            }, function (error1, response1, body1) {
                                console.log("/issue_subscribe : /rest/bug/bug_id ");
                            });
                        }
                    }
                }

                if (JSON.parse(body).bugs[0].cf_mobile != req.body.mobile_num) {
                    if (JSON.parse(body).bugs[0].cf_cc_mobile != req.body.mobile_num) {
                        if (JSON.parse(body).bugs[0].cf_cc_mobile != "") {
                            var mobile_cc = JSON.parse(body).bugs[0].cf_cc_mobile;
                            if (mobile_cc.indexOf(req.body.mobile_num) == -1) {
                                var bodyParams_add_2 = { "token": bugToken, "ids": [req.body.bug_id], "cf_cc_mobile": (JSON.parse(response.body).bugs[0].cf_cc_mobile + "," + req.body.mobile_num) };
                                request({
                                    url: bugUrlRest + "/rest/bug/" + req.body.bug_id,
                                    method: "PUT",
                                    json: bodyParams_add_2
                                }, function (error1, response1, body1) {
                                    console.log("add cf_cc_mobile 1");
                                });
                            }
                        } else {
                            var bodyParams_add_2 = { "token": bugToken, "ids": [req.body.bug_id], "cf_cc_mobile": req.body.mobile_num };
                            request({
                                url: bugUrlRest + "/rest/bug/" + req.body.bug_id,
                                method: "PUT",
                                json: bodyParams_add_2
                            }, function (error1, response1, body1) {
                                console.log("add cf_cc_mobile 2");
                            });
                        }
                    }
                }

                if (JSON.parse(body).bugs[0].cf_creator != req.body.name) {
                    if (JSON.parse(body).bugs[0].cf_cc_name != req.body.name) {
                        if (JSON.parse(body).bugs[0].cf_cc_name != "") {
                            var name_cc = JSON.parse(body).bugs[0].cf_cc_name;
                            if (name_cc.indexOf(req.body.name) == -1) {
                                var bodyParams_add_2 = { "token": bugToken, "ids": [req.body.bug_id], "cf_cc_name": (JSON.parse(response.body).bugs[0].cf_cc_name + "," + req.body.name) };
                                request({
                                    url: bugUrlRest + "/rest/bug/" + req.body.bug_id,
                                    method: "PUT",
                                    json: bodyParams_add_2
                                }, function (error1, response1, body1) {
                                    console.log("add cf_cc_name 1");
                                });
                            }
                        } else {
                            var bodyParams_add_2 = { "token": bugToken, "ids": [req.body.bug_id], "cf_cc_name": req.body.name };
                            request({
                                url: bugUrlRest + "/rest/bug/" + req.body.bug_id,
                                method: "PUT",
                                json: bodyParams_add_2
                            }, function (error1, response1, body1) {
                                console.log("add cf_cc_name 2");
                            });
                        }
                    }
                }

                var bugComment1 = { "token": bugToken, "id": req.body.bug_id, "comment": String(req_comment) };

                request({
                    url: bugUrlRest + "/rest/bug/" + req.body.bug_id + "/comment",
                    method: "POST",
                    json: bugComment1
                }, function (error2, bugResponse2, body2) {

                    if (req.body.name != undefined) {
                        tag_name = "name:" + req.body.name;
                    } else {
                        tag_name = "name:undefined";
                    }
                    if (req.body.email != undefined) {
                        tag_email = "email:" + req.body.email;
                    } else {
                        tag_email = "email:undefined";
                    }
                    if (req.body.mobile_num != undefined) {
                        tag_mobile = "mobile:" + req.body.mobile_num;
                    } else {
                        tag_mobile = "mobile:undefined";
                    }
                    var new_user = "action:user-existed";
                    var register_user = JSON.parse(body).bugs[0].cc;

                    if (register_user.indexOf(req.body.email) == -1) {
                        new_user = "action:new-user";
                    }
                    //}

                    var json_data = { "add": [tag_name, tag_email, tag_mobile, new_user], "id": bugResponse2.body.id, "token": bugToken };

                    request({
                        url: bugUrlRest + "/rest/bug/comment/" + bugResponse2.body.id + "/tags",
                        method: "PUT",
                        json: json_data
                    }, function (error4, response4, body4) {

                        var _status_gr = ' ΑΛΛΑΞΕ';


                        Municipality.find({ "municipality": JSON.parse(body).bugs[0].product }, { "sms_key_fibair": 1 }, function (req11, res11) {
                            var mob_sms_key_fibair_base64 = new Buffer(res11[0].sms_key_fibair + ":").toString("base64");
                            if (mob_sms_key_fibair_base64 != undefined) {
                                if (mob_sms_key_fibair_base64 != '') {
                                    //elegxos gia apostoli sms
                                    if (JSON.parse(body).bugs[0].cf_mobile != '') {
                                        //send sms
                                        sendsms_function(JSON.parse(body).bugs[0].cf_mobile, JSON.parse(body).bugs[0].product, _status_gr, req.body.bug_id, mob_sms_key_fibair_base64, function (send_sms) {
                                            console.log(send_sms);
                                        });
                                    }
                                    var bugParams3 = "?f1=bug_id&o1=equals&v1=" + req.body.bug_id + "&include_fields=cf_cc_mobile";
                                    request({
                                        url: bugUrlRest + "/rest/bug" + bugParams3,
                                        method: "GET"
                                    }, function (error3, response3, body3) {
                                        if (JSON.parse(body3).bugs[0].cf_cc_mobile != '') {
                                            var str = JSON.parse(body3).bugs[0].cf_cc_mobile;
                                            var mobile_ = str.split(",");

                                            for (var j = 0; j < mobile_.length; j++) {
                                                sendsms_function(mobile_[j], JSON.parse(body).bugs[0].product, _status_gr, req.body.bug_id, mob_sms_key_fibair_base64, function (send_sms) {
                                                    console.log(send_sms);
                                                });
                                            }

                                        }
                                    });
                                    res.send({ "message": "OK" });
                                } else {
                                    res.send({ "message": "SMS doesn't supported" });
                                }
                            } else {
                                res.send({ "message": "SMS doesn't supported" });
                            }
                        });
                    });
                });
            });
        } else {
            res.status(400).send({ "message": "Bad Request" });
        }
    } else {
        res.status(400).send({ "message": "Bad Request" });
    }
});



/* issue_register test */


router.post('/issue_register', function (req, res) {

    if (req.query.bug_id != undefined && req.query.email != undefined && req.query.mobile_num != undefined) {
        console.log("1=>");
        var bugParams1 = "?f1=bug_id&o1=equals&v1=" + req.query.bug_id + "&include_fields=cf_email,cf_mobile,product,cf_cc_mobile,cf_cc_name,cc,cf_creator,status";
        request({
            url: bugUrlRest + "/rest/bug" + bugParams1,
            method: "GET"
        }, function (error, response, body) {
            var bodyBug = JSON.parse(body).bugs;

            console.log(bodyBug);

            var cf_email = bodyBug[0].cf_email;
            var cf_mobile = bodyBug[0].cf_mobile;
            var product = bodyBug[0].product;
            console.log("");
            console.log(bodyBug[0].cf_cc_mobile);
            console.log("");
            var cf_cc_mobile = bodyBug[0].cf_cc_mobile;
            var cf_cc_name = bodyBug[0].cf_cc_name;
            var cc = bodyBug[0].cc;
            var cf_creator = bodyBug[0].cf_creator;
            var status = bodyBug[0].status;

            Municipality.find({ "municipality": product }, { "sms_key_fibair": 1, "mandatory_email": 1, "mandatory_sms": 1 }, function (req11, res11) {
                console.log(res11);
                var sms_key_fibair = res11[0].sms_key_fibair;

                if (((res11[0].mandatory_email == 'true') && req.query.email == '') || ((res11[0].mandatory_sms == 'true') && req.query.mobile_num == '')) {
                    res.status(400).send('Bad Request');
                    //} else if ((res11[0].mandatory_sms) && req.query.mobile_num == '') {
                    //    res.status(400).send('Bad Request');
                } else {



                    console.log("");
                    console.log(cf_cc_mobile);
                    console.log("");

                    if (req.query.bug_id != '' && (req.query.email != '' || req.query.mobile_num != '')) {

                        ///* Create user acount to bugzilla			
                        var bugCreateuser1 = { "token": bugToken, "email": req.query.email };

                        request({
                            url: bugUrlRest + "/rest/user",
                            method: "POST",
                            json: bugCreateuser1
                        }, function (errorUser, responseUser, bodyUser) {
                            if (error) {
                                console.log("/issue/:id -> User doesnot created! Error : " + error);
                                return false;
                            }
                            console.log("/issue/:id -> User Created/already exist at bugzilla");


                            /*
                            var bugParams1 = "?f1=bug_id&o1=equals&v1=" + req.query.bug_id + "&include_fields=cf_email,cf_mobile,product,cf_cc_mobile,cf_cc_name,cc,cf_creator,status";
                            request({
                                url: bugUrlRest + "/rest/bug" + bugParams1,
                                method: "GET"
                            }, function (error, response, body) {
                                console.log("/issue_subscribe : /rest/bug ");*/

                            //var eeeee = JSON.parse(body).bugs[0].cc;
                            var req_comment = "undefined";
                            if (cc.indexOf(req.query.email) == -1) {
                                if (req.query.comment == "" || req.query.comment == undefined) {
                                    req_comment = "Προστέθηκε νέος χρήστης";
                                } else {
                                    req_comment = "Προστέθηκε νέος χρήστης και σχολίασε : " + req.query.comment;
                                }
                            } else {
                                if (req.query.comment != "" && req.query.comment != "undefined") {
                                    req_comment = req.query.comment;
                                }
                            }

                            /* Insert email in cc list */
                            if (cf_email != req.query.email) {
                                for (var i = 0; i < cc.length; i++) {
                                    if (cc[i] != req.query.email) {
                                        var bodyParams_add = { "token": bugToken, "ids": [req.query.bug_id], "cc": { "add": [req.query.email] } };
                                        request({
                                            url: bugUrlRest + "/rest/bug/" + req.body.bug_id,
                                            method: "PUT",
                                            json: bodyParams_add
                                        }, function (error1, response1, body1) {
                                            console.log("/issue_subscribe : /rest/bug/bug_id ");
                                        });
                                    }
                                }
                            }
                            if (cf_mobile != req.query.mobile_num) {
                                if (cf_cc_mobile != req.query.mobile_num) {
                                    if (cf_cc_mobile != "") {
                                        //var mobile_cc = JSON.parse(body).bugs[0].cf_cc_mobile;
                                        if (cf_cc_mobile.indexOf(req.query.mobile_num) == -1) {
                                            var bodyParams_add_2 = { "token": bugToken, "ids": [req.query.bug_id], "cf_cc_mobile": (cf_cc_mobile + "," + req.query.mobile_num) };
                                            request({
                                                url: bugUrlRest + "/rest/bug/" + req.query.bug_id,
                                                method: "PUT",
                                                json: bodyParams_add_2
                                            }, function (error1, response1, body1) {
                                                console.log("add cf_cc_mobile 1");
                                            });
                                        }
                                    } else {
                                        var bodyParams_add_2 = { "token": bugToken, "ids": [req.query.bug_id], "cf_cc_mobile": req.query.mobile_num };
                                        request({
                                            url: bugUrlRest + "/rest/bug/" + req.query.bug_id,
                                            method: "PUT",
                                            json: bodyParams_add_2
                                        }, function (error1, response1, body1) {
                                            console.log("add cf_cc_mobile 2");
                                        });
                                    }
                                }
                            }
                            if (cf_creator != req.query.name) {
                                if (cf_cc_name != req.query.name) {
                                    if (cf_cc_name != "") {
                                        //var name_cc = JSON.parse(body).bugs[0].cf_cc_name;
                                        if (cf_cc_name.indexOf(req.query.name) == -1) {
                                            var bodyParams_add_2 = { "token": bugToken, "ids": [req.query.bug_id], "cf_cc_name": (cf_cc_name + "," + req.query.name) };
                                            request({
                                                url: bugUrlRest + "/rest/bug/" + req.query.bug_id,
                                                method: "PUT",
                                                json: bodyParams_add_2
                                            }, function (error1, response1, body1) {
                                                console.log("add cf_cc_name 1");
                                            });
                                        }
                                    } else {
                                        var bodyParams_add_2 = { "token": bugToken, "ids": [req.query.bug_id], "cf_cc_name": req.query.name };
                                        request({
                                            url: bugUrlRest + "/rest/bug/" + req.query.bug_id,
                                            method: "PUT",
                                            json: bodyParams_add_2
                                        }, function (error1, response1, body1) {
                                            console.log("add cf_cc_name 2");
                                        });
                                    }
                                }
                            }

                            var bugComment1 = { "token": bugToken, "id": req.query.bug_id, "comment": String(req_comment) };

                            request({
                                url: bugUrlRest + "/rest/bug/" + req.query.bug_id + "/comment",
                                method: "POST",
                                json: bugComment1
                            }, function (error2, bugResponse2, body2) {

                                if (req.query.name != undefined) {
                                    tag_name = "name:" + req.query.name;
                                } else {
                                    tag_name = "name:undefined";
                                }
                                if (req.query.email != undefined) {
                                    tag_email = "email:" + req.query.email;
                                } else {
                                    tag_email = "email:undefined";
                                }
                                if (req.query.mobile_num != undefined) {
                                    tag_mobile = "mobile:" + req.query.mobile_num;
                                } else {
                                    tag_mobile = "mobile:undefined";
                                }
                                var new_user = "action:user-existed";
                                var register_user = JSON.parse(body).bugs[0].cc;

                                if (register_user.indexOf(req.query.email) == -1) {
                                    new_user = "action:new-user";
                                }
                                //}
                                var json_data = { "add": [tag_name, tag_email, tag_mobile, new_user], "id": parseInt(bugResponse2.body.id), "token": bugToken };

                                request({
                                    url: bugUrlRest + "/rest/bug/comment/" + parseInt(bugResponse2.body.id) + "/tags",
                                    method: "PUT",
                                    json: json_data
                                }, function (error4, response4, body4) {

                                    var _status_gr = ' ΑΛΛΑΞΕ';
                                    //Municipality.find({ "municipality": JSON.parse(body).bugs[0].product }, { "sms_key_fibair": 1 }, function (req11, res11) {
                                    var mob_sms_key_fibair_base64 = new Buffer.from(sms_key_fibair + ":").toString("base64");

                                    if (mob_sms_key_fibair_base64 != undefined) {
                                        if (mob_sms_key_fibair_base64 != '') {
                                            //elegxos gia apostoli sms
                                            if (cf_mobile != '') {
                                                //send sms
                                                sendsms_function(cf_mobile, product, _status_gr, req.query.bug_id, mob_sms_key_fibair_base64, function (send_sms) {
                                                    console.log(send_sms);
                                                });
                                            }
                                            var bugParams3 = "?f1=bug_id&o1=equals&v1=" + req.query.bug_id + "&include_fields=cf_cc_mobile";
                                            request({
                                                url: bugUrlRest + "/rest/bug" + bugParams3,
                                                method: "GET"
                                            }, function (error3, response3, body3) {
                                                var body3bugs = JSON.parse(body3).bugs[0];
                                                if (body3bugs.cf_cc_mobile != '') {
                                                    var str = body3bugs.cf_cc_mobile;
                                                    var mobile_ = str.split(",");
                                                    //console.log(JSON.stringify(mobile_));

                                                    for (var j = 0; j < mobile_.length; j++) {
                                                        sendsms_function(mobile_[j], product, _status_gr, req.query.bug_id, mob_sms_key_fibair_base64, function (send_sms) {
                                                            console.log(send_sms);
                                                        });
                                                    }
                                                }
                                            });
                                        } else {
                                            console.log(["SMS isn't supported!!"]);
                                        }
                                    } else {
                                        console.log(["SMS isn't supported!"]);
                                    }
                                    //});

                                    //console.log(req);
                                    var flag_email_doesnot_exist = false;

                                    if (req.query.bug_id == undefined || req.query.bug_id <= 0) {
                                        res.status(400).send('Bad Request');
                                    } else if ((req.query.email == undefined || req.query.email == '') && (req.query.mobile_num == undefined || req.query.mobile_num == '')) {
                                        res.status(400).send('Bad Request');
                                    } else {
                                        var bugParams1 = "?bug_id=" + req.query.bug_id + "&include_fields=id,alias,cc,cf_cc_mobile";

                                        request({
                                            url: bugUrlRest + "/rest/bug" + bugParams1,
                                            method: "GET"
                                        }, function (error, response, body) {

                                            console.log(JSON.stringify(body));

                                            if (JSON.parse(body).bugs[0] != undefined) {



                                                var form = new formidable.IncomingForm();
                                                console.log("openedFiles===>" + form.openedFiles);

                                                    //if (form.openedFiles[0] != undefined) {

                                                    form.multiples = true;
                                                    form.uploadDir = path.join(config.config.minio_temp_folder);
                                                    
                                                for (var k = 0; k < JSON.parse(body).bugs[0].cc.length; k++) {
                                                        flag_email_doesnot_exist = true;
                                                        console.log("email=" + req.query.email);
                                                        console.log("cc[k]=" + cc[k]);
                                                        console.log("cf_cc_mobile=" + JSON.parse(body).bugs[0].cf_cc_mobile);
                                                        console.log("mobile_num=" + req.query.mobile_num);

                                                    if (JSON.parse(body).bugs[0].cc[k] == req.query.email ||  req.query.mobile_num != '' ) {

                                                            k = JSON.parse(body).bugs[0].cc.length;
                                                            console.log("k==" + k);
                                                            form.on('file', function (field, file) {

                                                                var timestamp_ = (new Date).getTime();

                                                                var fileStream = fs.createReadStream(file.path);

                                                                fs.readFile(file.path, function (err, data) {
                                                                    if (err) throw err;
                                                                    if ((file.type).indexOf("image") !== -1) {
                                                                        //image                    
                                                                        var split_type = (file.type).split("/");
                                                                        console.log("Files===>");
                                                                        var fileStat = fs.stat(file.path, function (err, stats) {
                                                                            minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '.' + split_type[1], fileStream, stats.size, function (err, etag) {

                                                                                return console.log(err, etag) // err should be null
                                                                            });
                                                                        });
                                                                        gm(data).resize(120, 120).toBuffer(split_type[1], function (errBuffer, buffer) {
                                                                            var fileStat = fs.stat(file.path, function (err, stats) {

                                                                                minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '_thumb.' + split_type[1], buffer, stats.size, function (err, etag) {

                                                                                    request({
                                                                                        url: bugUrlRest + "/rest/bug/comment/" + body2.id + "/tags",
                                                                                        method: "PUT",
                                                                                        json: { "add": ["filetype:" + file.type, "filename:" + req.query.bug_id + '_' + timestamp_ + '.' + split_type[1]], "id": body2.id, "token": bugToken }
                                                                                    }, function (error4, response4, body4) {

                                                                                    });

                                                                                    return console.log(err, etag) // err should be null
                                                                                });
                                                                            });
                                                                        });


                                                                    } else {
                                                                        var split_name = (file.name).split('.');

                                                                        var fileStat = fs.stat(file.path, function (err, stats) {
                                                                            minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '.' + split_name[(split_name.length - 1)], fileStream, stats.size, function (err, etag) {

                                                                                request({
                                                                                    url: bugUrlRest + "/rest/bug/comment/" + body2.id + "/tags",
                                                                                    method: "PUT",
                                                                                    json: { "add": ["filetype:" + file.type, "filename:" + req.query.bug_id + '_' + timestamp_ + '.' + split_name[(split_name.length - 1)]], "id": body2.id, "token": bugToken }
                                                                                }, function (error4, response4, body4) {
                                                                                    console.log("/issue/:id -> /rest/bug/comment/id/tags");
                                                                                });

                                                                                return console.log(err, etag); // err should be null
                                                                            });
                                                                        });

                                                                    }

                                                                });

                                                            });
                                                            // log any errors that occur
                                                            form.on('error', function (err) {
                                                                console.log('An error has occured: \n' + err);
                                                            });

                                                            // once all the files have been uploaded, send a response to the client
                                                            form.on('end', function () {
                                                                console.log("2=>>");
                                                                console.log(form);
                                                                res.send('success');
                                                            });

                                                            // parse the incoming request containing the form data
                                                            form.parse(req);
                                                        } else {
                                                            if (k == JSON.parse(body).bugs[0].cc.length) {
                                                                if (!flag_email_doesnot_exist) {
                                                                    res.status(400).send('Bad Request');
                                                                }
                                                            }
                                                        }
                                                    }

                                               // } else {
                                               //     res.send('success');
                                              //  }
                                            } else {
                                                res.status(400).send('Bad Request');
                                            }
                                        });
                                    }
                                });
                            });
                            //});
                        });
                    } else {
                        res.status(400).send('Bad Request');
                    }
                }
            });

        });
    } else {
        res.status(400).send('Bad Request');
    }
});

/* End issue_register */










/*
 
router.post('/issue_register_new', function (req, res) {

    if (req.query.bug_id != undefined && req.query.email != undefined && req.query.mobile_num != undefined) {
        console.log("1=>");
        var bugParams1 = "?f1=bug_id&o1=equals&v1=" + req.query.bug_id + "&include_fields=cf_email,cf_mobile,product,cf_cc_mobile,cf_cc_name,cc,cf_creator,status";


        rp({
            uri: bugUrlRest + "/rest/bug" + bugParams1,
            method: "GET"
        }).then(function (resp1) {
            console.log("1");
            console.log("resp1=>" + resp1);
            var bodyBug = JSON.parse(resp1).bugs;

            console.log(bodyBug);

            var cf_email = bodyBug[0].cf_email;
            var cf_mobile = bodyBug[0].cf_mobile;
            var product = bodyBug[0].product;
            console.log("");
            console.log(bodyBug[0].cf_cc_mobile);
            console.log("");
            var cf_cc_mobile = bodyBug[0].cf_cc_mobile;
            var cf_cc_name = bodyBug[0].cf_cc_name;
            var cc = bodyBug[0].cc;
            var cf_creator = bodyBug[0].cf_creator;
            var status = bodyBug[0].status;

            Municipality.find({ "municipality": product }, { "sms_key_fibair": 1, "mandatory_email": 1, "mandatory_sms": 1 }, function (req11, res11) {
                console.log(res11);
                var sms_key_fibair = res11[0].sms_key_fibair;

                if (((res11[0].mandatory_email == 'true') && req.query.email == '') || ((res11[0].mandatory_sms == 'true') && req.query.mobile_num == '')) {
                    res.status(400).send('Bad Request');
                    //} else if ((res11[0].mandatory_sms) && req.query.mobile_num == '') {
                    //    res.status(400).send('Bad Request');
                } else {



                    console.log("");
                    console.log(cf_cc_mobile);
                    console.log("");

                    if (req.query.bug_id != '' && (req.query.email != '' || req.query.mobile_num != '')) {


















                        var bugCreateuser1 = { "token": bugToken, "email": req.query.email };

                        rp({
                            uri: bugUrlRest + "/rest/user",
                            method: "POST",
                            json: bugCreateuser1
                        }).then(function (responseUser) {
                            console.log("2");
                            console.log("/issue/:id -> User Created/already exist at bugzilla");
                        }).catch(function (error1) {
                            if (error1) {
                                console.log("/issue/:id -> User is not created! Error : " + error1);
                                //return false;
                            }
                        });
                            var req_comment = "undefined";
                            if (cc.indexOf(req.query.email) == -1) {
                                if (req.query.comment == "" || req.query.comment == undefined) {
                                    req_comment = "Προστέθηκε νέος χρήστης";
                                } else {
                                    req_comment = "Προστέθηκε νέος χρήστης και σχολίασε : " + req.query.comment;
                                }
                            } else {
                                if (req.query.comment != "" && req.query.comment != "undefined") {
                                    req_comment = req.query.comment;
                                }
                            }

                            // Insert email in cc list
                            if (cf_email != req.query.email) {
                                for (var i = 0; i < cc.length; i++) {
                                    if (cc[i] != req.query.email) {
                                        var bodyParams_add = { "token": bugToken, "ids": [req.query.bug_id], "cc": { "add": [req.query.email] } };
                                        rp({
                                            uri: bugUrlRest + "/rest/bug/" + req.body.bug_id,
                                            method: "PUT",
                                            json: bodyParams_add
                                        }).then(function (response1) {
                                            console.log("3");
                                            console.log("/issue_subscribe : /rest/bug/bug_id ");
                                        });
                                    }
                                }
                            }
                            if (cf_mobile != req.query.mobile_num) {
                                if (cf_cc_mobile != req.query.mobile_num) {
                                    if (cf_cc_mobile != "") {
                                        //var mobile_cc = JSON.parse(body).bugs[0].cf_cc_mobile;
                                        if (cf_cc_mobile.indexOf(req.query.mobile_num) == -1) {
                                            var bodyParams_add_2 = { "token": bugToken, "ids": [req.query.bug_id], "cf_cc_mobile": (cf_cc_mobile + "," + req.query.mobile_num) };
                                            rp({
                                                uri: bugUrlRest + "/rest/bug/" + req.query.bug_id,
                                                method: "PUT",
                                                json: bodyParams_add_2
                                            }).then(function (response1) {
                                                console.log("add cf_cc_mobile 1");
                                            });
                                        }
                                    } else {
                                        var bodyParams_add_2 = { "token": bugToken, "ids": [req.query.bug_id], "cf_cc_mobile": req.query.mobile_num };
                                        rp({
                                            uri: bugUrlRest + "/rest/bug/" + req.query.bug_id,
                                            method: "PUT",
                                            json: bodyParams_add_2
                                        }).then(function (response1) {
                                            console.log("add cf_cc_mobile 2");
                                        });
                                    }
                                }
                            }
                            if (cf_creator != req.query.name) {
                                if (cf_cc_name != req.query.name) {
                                    if (cf_cc_name != "") {
                                        //var name_cc = JSON.parse(body).bugs[0].cf_cc_name;
                                        if (cf_cc_name.indexOf(req.query.name) == -1) {
                                            var bodyParams_add_2 = { "token": bugToken, "ids": [req.query.bug_id], "cf_cc_name": (cf_cc_name + "," + req.query.name) };
                                            rp({
                                                uri: bugUrlRest + "/rest/bug/" + req.query.bug_id,
                                                method: "PUT",
                                                json: bodyParams_add_2
                                            }).then(function (response1) {
                                                console.log("add cf_cc_name 1");
                                            });
                                        }
                                    } else {
                                        var bodyParams_add_2 = { "token": bugToken, "ids": [req.query.bug_id], "cf_cc_name": req.query.name };
                                        rp({
                                            uri: bugUrlRest + "/rest/bug/" + req.query.bug_id,
                                            method: "PUT",
                                            json: bodyParams_add_2
                                        }).then(function (response1) {
                                            console.log("add cf_cc_name 2");
                                        });
                                    }
                                }
                            }

                            var bugComment1 = { "token": bugToken, "id": req.query.bug_id, "comment": String(req_comment) };

                            rp({
                                uri: bugUrlRest + "/rest/bug/" + req.query.bug_id + "/comment",
                                method: "POST",
                                json: bugComment1
                            }).then(function (bugResponse2) {

                                if (req.query.name != undefined) {
                                    tag_name = "name:" + req.query.name;
                                } else {
                                    tag_name = "name:undefined";
                                }
                                if (req.query.email != undefined) {
                                    tag_email = "email:" + req.query.email;
                                } else {
                                    tag_email = "email:undefined";
                                }
                                if (req.query.mobile_num != undefined) {
                                    tag_mobile = "mobile:" + req.query.mobile_num;
                                } else {
                                    tag_mobile = "mobile:undefined";
                                }
                                var new_user = "action:user-existed";
                                var register_user = JSON.parse(resp1).bugs[0].cc;

                                if (register_user.indexOf(req.query.email) == -1) {
                                    new_user = "action:new-user";
                                }
                                //}
                                var json_data = { "add": [tag_name, tag_email, tag_mobile, new_user], "id": parseInt(bugResponse2.id), "token": bugToken };

                                rp({
                                    uri: bugUrlRest + "/rest/bug/comment/" + parseInt(bugResponse2.id) + "/tags",
                                    method: "PUT",
                                    json: json_data
                                }).then(function (response4) {

                                    var _status_gr = ' ΑΛΛΑΞΕ';
                                    //Municipality.find({ "municipality": JSON.parse(body).bugs[0].product }, { "sms_key_fibair": 1 }, function (req11, res11) {
                                    var mob_sms_key_fibair_base64 = new Buffer.from(sms_key_fibair + ":").toString("base64");

                                    if (mob_sms_key_fibair_base64 != undefined) {
                                        if (mob_sms_key_fibair_base64 != '') {
                                            //elegxos gia apostoli sms
                                            if (cf_mobile != '') {
                                                //send sms
                                                sendsms_function(cf_mobile, product, _status_gr, req.query.bug_id, mob_sms_key_fibair_base64, function (send_sms) {
                                                    console.log(send_sms);
                                                });
                                            }
                                            var bugParams3 = "?f1=bug_id&o1=equals&v1=" + req.query.bug_id + "&include_fields=cf_cc_mobile";
                                            rp({
                                                uri: bugUrlRest + "/rest/bug" + bugParams3,
                                                method: "GET"
                                            }).then(function (body3) {
                                                var body3bugs = JSON.parse(body3).bugs[0];
                                                if (body3bugs.cf_cc_mobile != '') {
                                                    var str = body3bugs.cf_cc_mobile;
                                                    var mobile_ = str.split(",");
                                                    //console.log(JSON.stringify(mobile_));

                                                    for (var j = 0; j < mobile_.length; j++) {
                                                        sendsms_function(mobile_[j], product, _status_gr, req.query.bug_id, mob_sms_key_fibair_base64, function (send_sms) {
                                                            console.log(send_sms);
                                                        });
                                                    }
                                                }
                                            });
                                        } else {
                                            console.log(["SMS isn't supported!!"]);
                                        }
                                    } else {
                                        console.log(["SMS isn't supported!"]);
                                    }
                                    //});

                                    //console.log(req);
                                    var flag_email_doesnot_exist = false;

                                    if (req.query.bug_id == undefined || req.query.bug_id <= 0) {
                                        res.status(400).send('Bad Request');
                                    } else if ((req.query.email == undefined || req.query.email == '') && (req.query.mobile_num == undefined || req.query.mobile_num == '')) {
                                        res.status(400).send('Bad Request');
                                    } else {
                                        var bugParams1 = "?bug_id=" + req.query.bug_id + "&include_fields=id,alias,cc,cf_cc_mobile";

                                        rp({
                                            uri: bugUrlRest + "/rest/bug" + bugParams1,
                                            method: "GET"
                                        }).then(function (body) {

                                            console.log(JSON.stringify(body));

                                            if (JSON.parse(body).bugs[0] != undefined) {



                                                var form = new formidable.IncomingForm();
                                                console.log("openedFiles===>" + form.openedFiles);

                                                //if (form.openedFiles[0] != undefined) {

                                                form.multiples = true;
                                                form.uploadDir = path.join(config.config.minio_temp_folder);

                                                for (var k = 0; k < JSON.parse(body).bugs[0].cc.length; k++) {
                                                    flag_email_doesnot_exist = true;
                                                    console.log("email=" + req.query.email);
                                                    console.log("cc[k]=" + cc[k]);
                                                    console.log("cf_cc_mobile=" + JSON.parse(body).bugs[0].cf_cc_mobile);
                                                    console.log("mobile_num=" + req.query.mobile_num);

                                                    if (JSON.parse(body).bugs[0].cc[k] == req.query.email || req.query.mobile_num != '') {

                                                        k = JSON.parse(body).bugs[0].cc.length;
                                                        console.log("k==" + k);
                                                        form.on('file', function (field, file) {

                                                            var timestamp_ = (new Date).getTime();

                                                            var fileStream = fs.createReadStream(file.path);

                                                            fs.readFile(file.path, function (err, data) {
                                                                if (err) throw err;
                                                                if ((file.type).indexOf("image") !== -1) {
                                                                    //image                    
                                                                    var split_type = (file.type).split("/");
                                                                    console.log("Files===>");
                                                                    var fileStat = fs.stat(file.path, function (err, stats) {
                                                                        minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '.' + split_type[1], fileStream, stats.size, function (err, etag) {

                                                                            return console.log(err, etag) // err should be null
                                                                        });
                                                                    });
                                                                    gm(data).resize(120, 120).toBuffer(split_type[1], function (errBuffer, buffer) {
                                                                        var fileStat = fs.stat(file.path, function (err, stats) {

                                                                            minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '_thumb.' + split_type[1], buffer, stats.size, function (err, etag) {

                                                                                rp({
                                                                                    uri: bugUrlRest + "/rest/bug/comment/" + bugResponse2.id + "/tags",
                                                                                    method: "PUT",
                                                                                    json: { "add": ["filetype:" + file.type, "filename:" + req.query.bug_id + '_' + timestamp_ + '.' + split_type[1]], "id": bugResponse2.id, "token": bugToken }
                                                                                }).then(function (response4) {

                                                                                });

                                                                                return console.log(err, etag) // err should be null
                                                                            });
                                                                        });
                                                                    });


                                                                } else {
                                                                    var split_name = (file.name).split('.');

                                                                    var fileStat = fs.stat(file.path, function (err, stats) {
                                                                        minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '.' + split_name[(split_name.length - 1)], fileStream, stats.size, function (err, etag) {

                                                                            rp({
                                                                                uri: bugUrlRest + "/rest/bug/comment/" + bugResponse2.id + "/tags",
                                                                                method: "PUT",
                                                                                json: { "add": ["filetype:" + file.type, "filename:" + req.query.bug_id + '_' + timestamp_ + '.' + split_name[(split_name.length - 1)]], "id": bugResponse2.id, "token": bugToken }
                                                                            }).then(function (response4) {
                                                                                console.log("/issue/:id -> /rest/bug/comment/id/tags");
                                                                            });

                                                                            return console.log(err, etag); // err should be null
                                                                        });
                                                                    });

                                                                }

                                                            });

                                                        });
                                                        // log any errors that occur
                                                        form.on('error', function (err) {
                                                            console.log('An error has occured: \n' + err);
                                                        });

                                                        // once all the files have been uploaded, send a response to the client
                                                        form.on('end', function () {
                                                            console.log("2=>>");
                                                            console.log(form);
                                                            res.send('success');
                                                        });

                                                        // parse the incoming request containing the form data
                                                        form.parse(req);
                                                    } else {
                                                        if (k == JSON.parse(body).bugs[0].cc.length) {
                                                            if (!flag_email_doesnot_exist) {
                                                                res.status(400).send('Bad Request');
                                                            }
                                                        }
                                                    }
                                                }

                                                // } else {
                                                //     res.send('success');
                                                //  }
                                            } else {
                                                res.status(400).send('Bad Request');
                                            }
                                        });
                                    }
                                });
                            });
                            //});
                       
                    } else {
















                    }

                }

            });
        }).catch(function (err1) {
            console.log("err1=>" + err1);
        });     
    } else {
        res.status(400).send('Bad Request');
    }
});
*/













//Register to an existed issue or add comment with attachment file
router.post('/issue_register_old', function (req, res) {


    if (req.query.bug_id != undefined && req.query.email != undefined && req.query.mobile_num != undefined) {

        if (req.query.bug_id != '' && (req.query.email != '' || req.query.mobile_num != '')) {

            ///* Create user acount to bugzilla			
            var bugCreateuser1 = { "token": bugToken, "email": req.query.email };

            request({
                url: bugUrlRest + "/rest/user",
                method: "POST",
                json: bugCreateuser1
            }, function (error, response, body) {
                if (error) {
                    console.log("/issue/:id -> User doesnot created! Error : " + error);
                    return false;
                }
                console.log("/issue/:id -> User Created/already exist at bugzilla");



                var bugParams1 = "?f1=bug_id&o1=equals&v1=" + req.query.bug_id + "&include_fields=cf_email,cf_mobile,product,cf_cc_mobile,cf_cc_name,cc,cf_creator,status";
                request({
                    url: bugUrlRest + "/rest/bug" + bugParams1,
                    method: "GET"
                }, function (error, response, body) {
                    console.log("/issue_subscribe : /rest/bug ");

                    var eeeee = JSON.parse(body).bugs[0].cc;
                    var req_comment = "undefined";
                    if (eeeee.indexOf(req.query.email) == -1) {
                        if (req.query.comment == "" || req.query.comment == undefined) {
                            req_comment = "Προστέθηκε νέος χρήστης";
                        } else {
                            req_comment = "Προστέθηκε νέος χρήστης και σχολίασε : " + req.query.comment;
                        }
                    } else {
                        console.log("Yπάρχει");
                        if (req.query.comment != "" && req.query.comment != "undefined") {
                            req_comment = req.query.comment;
                        }
                    }

                    console.log("10");

                    /* Insert email in cc list */
                    if (JSON.parse(body).bugs[0].cf_email != req.query.email) {
                        for (var i = 0; i < JSON.parse(body).bugs[0].cc.length; i++) {
                            if (JSON.parse(body).bugs[0].cc[i] != req.query.email) {

                                var bodyParams_add = { "token": bugToken, "ids": [req.query.bug_id], "cc": { "add": [req.query.email] } };
                                request({
                                    url: bugUrlRest + "/rest/bug/" + req.body.bug_id,
                                    method: "PUT",
                                    json: bodyParams_add
                                }, function (error1, response1, body1) {
                                    console.log("/issue_subscribe : /rest/bug/bug_id ");

                                    console.log("11:" + JSON.stringify(body1));
                                });
                            }
                        }
                    }
                    console.log("12");
                    if (JSON.parse(body).bugs[0].cf_mobile != req.query.mobile_num) {
                        if (JSON.parse(body).bugs[0].cf_cc_mobile != req.query.mobile_num) {
                            if (JSON.parse(body).bugs[0].cf_cc_mobile != "") {
                                var mobile_cc = JSON.parse(body).bugs[0].cf_cc_mobile;
                                if (mobile_cc.indexOf(req.query.mobile_num) == -1) {
                                    var bodyParams_add_2 = { "token": bugToken, "ids": [req.query.bug_id], "cf_cc_mobile": (JSON.parse(response.body).bugs[0].cf_cc_mobile + "," + req.query.mobile_num) };
                                    request({
                                        url: bugUrlRest + "/rest/bug/" + req.query.bug_id,
                                        method: "PUT",
                                        json: bodyParams_add_2
                                    }, function (error1, response1, body1) {

                                        console.log("add cf_cc_mobile 1");
                                        console.log("13");
                                    });
                                }
                            } else {
                                var bodyParams_add_2 = { "token": bugToken, "ids": [req.query.bug_id], "cf_cc_mobile": req.query.mobile_num };
                                request({
                                    url: bugUrlRest + "/rest/bug/" + req.query.bug_id,
                                    method: "PUT",
                                    json: bodyParams_add_2
                                }, function (error1, response1, body1) {
                                    console.log("add cf_cc_mobile 2");
                                    console.log("14");
                                });
                            }
                        }
                    }
                    console.log("15");
                    if (JSON.parse(body).bugs[0].cf_creator != req.query.name) {
                        if (JSON.parse(body).bugs[0].cf_cc_name != req.query.name) {
                            if (JSON.parse(body).bugs[0].cf_cc_name != "") {
                                var name_cc = JSON.parse(body).bugs[0].cf_cc_name;
                                if (name_cc.indexOf(req.query.name) == -1) {
                                    var bodyParams_add_2 = { "token": bugToken, "ids": [req.query.bug_id], "cf_cc_name": (JSON.parse(response.body).bugs[0].cf_cc_name + "," + req.query.name) };
                                    request({
                                        url: bugUrlRest + "/rest/bug/" + req.query.bug_id,
                                        method: "PUT",
                                        json: bodyParams_add_2
                                    }, function (error1, response1, body1) {

                                        console.log("1=>"+JSON.stringify(body1));

                                        console.log("add cf_cc_name 1");
                                        console.log("16");
                                    });
                                }
                            } else {
                                var bodyParams_add_2 = { "token": bugToken, "ids": [req.query.bug_id], "cf_cc_name": req.query.name };
                                request({
                                    url: bugUrlRest + "/rest/bug/" + req.query.bug_id,
                                    method: "PUT",
                                    json: bodyParams_add_2
                                }, function (error1, response1, body1) {

                                    console.log(JSON.stringify(body1));
                                    console.log("add cf_cc_name 2");
                                    console.log("17");
                                });
                            }
                        }
                    }

                    var bugComment1 = { "token": bugToken, "id": req.query.bug_id, "comment": String(req_comment) };
                    console.log("18");
                    request({
                        url: bugUrlRest + "/rest/bug/" + req.query.bug_id + "/comment",
                        method: "POST",
                        json: bugComment1
                    }, function (error2, bugResponse2, body2) {

                        if (req.query.name != undefined) {
                            tag_name = "name:" + req.query.name;
                        } else {
                            tag_name = "name:undefined";
                        }
                        if (req.query.email != undefined) {
                            tag_email = "email:" + req.query.email;
                        } else {
                            tag_email = "email:undefined";
                        }
                        if (req.query.mobile_num != undefined) {
                            tag_mobile = "mobile:" + req.query.mobile_num;
                        } else {
                            tag_mobile = "mobile:undefined";
                        }
                        var new_user = "action:user-existed";
                        var register_user = JSON.parse(body).bugs[0].cc;

                        if (register_user.indexOf(req.query.email) == -1) {
                            new_user = "action:new-user";
                        }
                        //}
                        console.log("19");
                        var json_data = { "add": [tag_name, tag_email, tag_mobile, new_user], "id": parseInt(bugResponse2.body.id), "token": bugToken };

                        request({
                            url: bugUrlRest + "/rest/bug/comment/" + parseInt(bugResponse2.body.id) + "/tags",
                            method: "PUT",
                            json: json_data
                        }, function (error4, response4, body4) {


                            console.log("20");
                            var _status_gr = ' ΑΛΛΑΞΕ';


                            Municipality.find({ "municipality": JSON.parse(body).bugs[0].product }, { "sms_key_fibair": 1 }, function (req11, res11) {
                                //var mob_sms_key_fibair_base64 = new Buffer(res11[0].sms_key_fibair + ":").toString("base64");
                                var mob_sms_key_fibair_base64 = undefined;
                                if (mob_sms_key_fibair_base64 != undefined) {
                                    if (mob_sms_key_fibair_base64 != '') {
                                        //elegxos gia apostoli sms
                                        if (JSON.parse(body).bugs[0].cf_mobile != '') {
                                            //send sms
                                            sendsms_function(JSON.parse(body).bugs[0].cf_mobile, JSON.parse(body).bugs[0].product, _status_gr, req.query.bug_id, mob_sms_key_fibair_base64, function (send_sms) {
                                                console.log(send_sms);
                                            });
                                        }
                                        var bugParams3 = "?f1=bug_id&o1=equals&v1=" + req.query.bug_id + "&include_fields=cf_cc_mobile";
                                        request({
                                            url: bugUrlRest + "/rest/bug" + bugParams3,
                                            method: "GET"
                                        }, function (error3, response3, body3) {
                                            console.log("cf_cc_mobile=>"+JSON.parse(body3).bugs[0].cf_cc_mobile);
                                            if (JSON.parse(body3).bugs[0].cf_cc_mobile != '') {
                                                var str = JSON.parse(body3).bugs[0].cf_cc_mobile;
                                                var mobile_ = str.split(",");
                                                console.log(JSON.stringify(mobile_));

                                                for (var j = 0; j < mobile_.length; j++) {
                                                    sendsms_function(mobile_[j], JSON.parse(body).bugs[0].product, _status_gr, req.query.bug_id, mob_sms_key_fibair_base64, function (send_sms) {
                                                        console.log("12345");
                                                        console.log(send_sms);
                                                    });
                                                }

                                            }

                                        });
                                    } else {
                                        res.send(["SMS doesn't supported"]);
                                    }
                                } else {
                                    res.send(["SMS doesn't supported"]);
                                }
                            });

                            //console.log(req);
                            var flag_email_doesnot_exist = false;

                            if (req.query.bug_id == undefined || req.query.bug_id <= 0) {
                                res.status(400).send('Bad Request');
                            } else if ((req.query.email == undefined || req.query.email == '') && (req.query.mobile_num == undefined || req.query.mobile_num == '')) {
                                res.status(400).send('Bad Request');
                            } else {
                                var bugParams1 = "?bug_id=" + req.query.bug_id + "&include_fields=id,alias,cc,cf_cc_mobile";
                                request({
                                    url: bugUrlRest + "/rest/bug" + bugParams1,
                                    method: "GET"
                                }, function (error, response, body) {

                                    console.log(JSON.stringify(body));

                                    if (JSON.parse(body).bugs[0] != undefined) {
                                        console.log("-30-");
                                        var form = new formidable.IncomingForm();

                                        //console.log(form._filesize);
                                        form.multiples = true;
                                        form.uploadDir = path.join(config.config.minio_temp_folder);

                                        console.log("length" + JSON.parse(body).bugs[0].cc.length);
                                        console.log("mobile=> " + JSON.parse(body).bugs[0].cf_cc_mobile + "==" + req.query.mobile_num);

                                        for (var k = 0; k < JSON.parse(body).bugs[0].cc.length; k++) {
                                            flag_email_doesnot_exist = true;
                                            if (JSON.parse(body).bugs[0].cc[k] == req.query.email || JSON.parse(body).bugs[0].cf_cc_mobile == req.query.mobile_num ) {

                                                form.on('file', function (field, file) {
                                                    var timestamp_ = (new Date).getTime();

                                                    var fileStream = fs.createReadStream(file.path);

                                                    fs.readFile(file.path, function (err, data) {
                                                        if (err) throw err;
                                                        if ((file.type).indexOf("image") !== -1) {
                                                            //image                    
                                                            console.log('1');
                                                            var split_type = (file.type).split("/");
                                                            console.log(""); console.log(""); console.log("");
                                                            console.log("split_type=>" + split_type);
                                                            console.log(""); console.log(""); console.log("");
                                                            var fileStat = fs.stat(file.path, function (err, stats) {
                                                                minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '.' + split_type[1], fileStream, stats.size, function (err, etag) {
                                                                    console.log('2');
                                                                    console.log(etag);
                                                                    return console.log(err, etag) // err should be null
                                                                });
                                                            });

                                                            console.log(""); console.log("data->"); console.log("");
                                                            console.log(data);
                                                            console.log(""); console.log(""); console.log("");
                                                            gm(data).resize(120, 120).toBuffer(split_type[1], function (errBuffer, buffer) {
                                                                var fileStat = fs.stat(file.path, function (err, stats) {
                                                                    
                                                                    console.log(config.config.minio_bucket);
                                                                    console.log(""); console.log(""); console.log("");
                                                                    console.log(req.query.bug_id + '_' + timestamp_ + '_thumb.' + split_type[1]);
                                                                    console.log(""); console.log(""); console.log("");
                                                                    console.log(buffer);
                                                                    console.log(""); console.log(""); console.log("");
                                                                    console.log('err=>' + errBuffer);
                                                                    console.log(""); console.log(""); console.log("");
                                                                    console.log(stats.size);
                                                                    console.log(""); console.log(""); console.log("");


                                                                    minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '_thumb.' + split_type[1], buffer, stats.size, function (err, etag) {

                                                                        request({
                                                                            url: bugUrlRest + "/rest/bug/comment/" + body2.id + "/tags",
                                                                            method: "PUT",
                                                                            json: { "add": ["filetype:" + file.type, "filename:" + req.query.bug_id + '_' + timestamp_ + '.' + split_type[1]], "id": body2.id, "token": bugToken }
                                                                        }, function (error4, response4, body4) {
                                                                            console.log(""); console.log(""); console.log("");
                                                                            console.log(response4);
                                                                            console.log(""); console.log(""); console.log("");
                                                                            console.log(body4);
                                                                            console.log(""); console.log(""); console.log("");
                                                                            console.log(error4);
                                                                            console.log(""); console.log(""); console.log("");
                                                                            console.log("/issue/:id -> /rest/bug/comment/id/tags");
                                                                        });

                                                                        return console.log(err, etag) // err should be null
                                                                    });
                                                                });
                                                            });

                                                           /* lwip.open(data, split_type[1], function (err, image) {
                                                                console.log('3');
                                                                image.scale(0.2, function (err, image) {
                                                                    console.log('4');
                                                                    image.toBuffer(split_type[1], function (err, buffer) {
                                                                        console.log('5');
                                                                        var fileStat = fs.stat(file.path, function (err, stats) {
                                                                            console.log('6');
                                                                            console.log(stats);
                                                                            minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '_thumb.' + split_type[1], buffer, stats.size, function (err, etag) {
                                                                                console.log(err);
                                                                                console.log('7');

                                                                                request({
                                                                                    url: bugUrlRest + "/rest/bug/comment/" + parseInt(bugResponse2.body.id) + "/tags",
                                                                                    method: "PUT",
                                                                                    json: { "add": ["filetype:" + file.type, "filename:" + req.query.bug_id + '_' + timestamp_ + '.' + split_type[1]], "id": body2.id, "token": bugToken }
                                                                                }, function (error4, response4, body4) {

                                                                                    console.log("/issue/:id -> /rest/bug/comment/id/tags");
                                                                                });
                                                                                //}
                                                                                //});

                                                                                return console.log(err, etag) // err should be null
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            });*/
                                                        } else {
                                                            var split_name = (file.name).split('.');

                                                            var fileStat = fs.stat(file.path, function (err, stats) {
                                                                minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '.' + split_name[(split_name.length - 1)], fileStream, stats.size, function (err, etag) {

                                                                    request({
                                                                        url: bugUrlRest + "/rest/bug/comment/" + body2.id + "/tags",
                                                                        method: "PUT",
                                                                        json: { "add": ["filetype:" + file.type, "filename:" + req.query.bug_id + '_' + timestamp_ + '.' + split_name[(split_name.length - 1)]], "id": body2.id, "token": bugToken }
                                                                    }, function (error4, response4, body4) {
                                                                        console.log("/issue/:id -> /rest/bug/comment/id/tags");
                                                                    });

                                                                    return console.log(err, etag); // err should be null
                                                                });
                                                            });

                                                        }

                                                    });

                                                });
                                                // log any errors that occur
                                                form.on('error', function (err) {
                                                    console.log('An error has occured: \n' + err);
                                                });

                                                // once all the files have been uploaded, send a response to the client
                                                form.on('end', function () {
                                                    res.send('success');
                                                });

                                                // parse the incoming request containing the form data
                                                form.parse(req);
                                            } else {
                                                if (k == JSON.parse(body).bugs[0].cc.length) {
                                                    if (!flag_email_doesnot_exist) {
                                                        res.status(400).send('Bad Request');
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        res.status(400).send('Bad Request');
                                    }
                                });
                            }
                        });
                    });
                });
            });
        } else {
            res.status(400).send('Bad Request');
        }
    } else {
        res.status(400).send('Bad Request');
    }
});

function sendsms_function(req_mobile, req_product, req_status, req_bugid, mob_sms_key_fibair_base64, callback) {
    request({
        url: "https://api.theansr.com/v1/sms",
        method: "POST",
        form: { 'sender': req_product, 'recipients': '30' + req_mobile, 'body': req_product + '.sense.city! ΤΟ ΑΙΤΗΜΑ ΣΑΣ ΜΕ ΚΩΔΙΚΟ ' + req_bugid + ' ' + req_status + '. ΛΕΠΤΟΜΕΡΕΙΕΣ: https://' + req_product + '.sense.city/bug/' + req_bugid },
        headers: { "Authorization": 'Basic ' + mob_sms_key_fibair_base64, 'content-type': 'application/form-data' }
    }, function (err, response) {
        console.log(JSON.stringify(response));
        console.log(JSON.stringify("Send sms"));
    });
    callback("OK");
}

router.post('/find_my_issue', function (req, res) {

    if (req.body.status == "in_progress") {
        var bugParams1 = "?f1=OP&f11=creation_ts&f14=OP&f15=cf_cc_mobile&f16=cf_mobile&f2=bug_status&f3=bug_status&f5=CP&f6=OP&f7=cc&j1=OR&j14=OR&list_id=2775&o11=greaterthaneq&o15=anywordssubstr&o16=anywordssubstr&o2=equals&o3=equals&o7=substring&query_format=advanced&v11=2017-01-01&v15=" + req.body.mobile_num + "&v16=" + req.body.mobile_num + "&v2=CONFIRMED&v3=IN_PROGRESS&v7=" + req.body.email + "&order=bug_id%20DESC&include_fields=alias,status,id,url,cf_city_address,cf_city_name";
        request({
            url: bugUrlRest + "/rest/bug" + bugParams1,
            method: "GET"
        }, function (error, resp1, body) {
            //console.log(resp1);
            res.send(resp1);
        });
    } else if (req.body.status == "resolved") {
        var bugParams1 = "?f1=OP&f11=creation_ts&f14=OP&f15=cf_cc_mobile&f16=cf_mobile&f18=CP&f19=OP&f20=resolution&f21=resolution&f22=resolution&f23=resolution&f24=resolution&f3=bug_status&f5=CP&f6=OP&f7=cc&j14=OR&j19=OR&j2=OR&list_id=2785&o11=greaterthaneq&o15=anywordssubstr&o16=anywordssubstr&o20=equals&o21=equals&o22=equals&o23=equals&o24=equals&o3=equals&o7=substring&query_format=advanced&v11=2017-01-01&v15=" + req.body.mobile_num + "&v16=" + req.body.mobile_num + "&v20=FIXED&v21=INVALID&v22=WONTFIX&v23=DUPLICATE&v24=WORKSFORME&v3=RESOLVED&v7=" + req.body.email + "&order=bug_id%20DESC&include_fields=alias,status,id,url,cf_city_address,cf_city_name";

        request({
            url: bugUrlRest + "/rest/bug" + bugParams1,
            method: "GET"
        }, function (error, resp1, body) {
            //console.log(resp1);
            res.send(resp1);
        });
    } else {
        res.send([]);
    }
});

// Recommend issue
router.post('/issue_recommendation', function (req, res) {
    if (req.body.lat == undefined && req.body.long == undefined && req.body.issue == undefined) {
        res.send([]);
    }
    else {
        var mydate = new Date();
        var my_year = mydate.getFullYear();
        var my_month = mydate.getMonth() + 1;
        if (my_month == 1) {
            my_month = 12;
        } else {
            my_month = my_month - 1;
        }
        if (my_month < 10) {
            my_month = "0" + my_month;
        }

        var my_date = mydate.getDate();


        if (my_date < 10) {
            my_date = "0" + my_date;
        }

        console.log("/issue_recommendation: Issue.find()");
        console.log("");

        Issue.find({
            "issue": req.body.issue, "create_at": {
                $gte: my_year.toString() + "-" + my_month.toString() + "-" + my_date.toString()
            }, "loc": {
                $near: { //$nearSphere:
                    $geometry: {
                        type: "Point", coordinates: [req.body.long, req.body.lat]
                    }, $maxDistance: 50
                }
            }
        }, function (req, resp) {
            console.log("/issue_recommendation: " + JSON.stringify(resp));
            console.log("");
            if (resp.length > 0) {
                var bugParams1 = "?f1=OP&f2=cf_authedicated&f3=CP&f4=OP&f5=bug_status&f6=bug_status&f7=CP&f8=OP&j4=OR&j8=OR&o2=greaterthaneq&o5=equals&o6=equals&v2=1&v5=CONFIRMED&v6=IN_PROGRESS";

                for (var i = 0; i < resp.length; i++) {
                    //console.log(i);
                    bugParams1 += "&f" + (i + 9) + "=alias&o" + (i + 9) + "=equals&v" + (i + 9) + "=" + resp[i]._id;
                }
                bugParams1 += "&include_fields=alias,status,id,url,cf_city_address";


                //console.log(bugParams1);

                request({
                    url: bugUrlRest + "/rest/bug" + bugParams1,
                    method: "GET"
                }, function (error, resp1, body) {
                    if (error) { console.log(error); }
                    console.log("");
                    res.send("[" + body + "]");
                });
            } else {
                res.send([]);
            }
        });
    }
});

router.get('/city_coordinates', function (req, res) {
    //console.log(req);
    var city = req.query.city;
    // console.log(city);
    Municipality.find({ "municipality": city }, { "boundaries": 1 }, function (req1, res1) {
        // console.log("=====>>>" + req1);
        res.send(res1);
    });
});

router.post('/upload_files', function (req, res) {
    //console.log(req);
    var flag_email_doesnot_exist = false;
    var comment_ = 'undefined';

    //console.log(req.query.comment);

    if (req.query.comment == undefined || req.query.comment == '') {
        comment_ = 'undefined';
    } else {
        comment_ = req.query.comment;
    }

    if (req.query.bug_id == undefined || req.query.bug_id <= 0) {
        res.status(400).send('Bad Request');
    } else if (req.query.email == undefined || req.query.email == '') {
        res.status(400).send('Bad Request');
    } else {
        var bugParams1 = "?bug_id=" + req.query.bug_id + "&include_fields=id,alias,cc";
        request({
            url: bugUrlRest + "/rest/bug" + bugParams1,
            method: "GET"
        }, function (error, response, body) {

            if (JSON.parse(body).bugs[0] != undefined) {

                var form = new formidable.IncomingForm();
                form.multiples = true;
                form.uploadDir = path.join(config.config.minio_temp_folder);

                for (var k = 0; k < JSON.parse(body).bugs[0].cc.length; k++) {
                    flag_email_doesnot_exist = true;
                    if (JSON.parse(body).bugs[0].cc[k] == req.query.email) {

                        form.on('file', function (field, file) {
                            var timestamp_ = (new Date).getTime();

                            var fileStream = fs.createReadStream(file.path);

                            fs.readFile(file.path, function (err, data) {
                                if (err) throw err;
                                if ((file.type).indexOf("image") !== -1) {
                                    //image                    
                                    console.log('1');
                                    var split_type = (file.type).split("/");
                                    var fileStat = fs.stat(file.path, function (err, stats) {
                                        minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '.' + split_type[1], fileStream, stats.size, function (err, etag) {
                                            console.log('2');
                                            console.log(etag);
                                            return console.log(err, etag) // err should be null
                                        });
                                    });

                                    lwip.open(data, split_type[1], function (err, image) {
                                        console.log('3');
                                        image.scale(0.2, function (err, image) {
                                            console.log('4');
                                            image.toBuffer(split_type[1], function (err, buffer) {
                                                console.log('5');
                                                var fileStat = fs.stat(file.path, function (err, stats) {
                                                    console.log('6');
                                                    console.log(stats);
                                                    minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '_thumb.' + split_type[1], buffer, stats.size, function (err, etag) {
                                                        console.log(err);
                                                        console.log('7');
                                                        var bugComment1 = { "token": bugToken, "id": req.query.bug_id, "comment": comment_ };
                                                        request({
                                                            url: bugUrlRest + "/rest/bug/" + req.query.bug_id + "/comment",
                                                            method: "POST",
                                                            json: bugComment1
                                                        }, function (error2, bugResponse2, body2) {
                                                            console.log('8');
                                                            if (body2.id != null) {
                                                                request({
                                                                    url: bugUrlRest + "/rest/bug/comment/" + body2.id + "/tags",
                                                                    method: "PUT",
                                                                    json: { "add": ["filetype:" + file.type, "name:" + req.query.bug_id + '_' + timestamp_ + '.' + split_type[1]], "id": body2.id, "token": bugToken }
                                                                }, function (error4, response4, body4) {
                                                                    console.log(error4);
                                                                    console.log(body4);
                                                                    console.log("/issue/:id -> /rest/bug/comment/id/tags");
                                                                });
                                                            }
                                                        });
                                                        return console.log(err, etag) // err should be null
                                                    });
                                                });
                                            });
                                        });
                                    });
                                } else {
                                    var split_name = (file.name).split('.');
                                    var bugComment1 = { "token": bugToken, "id": req.query.bug_id, "comment": comment_ };
                                    var fileStat = fs.stat(file.path, function (err, stats) {
                                        minioClient.putObject(config.config.minio_bucket, req.query.bug_id + '_' + timestamp_ + '.' + split_name[(split_name.length - 1)], fileStream, stats.size, function (err, etag) {
                                            request({
                                                url: bugUrlRest + "/rest/bug/" + req.query.bug_id + "/comment",
                                                method: "POST",
                                                json: bugComment1
                                            }, function (error2, bugResponse2, body2) {
                                                if (body2.id != null) {
                                                    request({
                                                        url: bugUrlRest + "/rest/bug/comment/" + body2.id + "/tags",
                                                        method: "PUT",
                                                        json: { "add": ["filetype:" + file.type, "name:" + req.query.bug_id + '_' + timestamp_ + '.' + split_name[(split_name.length - 1)]], "id": body2.id, "token": bugToken }
                                                    }, function (error4, response4, body4) {
                                                        console.log("/issue/:id -> /rest/bug/comment/id/tags");
                                                    });
                                                }
                                            });
                                            return console.log(err, etag); // err should be null
                                        });
                                    });
                                }
                            });
                        });

                        // log any errors that occur
                        form.on('error', function (err) {
                            console.log('An error has occured: \n' + err);
                        });

                        // once all the files have been uploaded, send a response to the client
                        form.on('end', function () {
                            res.send('success');
                        });

                        // parse the incoming request containing the form data
                        form.parse(req);
                    } else {
                        if (k == JSON.parse(body).bugs[0].cc.length) {
                            if (!flag_email_doesnot_exist) {
                                res.status(400).send('Bad Request');
                            }
                        }
                    }
                }
            } else {
                res.status(400).send('Bad Request');
            }
        });
    }
});


router.get('/admin/municipality', authorize, function (req, res) {

    if (req.query.city != undefined) {
        Municipality.find({ "municipality": req.query.city }, { "municipality": 1, "municipality_desc": 1, "sms_key_fibair": 1, "mandatory_email": 1, "mandatory_sms": 1, "active_sms_service": 1, "control_department": 1 }, function (err, resp) {
            res.send(resp);
        });
    } else {
        res.status(400).send(["Bad Request"]);
    }


});




var https = require('https');

router.get('/get_comments_files', function (req, res) {

    var thumb_img = 0;
    //req file kai type original|thumb

    var _filename = req.query.filename;
    if (req.query.thumb == 1) {
        var split_name = req.query.filename.split(".");
        _filename = split_name[0] + "_thumb." + split_name[1];
    }
    minioClient.getObject(config.config.minio_bucket, _filename, function (err, dataStream) {
        if (err) {
            return console.log(err);
        }
        dataStream.on('data', function (chunk) {
            res.write(chunk);
        });
        dataStream.on('end', function () {
            res.end();
        });
        dataStream.on('error', function (err) {
            console.log(err);
        });
    });


});

router.post('/admin/other_api', authorize, function (req, res) {
    console.log("0");
    var reqBodyErr = 0;

    if ((req.body.name == null || req.body.name == undefined) && reqBodyErr == 0) {
        console.log("01");
        res.status(404).send("Bad Request");
        reqBodyErr = 1;
    }

    console.log(req.body.description);

    if ((req.body.description == null || req.body.description == undefined) && reqBodyErr == 0) {
        console.log("02");
        res.status(404).send("Bad Request");
        reqBodyErr = 1;
    }
    if ((req.body.company == null || req.body.company == undefined) && reqBodyErr == 0) {
        console.log("03");
        res.status(404).send("Bad Request");
        reqBodyErr = 1;
    }
    if ((req.body.email == null || req.body.email == undefined) && reqBodyErr == 0) {
        console.log("04");
        res.status(404).send("Bad Request");
        reqBodyErr = 1;
    }
    if ((req.body.mobile == null || req.body.mobile == undefined) && reqBodyErr == 0) {
        console.log("05");
        res.status(404).send("Bad Request");
        reqBodyErr = 1;
    }

    console.log("1");
    if (reqBodyErr == 0) {

        var entry = new otherApis({
            name: req.body.name,
            description: req.body.description,
            name_contact: req.body.company,
            email_contact: req.body.email,
            mobile_contact: req.body.mobile,
            active: true
        });
        console.log("2");
        entry.save(function (err1, resp1) {
            console.log("12");
            res.status(200).send(resp1);
        });
    }
});

router.post('/auto_issue', function (req, res) {
    var automateIssueErr = 0;

    if ((req.body.api_key == null || req.body.api_key == undefined) && automateIssueErr == 0) {
        res.status(404).send("Bad Request");
        automateIssueErr = 1;
    }

    if ((req.body.loc.coordinates == null || req.body.loc.coordinates == undefined) && automateIssueErr == 0) {
        res.status(404).send("Bad Request");
        automateIssueErr = 1;
    }

    if ((req.body.device_id == null || req.body.device_id == undefined) && automateIssueErr == 0) {
        res.status(404).send("Bad Request");
        automateIssueErr = 1;
    }

    if ((req.body.issue == null || req.body.issue == undefined) && automateIssueErr == 0) {
        res.status(404).send("Bad Request");
        automateIssueErr = 1;
    }

    if ((req.body.value_desc == null || req.body.value_desc == undefined) && automateIssueErr == 0) {
        res.status(404).send("Bad Request");
        automateIssueErr = 1;
    }

    if (automateIssueErr == 0) {

        otherApis.find({
            "_id": req.body.api_key
        }, function (err9, resp9) {
            if (resp9 != undefined) {
                console.log(JSON.stringify(resp9));

                var companyName = resp9[0].name_contact;

                Municipality.find({
                    boundaries:
                        {
                            $geoIntersects: { $geometry: { "type": "Point", "coordinates": [req.body.loc.coordinates[0], req.body.loc.coordinates[1]] } }
                        }
                }, { "municipality": 1 }, function (req1, res1) {

                    console.log(res1);

                    var entry = new Issue({
                        loc: { type: 'Point', coordinates: req.body.loc.coordinates },
                        issue: req.body.issue,
                        device_id: req.body.device_id,
                        value_desc: req.body.value_desc,
                        comments: req.body.comments,
                        city_address: ""
                    });

                    entry.image_name = '';
                    entry.municipality = res1[0]["municipality"];

                    console.log("city" + res1[0]["municipality"]);

                    entry.save(function (err1, resp) {

                        console.log("resp===>" + JSON.stringify(resp));

                        var bugData1 = { "token": bugToken, "summary": resp.issue, "priority": "normal", "bug_severity": "normal", "cf_city_name": entry.municipality, "alias": [resp._id.toString()], "url": resp.value_desc, "product": res1[0]["municipality"], "component": config.config.bug_component, "version": "unspecified", "cf_city_address": "" };

                        request({
                            url: bugUrlRest + "/rest/bug",
                            method: "POST",
                            json: bugData1
                        }, function (error, bugResponse, body) {
                            if (error != null) { console.log(error) };
                            console.log(JSON.stringify(body));
                            if (!error && bugResponse.statusCode === 200) {
                                console.log("body--------->>>>" + JSON.stringify(body));
                                //res.send({ "_id": resp._id });
                                otherApis.find({ "_id": req.body.api_key }, function (err3, res3) {
                                    console.log("res3===>" + res3);



                                    Municipality.find({ "municipality": res1[0].municipality }, { "control_department": 1 }, function (req4, res4) {
                                        console.log("/issue/:id -> Municipality.find()");
                                        console.log("res4===>" + res4);
                                        var default_department = JSON.stringify(res4);

                                        bodyParams = { "token": bugToken, "ids": [body.id], "component": JSON.parse(default_department)[0].control_department, "reset_assigned_to": true };
                                        console.log("===================)))))" + JSON.stringify(bodyParams));
                                        request({
                                            url: bugUrlRest + "/rest/bug/" + body.id,
                                            method: "PUT",
                                            json: bodyParams
                                        }, function (error1, response1, body1) {
                                            console.log("body1==>>" + JSON.stringify(body1));
                                            Issue.findOneAndUpdate({ "_id": resp._id }, {
                                                user: { uuid: req.body.api_key, name: res3.name, email: res3.email_contact, phone: res3.mobile_contact }
                                            }, function (err, resp1) {
                                                console.log("/issue/:id -> Update Issue with name,email & mobile num!" + resp1);
                                                var _resp = JSON.stringify(resp1);

                                                if (err)
                                                    throw err;

                                                ///* Create user acount to bugzilla			
                                                var bugCreateuser1 = { "token": bugToken, "email": res3.email_contact };

                                                request({
                                                    url: bugUrlRest + "/rest/user",
                                                    method: "POST",
                                                    json: bugCreateuser1
                                                }, function (error, response, body) {
                                                    if (error) {
                                                        console.log("/issue/:id -> User doesnot created! Error : " + error);
                                                        return false;
                                                    }
                                                    console.log("body===>" + body);
                                                    console.log("/issue/:id -> User Created/already exist at bugzilla");

                                                    ///* Find to bugzilla the issue and return the id
                                                    var bugParams1 = "?alias=" + resp._id + "&include_fields=id,alias";

                                                    request({
                                                        url: bugUrlRest + "/rest/bug" + bugParams1,
                                                        method: "GET"
                                                    }, function (error, response, body) {

                                                        console.log("body===>" + body);

                                                        var body_parse = JSON.parse(body);

                                                        if (body_parse.bugs[0] != undefined) {
                                                            ///* Update the issue with a specific id 
                                                            ///* Add cc list and move from default component to "ΤΜΗΜΑ ΕΠΙΛΥΣΗΣ ΠΡΟΒΛΗΜΑΤΩΝ" and Custom field values
                                                            bodyParams = { "token": bugToken, "ids": [body_parse.bugs[0].id], "component": JSON.parse(default_department)[0].control_department, "cc": { "add": [req.body.email_user] }, "cf_creator": "auto:" + req.body.api_key + ":" + companyName, "cf_email": req.body.email_user, "cf_deviceid": req.body.device_id, "cf_companyname": companyName, "cf_mobile": req.body.mobile_num, "reset_assigned_to": true, "cf_authedicated": 1, "cf_issues": resp.issue };
                                                            request({
                                                                url: bugUrlRest + "/rest/bug/" + resp._id,
                                                                method: "PUT",
                                                                json: bodyParams
                                                            }, function (error1, response1, body1) {
                                                                console.log(error1);
                                                                console.log("body1===>" + body1);
                                                                var bugComment1 = { "token": bugToken, "id": body_parse.bugs[0].id, "comment": "undefined" };

                                                                request({
                                                                    url: bugUrlRest + "/rest/bug/" + body_parse.bugs[0].id + "/comment",
                                                                    method: "POST",
                                                                    json: bugComment1
                                                                }, function (error2, bugResponse2, body2) {
                                                                    console.log("/issue/:id -> Insert comments to bugzilla");
                                                                    console.log("body2===>" + body2);
                                                                    if (body2.id != null) {

                                                                        request({
                                                                            url: bugUrlRest + "/rest/bug/comment/" + body2.id + "/tags",
                                                                            method: "PUT",
                                                                            json: { "add": ["DEPARTMENT:all", "STATUS:CONFIRMED"], "id": body2.id, "token": bugToken }
                                                                        }, function (error4, response4, body4) {

                                                                            res.send({ "description": "ok", "bugID": body_parse.bugs[0].id });

                                                                        });
                                                                    }
                                                                });

                                                            });
                                                        }
                                                    });
                                                });

                                            });



                                        });

                                    });


                                });

                            } else {
                                console.log("error: " + error);
                                console.log("bugResponse.statusCode: " + bugResponse.statusCode);
                                console.log("bugResponse.statusText: " + bugResponse.statusText);
                            }
                        });



                    });

                });

            } else {
                res.status(404).send("Bad Request");
            }
        });

    } else {
        res.status(404).send("Bad Request");
    }






});


router.post('/autoclose_issue', function (req, res) {


    var automateIssueErr = 0;

    if ((req.body.api_key == null || req.body.api_key == undefined) && automateIssueErr == 0) {
        res.status(404).send("Bad Request");
        automateIssueErr = 1;
    }

    if ((req.body.issue == null || req.body.issue == undefined) && automateIssueErr == 0) {
        res.status(404).send("Bad Request");
        automateIssueErr = 1;
    }

    if ((req.body.device_id == null || req.body.device_id == undefined) && automateIssueErr == 0) {
        res.status(404).send("Bad Request");
        automateIssueErr = 1;
    }

    if (automateIssueErr == 0) {

        otherApis.find({
            "_id": req.body.api_key
        }, function (err9, resp9) {
            console.log(resp9);
            /* Is Active the api key ? */
            if (resp9 != undefined) {
                console.log(req.body.device_id);
                Issue.find({
                    "device_id": req.body.device_id
                }, { "_id": 1 }, function (err1, resp1) {
                    console.log(resp1);
                    if (resp1[0] != undefined) {
                        request({
                            url: bugUrlRest + "/rest/bug/" + resp1[0]._id,
                            method: "GET",

                        }, function (err2, resp2, body2) {

                            if (JSON.parse(body2).bugs[0].id == req.body.bugID) {
                                request({
                                    url: bugUrlRest + "/rest/bug/" + resp1[0]._id,
                                    method: "PUT",
                                    json: {
                                        "token": bugToken, "id": [JSON.parse(body2).bugs[0].id], "priority": "Normal", "reset_assigned_to": true, "resolution": "FIXED", "severity": "normal", "status": "RESOLVED"
                                    }
                                }, function (error, response, body) {


                                    console.log(body2);
                                    console.log(JSON.parse(body2).bugs[0].id);
                                    var paramsAddComment = { "comment": "undefined", "id": JSON.parse(body2).bugs[0].id, "token": bugToken };


                                    request({
                                        url: bugUrlRest + "/rest/bug/" + JSON.parse(body2).bugs[0].id + " /comment",
                                        method: "POST",
                                        json: paramsAddComment
                                    }, function (err3, resp3, body3) {





                                        console.log("body3=" + body3.id);







                                        var bug_param = { "add": ["STATUS:RESOLVED", "DEPARTMENT:" + JSON.parse(body2).bugs[0].component], "id": body3.id, "token": bugToken };

                                        request({
                                            url: bugUrlRest + "/rest/bug/comment/" + body3.id + "/tags",
                                            method: "PUT",
                                            json: bug_param
                                        }, function (err4, resp4, body4) {

                                            res.send(["Closed"])
                                        });
















                                    });

                                });


                            } else {
                                res.status(404).send("Bad Request");
                            }

                        });
                    } else {
                        res.status(404).send("Bad Request");
                    }
                }).sort({ "create_at": -1 }).limit(1);
            } else {
                res.status(404).send("Bad Request");
            }
        });

    } else {
        res.status(404).send("Bad Request");
    }






});


/*  CrowdHackathon  */

var neighBor = require('../models/neighbor');

router.post('/inineighbor', function (req, res) {

    if (req.body.set_longitude != undefined && req.body.set_lattitude != undefined && req.body.userEmail != undefined) {
        console.log("OK");

        var entry = new neighBor({
            loc: { type: 'Point', coordinates: [req.body.set_longitude, req.body.set_lattitude] },
            email: req.body.userEmail,
            memberID: ""
        });

        entry.save(function (err1, res1) {
            console.log(res1);
            if (err1) { console.log(err1); }

            if (res1.email != undefined) {

                //prerequisites

                request({
                    url: "https://apis.nbg.gr/public/sandbox/socialnetwork.sandbox/v1/sandbox/hackathonSenseCity/users",
                    method: "POST",
                    headers: {
                        "accept": "text/json",
                        "content-type": "text/json",
                        "provider_id": "NBG.gr",
                        "provider": "NBG",
                        "user_id": "121b7542-ac3b-48d8-8666-3c2818e71648",
                        "username": "kostas",
                        "sandbox_id": "hackathonSenseCity",
                        "application_id": "5b5b297e-9061-4bbe-ab61-b4094fd2709e",
                        "x-ibm-client-id": "5b5b297e-9061-4bbe-ab61-b4094fd2709e"
                    },
                    json: { "username": req.body.userEmail }
                }, function (err2, resp2) {

                    console.log("resp=>" + JSON.stringify(resp2.body));

                    console.log(" resp2.body.payload.UserId=>" + resp2.body.payload.UserId);

                    request({
                        url: "https://apis.nbg.gr/public/sandbox/socialnetwork.sandbox/v1/UserManagement/userRegistration",
                        method: "POST",
                        headers: {
                            "accept": "text/json",
                            "content-type": "application/json",
                            "provider_id": "NBG.gr",
                            "provider": "NBG",
                            "user_id": resp2.body.payload.UserId,
                            "username": req.body.userEmail,
                            "sandbox_id": "hackathonSenseCity",
                            "application_id": "5b5b297e-9061-4bbe-ab61-b4094fd2709e",
                            "x-ibm-client-id": "5b5b297e-9061-4bbe-ab61-b4094fd2709e"
                        },
                        json: {
                            "header": {
                                "ID": "5b5b297e-9061-4bbe-ab61-b4094fd2709e",
                                "application": "5b5b297e-9061-4bbe-ab61-b4094fd2709e",
                                "bank": "NBG",
                                "hostSession": null,
                                "channel": "web",
                                "customer": 0,
                                "logitude": 0,
                                "latitude": 0,
                                "go4moreMember": "true",
                                "TAN": null
                            },
                            "payload": {
                                "socialNetworkId": "b3660585-74ca-45cf-ba32-ec3e6c0268e8",
                                "Identity": req.body.userEmail,
                                "IdentityType": "email",
                                "firstName": req.body.userEmail,
                                "lastName": req.body.userEmail,
                                "alias": req.body.userEmail
                            }
                        }
                    }, function (err3, resp3) {
                        console.log("resp3===>" + resp3.body.payload.verificationId);
                        request({
                            url: "https://apis.nbg.gr/public/sandbox/socialnetwork.sandbox/v1/UserManagement/userRegistrationVerification",
                            method: "POST",
                            headers: {
                                "accept": "text/json",
                                "content-type": "application/json",
                                "provider_id": "NBG.gr",
                                "provider": "NBG",
                                "user_id": resp2.body.payload.UserId,
                                "username": req.body.userEmail,
                                "sandbox_id": "hackathonSenseCity",
                                "application_id": "5b5b297e-9061-4bbe-ab61-b4094fd2709e",
                                "x-ibm-client-id": "5b5b297e-9061-4bbe-ab61-b4094fd2709e"
                            },
                            json: {
                                "header": {
                                    "ID": "5b5b297e-9061-4bbe-ab61-b4094fd2709e",
                                    "application": "5b5b297e-9061-4bbe-ab61-b4094fd2709e",
                                    "bank": "NBG",
                                    "hostSession": null,
                                    "channel": "web",
                                    "customer": 0,
                                    "logitude": 0,
                                    "latitude": 0,
                                    "go4moreMember": "true",
                                    "TAN": null
                                },
                                "payload": {
                                    "socialNetworkId": "b3660585-74ca-45cf-ba32-ec3e6c0268e8",
                                    "Identity": req.body.userEmail,
                                    "IdentityType": "email",
                                    "firstName": req.body.userEmail,
                                    "lastName": req.body.userEmail,
                                    "alias": req.body.userEmail,
                                    "verificationId": resp3.body.payload.verificationId,
                                    "verificationCode": "1234"
                                }
                            }
                        }, function (err4, resp4) {
                            console.log("resp4===>" + resp4.body.payload.memberId);

                            neighBor.update({ "email": req.body.userEmail }, {
                                $set: { "memberID": resp4.body.payload.memberId}
                            }, function (err5, resp5) {
                                res.send(["ok"]);
                            });
                        });

                    });


                });

            }


        });

        //res.send(req.body);
    } else {
        res.status(404).send("Bad Request!");
    }
});

router.post('/watson', function (req, res) {

    var params = {
        url: 'https://apitest.sense.city:4443/api/1.0/image_issue?bug_id=' + req.body.bugID + '&resolution=full',
        threshold: 0.65
    };


    visualRecognition.classify(params, function (err1, res1) {
        if (err1) {
            console.log("================================" + err1);
            res.status(404).send("Bad Request");
        } else {

            console.log("res1===>" + res1);

            res.send(res1.images[0].classifiers[0].classes);
        }
    });

});


var binAlive = require('../models/binAlive');

router.post('/addbinAlivePoints', function (req, res) {

    console.log(req);

    
    var entry = new binAlive({
        hwid: req.body.hwid,
        binID: req.body.binID,
        binTypeID: req.body.binTypeID,
        binSuperTypeID: req.body.binSuperTypeID,
        loc: { type: 'Point', coordinates: [req.body.longitude, req.body.latitude] },//latitude: String, longitude: String,
        interval: req.body.interval,
        binAddress: req.body.binAddress,
        zoneID: req.body.zoneID,
        binStatus: req.body.binStatus,
        binClearDates: req.body.binClearDates,
        notes: req.body.notes,
        customID: req.body.customID
    });

    entry.save(function (err1, resp) {
        if (err1) { console.log(err1);}
        res.send([resp]);
    });

    


});


module.exports = router;