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


var fs = require('fs'); 
var credentials =(fs.existsSync ('credentials.js') ?
           require('../credentials')
         : (console.log ('No credentials.js file present, assuming using CONSUMERKEY & CONSUMERSECRET system variables.'), require('../credentials_'))) ;
var express =require ('express') ;
var request =require ('request') ;  
var Q = require('q');
var router =express.Router () ; 
var Helper = require('./Helper.js');


//active token that is alive
var _aliveToken = '' ;
//expire time of a token
var _tokenExpire = 1799;
//alive token life
var _tokenStartSecond = 0;
 

// Generates viewer access token 
router.get ('/token', function (req, res) {
	console.log(new Date().toISOString() +'>>' + 'Get Viewer Token');	
	
	var arg = {token:'' };			   
	
	getViewerToken(arg)		 
		.done(function(thisarg){
					console.log(new Date().toISOString() +'>>Get Viewer Token OK');
					console.log(thisarg);
					 res.send ({access_token:arg.token}) ;
			   },function(err){
					console.log(new Date().toISOString() +'>>Get Viewer Token Failed');
					res.send (err) ;
			   });  
	 
}) ; 

//for IO invoke
router.routeForIOWithoutXref = function(inputargFromIO,res){
	
	console.log(new Date().toISOString() +'>routeForIOWithoutXref is called!'); 
			   
			   
	var arg = {token:'',
			   fullfilename:inputargFromIO.maindwgpath, 
			   filename:inputargFromIO.maindwgname,
			   isMainDWG:true,
			   fileblob:'',
			   viewurn:'',
			   regstarted:false};
			   
	getViewerToken(arg)
		.then(function(thisarg){
			  console.log(new Date().toISOString() +'>>to read file');			  
			  return myReadFile(thisarg);
			})
		 .then(function(thisarg){
			  console.log(new Date().toISOString() +'>>to upload view file ');
			  return uploadViewerFile(thisarg);
			})
			.then(function(thisarg){
			  console.log(new Date().toISOString() +'>>to register view file');
			  return registerViewerFile(thisarg);
			})
		.done(function(thisarg){
					console.log(new Date().toISOString() +'>>translateFile call ok'); 
					console.log(thisarg);
					 console.log(new Date().toISOString() +'>>check register status....'); 

					 checkRegisterStatus(thisarg.token, thisarg.viewurn,
							function() {
								console.log("Register Status OK!" + thisarg.viewurn );
							   res.send({success:true,data:thisarg.viewurn}); 
							},
							function (err) {
								console.log("Register Status Bad!>>" + err + '>>'+  thisarg.viewurn );
							   res.send({success:false,data:err}); 
							}
						  ); 
					 
			   },function(err){
					console.log(new Date().toISOString() +'>>translateFile call failed>>' + err);
					res.send({success:false,data:err}); 
			   }); 
			   
}


//get viwer token
var getViewerToken = function(arg){

	var deferred = Q.defer();
 	
	//if the last token is still alive
	var currentSecond = new Date().getTime() / 1000;
	if(currentSecond - _tokenStartSecond < _tokenExpire ){
		 arg.token = _aliveToken;
		 deferred.resolve(arg);		
	}
	else{
		var acadio_get_token_srv =   credentials.viewer_credentials.BaseUrl +
									 credentials.viewer_credentials.ViewerGetTokenSrv;

		var options = {
			method: 'POST',
			uri: acadio_get_token_srv,
			headers:{'Content-Type': 'application/x-www-form-urlencoded'}, 
			form: credentials.viewer_credentials.credentials	
		}; 
			
		request.post(options, 					
			 function optionalCallback(err, httpResponse, body) {
				  
				 if(err){
					var msg = '>>Get Viewer Token Failed!>>' + err ;
					console.log(new Date().toISOString() + msg);	
 					deferred.reject(msg);	
				 }
				 else{
					 if(httpResponse.statusCode == 200){
						var json = eval('(' + body + ')'); 
						 console.log(new Date().toISOString() + '>>Get Viewer Token ok:' + json.access_token);		
						 
						 //store the global time stamp for alive token
						 _aliveToken = json.access_token;
						 _tokenStartSecond = new Date().getTime() / 1000;
						 
						 //pass the token to the next promise
						 arg.token = json.access_token;						 
						 deferred.resolve(arg);					 
					 }
					 else{			
							var msg = '>>Get Viewer Token Failed!>> response code:' + httpResponse.statusCode ;
							console.log(new Date().toISOString() + msg);	
 							deferred.reject(msg);					   
					 }
				}
				return deferred.promise;			
			}); 
	} 
		
	return deferred.promise;
}

//read the binary file to blob
var myReadFile = function(arg){
	var deferred = Q.defer();
    fs.readFile(arg.fullfilename,function(err,blobdata){
        
        if(!err){
			console.log(new Date().toISOString() +'>>myReadFile ok>>' + arg.fullfilename);
			arg.fileblob =  blobdata;
            deferred.resolve(arg);
        }else{
			var msg = '>>myReadFile Failed!>>'+ arg.fullfilename+ '>>' + err ;
			console.log(new Date().toISOString() + msg);	
			deferred.reject(msg);				
        }
        return deferred.promise;
    });
	
	return deferred.promise;
}

