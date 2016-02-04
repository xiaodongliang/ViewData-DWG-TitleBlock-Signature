/////////////////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Xiaodong Liang 2015 - ADN/Developer Technical Services
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
var credentials =(require ('fs').existsSync ('credentials.js') ?
	require('../credentials')
	: (console.log ('Bad credentials.js file'), require('../credentials_'))) ;
var express =require ('express') ;
var request =require ('request') ;
var fs = require('fs');
var Q = require('q');
var router =express.Router () ;
var Helper = require('./Helper.js');
var viewerR = require('../routes/ViewRoute');


var _DWGFolder = './uploads/drawings/';
var _TempFolder = './uploads/temp/';

var _filesMap = new Array();


var _currentDWGTJson = '';

//********requests************
router.get('/getCurrentDWGTJson',function (req, res) {
	res.send({data:_currentDWGTJson});
});

router.post('/updateRunStatus',function (req, res) {

	var filename = req.body.filename;

	if (filename in _filesMap) {
		_filesMap[filename] = false;
	}
	res.send('ok');
});


router.post('/GenerateTBJson',function (req, res) {

	var filename = req.body.filename;

	var dirList = fs.readdirSync(_DWGFolder);
	var found = false;
	dirList.forEach(function(eachfile){

		console.log(new Date().toISOString() +　'each file on drawings folder>>' + eachfile);
		if(eachfile==filename){
			console.log(new Date().toISOString() +　" found drawing>>" +filename );
			found = true;
		}
	});
	if(!found){
		console.log(new Date().toISOString() +　" no such drawing on server!>>" +filename );
		res.send({success:false,data:'no such drawing on server!>>'+filename });
		req.end();
	}


	if (filename in _filesMap) {
	}
	else {
		//add status for a new file
		_filesMap[filename] = false;
	}

	//is running a job for this file?
	if(_filesMap[filename]){
		console.log('a job is running! Plese wait a moment and try again.');
		res.send({success:false,data:'a job is running! Plese wait a moment and try again.' });
		req.end();
	}

	_filesMap[filename] = true;
	var arg = {token:'',
				filename:filename,
				resulttype:'json',
				workitemid:'',
 				msg:''
			   };
	
	getIOToken(arg)
		.then(function(arg1){
			console.log(new Date().toISOString() +'>>To Create Workitem for getting json of TB');
			return WorkItem_For_Act_Gen_Json(arg1);
		})
		.done(function(arg1){
			console.log(new Date().toISOString() +'>>create workitem ok. waiting for succees');

			checkWorkItem(arg1.token, arg1.workitemid,
				function(result, report) {
					if (result) {
						getWorkItemResult(result,arg1.resulttype,arg1.filename)
					}
					if (report) {
						getWorkItemLog(report);
					}
					res.send({success:true,data:{resulturl:result,reporturl:report}});

				},
				function (report) {
					getWorkItemLog(report);
					_filesMap[filename] = false;
					res.send({success:false,reporturl:report});

				}
			);
		},function(err){
			console.log(new Date().toISOString() +'>>create workitem failed>>' +err);
			_filesMap[filename] = false;
			res.send({success:false,data:err});

		});
});


router.post('/updateTBFromJson',function (req, res) {

	var filename = req.body.filename;
	var jsonfile =  req.body.jsonfile;

	if (filename in _filesMap) {
	}
	else {
		//add status for a new file
		_filesMap[filename] = false;
	}
	//is running a job for this file?
	if(_filesMap[filename]){
		console.log('a job is running! Plese wait a moment and try again.');
		res.send({success:false,data:'running' });
		req.end();
	}

	_filesMap[filename] = true;

	fs.writeFile(_DWGFolder + filename + '.json', jsonfile,   function (err) {
		console.log('updated ' + _DWGFolder + filename + '.json' + ' on server');
	});

	var arg = {token:'',
				filename:filename,
				resulttype:'dwg',
				workitemid:'',
 				msg:''
			};

	getIOToken(arg)
		.then(function(arg1){
			console.log(new Date().toISOString() +'>>To Create Workitem for updating DWG');
			return WorkItem_For_Act_Update_TB(arg1);
		})
		.done(function(arg1){
			console.log(new Date().toISOString() +'>>create workitem ok. waiting for succees');

			checkWorkItem(arg1.token,
				          arg1.workitemid,
						function(result, report) {
							if (result) {
								getWorkItemResult(result,arg1.resulttype,arg1.filename);
							}
							if (report) {
								getWorkItemLog(report);
							}
							res.send({success:true,data:{resulturl:result,reporturl:report}});
				},
				function (report) {
					getWorkItemLog(report);
					_filesMap[filename] = false;
					res.send({success:false,data:report});
				}
			);

		},function(err){
			console.log(new Date().toISOString() +'>>create workitem failed>>' +err);
			_filesMap[filename] = false;
			res.send({success:false,data:err});
		});
});



//**********AutoCAD IO****************
var _aliveToken = '' ;
var _tokenExpire = 1799;
var _tokenStartSecond = 0;

