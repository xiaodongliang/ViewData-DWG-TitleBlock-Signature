/////////////////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Xiaodong Liang 2016 - ADN/Developer Technical Services
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////////////////


var favicon = require('serve-favicon');
var ViewRoute = require('./routes/ViewRoute');
var IORoute = require('./routes/IORoute');
var express = require('express');
var bodyParser = require("body-parser");
var multer = require('multer');
var app = express();

app.use('/', express.static(__dirname + '/www'));
app.use(favicon(__dirname + '/www/images/favicon.ico'));

app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({limit: '5mb'}));

app.use('/ViewRoute', ViewRoute);
app.use('/IORoute', IORoute);


app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'https://adnxddwgsigature.herokuapp.com/');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
var done = false;

app.use(multer( {dest:'./uploads/drawings/',
    rename:function(fieldname,filename){
        console.log('Field Name value ',fieldname);
        console.log('Field Name value ',filename);
        return filename;
    },
    onFileUploadStart : function(file){
        console.log('Upload File Started');
        console.log(file);
    },
    onFileUploadData:function (file,data){
        console.log('Upload File Recieved');
    },
}));

 app.post('/uploadnewfile', function (req, res) {
    console.dir(req.files);
    res.send('Upload New File OK!' + req.files[0] );
}) ;

var _DWGFolder = './uploads/drawings/';
 app.get('/getdwgfile/:id', function (req, res) {
     console.log(req.params.id);
    res.download(_DWGFolder + req.params.id,req.params.id );
 }) ;

app.get('/getjsonfile/:id', function (req, res) {
    console.log(req.params.id);
    res.download(_DWGFolder + req.params.id,'ExtUrl.json' );
}) ;


app.set('port', process.env.PORT || 8080 );

var server = app.listen(app.get('port'), function() {
    console.log('Server listening on port ' + server.address().port);
});