//upload file to viewer server
function uploadViewerFile(arg){

	var deferred = Q.defer();
	
	var view_upload_srv_Str =  credentials.viewer_credentials.BaseUrl +
								credentials.viewer_credentials.ViewerUploadFileSrv + '/' +
								credentials.viewer_credentials.BucketNameStr +
								 '/objects/' + arg.filename;
	var options = {
		method: 'PUT',
		uri: view_upload_srv_Str,
		headers:{ 'Authorization': 'Bearer ' + arg.token,
				 'Content-Type': 'application/stream' }, 
		  body:arg.fileblob
	}; 
	
	  request.put(options, 
				 function optionalCallback(err, httpResponse, body) {					  
				 
					 if(err){
						var msg = '>>uploadViewerFile Failed!>>'+ arg.fullfilename+ '>>' + err ;
						console.log(new Date().toISOString() + msg);	
						deferred.reject(msg);	
					}
					else{
						if(httpResponse.statusCode == 200){
							var json = eval('(' + body + ')');  
							var base64URN  =   Helper.Base64.encode(json.objects[0].id); 
							
							var str  = '>>uploadViewerFile ok!>>' + base64URN;
							console.log(new Date().toISOString() +str);	
							
							if(arg.isMainDWG)
								arg.viewurn = base64URN;
							arg.fileblob = ''; 
							deferred.resolve(arg);		
 						}
						else{
							var msg = '>>uploadViewerFile Failed!>> response code:' + httpResponse.statusCode ;
							console.log(new Date().toISOString() + msg);	
 							deferred.reject(msg);		
						}
					}
					return deferred.promise;
			 }); 
	return deferred.promise;
} 



//start to register file
function registerViewerFile(arg){

	var deferred = Q.defer(); 
								
	var view_trans_srv_Str = credentials.viewer_credentials.BaseUrl +
							credentials.viewer_credentials.ViewerTranslationSrv;
								
	var jsonStr = {'urn': arg.viewurn};						 
	var dataStr = JSON.stringify(jsonStr);
	
	var options = {
		method: 'POST',
		uri: view_trans_srv_Str,
		headers:{ 'Authorization': 'Bearer ' + arg.token,
				 'Content-Type': 'application/json; charset=utf-8',
				 'x-ads-force':'true'				 },
		
		body:dataStr
	}; 
	
	 request.post(options, 
		function optionalCallback(err, httpResponse, body) {
				if(err){
					 var msg = '>>registerViewerFile Failed!>>'+ arg.fullfilename+ '>>' + err ;
						console.log(new Date().toISOString() + msg);	
						deferred.reject(msg);	
				}
				else{
				   if(httpResponse.statusCode == 200 ||
						httpResponse.statusCode == 201){ 
						
						 var msg = '>>registerViewerFile OK!>> response code:' + httpResponse.statusCode ;
						console.log(new Date().toISOString() + msg);	
						
						arg.regstarted = true;	
						deferred.resolve(arg);	
					  }
					  else{
					   var msg = '>>registerViewerFile Failed!>> response code:' + httpResponse.statusCode ;
						console.log(new Date().toISOString() + msg);	
						deferred.reject(msg);	
					  }
				}
				 return deferred.promise;
											 
		 });  
		 
		 return deferred.promise;

}
 
 function checkRegisterStatus(token, viewurn, success, failure) {

  console.log('Checking status for RegisterStatus ' + viewurn);

  var checked = 0;
  
  var check = function() {
    setTimeout(
      function() {
        var view_trans_srv_Str =	credentials.viewer_credentials.BaseUrl +
									credentials.viewer_credentials.ViewerCheckStatusSrv  + '/' +
									viewurn;
		console.log(view_trans_srv_Str);
			
		var options = {
			method: 'GET',
			uri: view_trans_srv_Str,
			headers:{ 'Authorization': 'Bearer ' + token} 
		}; 
	
         request.get(options, 
			  function optionalCallback(error, httpResponse, body) {
  
				if (error) throw error;
  
				if (httpResponse.statusCode == 200) {
						var json = eval('(' + body + ')'); 
						var status = json.status; 		 
						var progress = json.progress; 
			  
						switch (status) {
						  case 'inprogress':
						  case 'pending':
							if (checked < 10) {
							  checked++;
							  check();
							} else {
 							  var msg = 'Reached check limit.' ;
							  console.log(new Date().toISOString() + msg);
							  failure(msg); 
							}
							break; 
						  case 'success':
							success();
							break;
						  default:
						   var msg = 'Unknown register status: ' + status  ;
							console.log(new Date().toISOString() + msg);
							failure(msg); 
						}
				}
				else{
					 var msg = 'bad Response of Register Status: ' + httpResponse.statusCode  ;
					console.log(new Date().toISOString() + msg);
					failure(msg);
				}
        });
      },
      2000
    );
  }
  check();
}



 module.exports =router ;