var _argForView ={xreffilearray:[],
					maindwgpath:"",
					maindwgname: "",
					mainDWGUrn:''
					};

function getIOToken(arg){

	var deferred = Q.defer();

	var currentSecond = new Date().getTime() / 1000;
	if(currentSecond - _tokenStartSecond < _tokenExpire ){
		arg.token = _aliveToken;
		deferred.resolve(arg);
	}
	else{
		var acadio_get_token_srv =  credentials.IO_credentials.BaseUrl +
									credentials.IO_credentials.IOGetTokenSrv;
		var options = {
			method: 'POST',
			uri: acadio_get_token_srv,
			headers:{'Content-Type': 'application/x-www-form-urlencoded'},
			form: credentials.IO_credentials.credentials
		};

		request.post(options,
			function optionalCallback(err, httpResponse, body) {

				if(err){
					console.log(new Date().toISOString() +'>>getIOToken error');
					arg.msg += 'get token error!>>' + err + '\n';
					deferred.reject(arg);
				}
				else{
					if(httpResponse.statusCode == 200){
						var json = eval('(' + body + ')');
						console.log(new Date().toISOString() + '>>Get IO Token ok:' + json.access_token);

						//store the global time stamp for alive token
						_aliveToken = json.access_token;
						_tokenStartSecond = new Date().getTime() / 1000;

						arg.token = json.access_token;
						arg.msg += 'get token succeeded!>>' + arg.token.length + '>>\n';
						deferred.resolve(arg);
					}
					else{
						console.log(new Date().toISOString() +'>>Get IO Token Failed!');
						arg.msg += 'get token failed!>>' + httpResponse.statusCode + '\n';
						deferred.reject(arg);
					}
				}
				return deferred.promise;
			});
	}

	return deferred.promise;

}

function WorkItem_For_Act_Gen_Json(arg){


	console.log('dwg:' + credentials.IO_credentials.SourceDWGUrl(arg.filename));

	var deferred = Q.defer();

	var acadio_create_workitem_srv =  credentials.IO_credentials.BaseUrl +
		                              credentials.IO_credentials.IOWorkItemSrv;

	var activityName = arg.actname;

	var inputArguments = {
		Id:'',
		ActivityId:credentials.IO_credentials.actid_genjson ,
		Arguments:{
			InputArguments:[{
				Name: 'HostDwg',
				Resource: credentials.IO_credentials.SourceDWGUrl(arg.filename),
				StorageProvider:'Generic'
			}],
			OutputArguments:[{
				Name:'Result',
				StorageProvider:'Generic',
				HttpVerb: 'POST' ,
				"Resource":null
			}]
		}
	};

	var dataStr = JSON.stringify(inputArguments);

	var options = {
		method: 'POST',
		uri: acadio_create_workitem_srv,
		headers:{'Authorization': 'Bearer ' + arg.token,'Content-Type': 'application/json'},
		body: dataStr
	};

	request.post(options,
		function optionalCallback(err, httpResponse, body) {
			if(err){
				console.log(new Date().toISOString() +'>>createIOWorkItem error!!');
				arg.msg += 'createIOWorkItem error!>>' + err + '\n';
				deferred.reject(arg);
			}
			else{
				if(httpResponse.statusCode == 200 ||
					httpResponse.statusCode == 201){

					var json = eval('(' + body + ')');
					var wi_user_id  =  json.UserId;
					var wi_id = json.Id;

					console.log(new Date().toISOString() +'>>createIOWorkItem succeeded!!');
					arg.workitemid = wi_id;
					arg.msg += 'createIOWorkItem succeeded!>>\n';

					deferred.resolve(arg);
				}
				else{
					console.log(new Date().toISOString() +'>>createIOWorkItem Failed!!>>' +  httpResponse.statusCode);
					arg.msg += 'createIOWorkItem failed!>>' + httpResponse.statusCode + '\n';
					deferred.reject(arg);
				}
			}
			return deferred.promise;

		});

	return deferred.promise;

}



function WorkItem_For_Act_Update_TB(arg){

	var deferred = Q.defer();

	var acadio_create_workitem_srv =  credentials.IO_credentials.BaseUrl +
										credentials.IO_credentials.IOWorkItemSrv;

	console.log('dwg:' + credentials.IO_credentials.SourceDWGUrl(arg.filename));
	console.log('json:' +credentials.IO_credentials.ExternalJsonUrl (arg.filename +'.json'));
	var inputArguments = {
		Id:'',
		ActivityId:credentials.IO_credentials.actid_updatetb ,
		Arguments:{
			InputArguments:[{
				Name: 'HostDwg',
				Resource: credentials.IO_credentials.SourceDWGUrl(arg.filename),
				StorageProvider:'Generic'
			},
			{
				Name: 'ExtUrl',
				Resource: credentials.IO_credentials.ExternalJsonUrl(arg.filename +'.json'),
				StorageProvider:'Generic'
			}
			],
			OutputArguments:[{
				Name:'Result',
				StorageProvider:'Generic',
				HttpVerb: 'POST' ,
				"Resource":null
			}]
		}
	};

	var dataStr = JSON.stringify(inputArguments);

	var options = {
		method: 'POST',
		uri: acadio_create_workitem_srv,
		headers:{'Authorization': 'Bearer ' + arg.token,'Content-Type': 'application/json'},
		body: dataStr
	};

	request.post(options,
		function optionalCallback(err, httpResponse, body) {
			if(err){
				console.log(new Date().toISOString() +'>>createIOWorkItem error!!>>' + err);
				arg.msg += 'createIOWorkItem error!>>' + err + '\n';
				deferred.reject(arg);
			}
			else{
				if(httpResponse.statusCode == 200 ||
					httpResponse.statusCode == 201){

					var json = eval('(' + body + ')');
					var wi_user_id  =  json.UserId;
					var wi_id = json.Id;

					console.log(new Date().toISOString() +'>>createIOWorkItem succeeded!!');
					arg.workitemid = wi_id;
					arg.msg += 'createIOWorkItem succeeded!>>\n';

					deferred.resolve(arg);
				}
				else{
					console.log(new Date().toISOString() +'>>createIOWorkItem Failed!!>>' + httpResponse.statusCode);
					arg.msg += 'createIOWorkItem failed!>>' + httpResponse.statusCode + '\n';
					deferred.reject(arg);
				}
			}
			return deferred.promise;

		});

	return deferred.promise;

}

function checkWorkItem(auth, workitemid, success, failure) {

	console.log('Checking status for work item ' + workitemid);

	var checked = 0;

	var check = function() {
		setTimeout(
			function() {
				var acadio_get_workitem_srv =  credentials.IO_credentials.BaseUrl +
												credentials.IO_credentials.IOWorkItemSrv +
												'(\''+ workitemid + '\')';;

				var options = {
					method: 'GET',
					uri: acadio_get_workitem_srv,
					headers:{'Authorization': 'Bearer ' + auth},
				};

				request.get(options,
					function optionalCallback(err, httpResponse, body)  {

						if (err) throw err;

						if (httpResponse.statusCode == 200) {
							var workItem2 = JSON.parse(body);

							console.log('Checked status: ' + workItem2.Status);

							switch (workItem2.Status) {
								case 'InProgress':
								case 'Pending':
									if (checked < 20) {
										checked++;
										check();
									} else {
										console.log('Reached check limit.');
										failure('Reached check limit.');
									}
									break;
								case 'FailedDownload':
									console.log('Failed to download!');
									failure(workItem2.StatusDetails.Report);
									break;
								case 'Succeeded':
									success(workItem2.Arguments.OutputArguments[0].Resource, workItem2.StatusDetails.Report);
									break;
								default:
									console.log('Unknown status: ' + workItem2.Status);
									failure(workItem2.StatusDetails.Report);
							}
						}
					});
			},
			2000
		);
	}
	check();
}



function getWorkItemLog(reporturl) {

	var options = {
		method: 'GET',
		uri: reporturl
	};

	request.get(options,
		function optionalCallback(err, httpResponse, body) {
			if(err){
			}
			else{
				if(httpResponse.statusCode == 200){

					fs.writeFile(_TempFolder +'workreport.log', body, function (err) {
						console.log('workreport > workreport.log');
					});
				}
				else{

				}
			}
		});

}

function getWorkItemResult(downloadurl,resulttype,filename) {

	var options = {
		method: 'GET',
		uri: downloadurl,
		encoding: null
	};

	console.log(downloadurl);

	request.get(options,
		function optionalCallback(err, httpResponse, body) {
			if(err){
				console.log(new Date().toISOString() + ' ' + err);
			}
			else{
				if(httpResponse.statusCode == 200){

					console.log(new Date().toISOString() + 'result file from IO >>length: ' + body.length);

					if(resulttype == 'json'){
						_currentDWGTJson = body.toString();

						fs.writeFile(_DWGFolder + filename + '.json', body,   function (err) {
							console.log('saved ' + guidname + ' on server');
						});
					}
					else if (resulttype == 'dwg'){
						//var guidname = Helper.newGuid() + filename;
						var guidname = filename;
						fs.writeFile(_DWGFolder +guidname, body,   function (err) {
							console.log('saved ' + guidname + ' on server');
						});
						_argForView.maindwgpath = _DWGFolder + guidname;
						_argForView.maindwgname = guidname;
					}
					else {
					}
				}
				else{
					console.log(new Date().toISOString() + 'get result file from IO failed>> ' + err);
				}
			}
		});

}

router.post('/callViewerTranslateFromIO', function (req, res) {
	_argForView.maindwgname =req.body.filename;;
	_argForView.maindwgpath = _DWGFolder +_argForView.maindwgname ;
	viewerR.routeForIOWithoutXref(_argForView,res);
});


module.exports =router ;