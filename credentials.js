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
var  credentials ={

	viewer_credentials: {
		credentials:
			{
				// Replace placeholder below by the Consumer Key and Consumer Secret you got from
				// http://developer.autodesk.com/ for the production server
				client_id:  '<Your Key of Viewer>',
				client_secret:   'You Secret of Viewer>',
				grant_type: 'client_credentials'
			},			
			// If you which to use the Autodesk View & Data API on the staging server, change this url
			BaseUrl: 'https://developer.api.autodesk.com',
			Version: 'v1',
			BucketNameStr: '<Your Bucket Name>',
			ViewerGetTokenSrv: '/authentication/v1/authenticate',
			ViewerUploadFileSrv: '/oss/v1/buckets',
			ViewerTranslationSrv: '/viewingservice/v1/register',
		    ViewerCheckStatusSrv: '/viewingservice/v1',
	},
	IO_credentials: {
		credentials:
			{
				// Replace placeholder below by the Consumer Key and Consumer Secret you got from
				// http://developer.autodesk.com/ for the production server
				client_id:  '<Your Key of AutoCAD IO>',
				client_secret:   'You Secret of AutoCAD IO>',
				grant_type: 'client_credentials'
			},
			// your urls of source DWG and updated Json
			// in my test sample, I create a HTTP call that can return the DWG and Json on the server, given the file name.
			SourceDWGUrl: function(filename){return "https://adnxddwgsig.herokuapp.com/getdwgfile/"+filename;},
			ExternalJsonUrl: function(filename){return "https://adnxddwgsig.herokuapp.com/getjsonfile/"+filename;},
			
			//Your Activities name.
			// generate the attribute json for the new DWG
			actid_genjson : 'Act_DWGSignature_GenJson',
			//update the title block attributes with the new json
			actid_updatetb : 'Act_DWGSignature_UpdateTB',

			// If you which to use the AutoCAD IO on the staging server, change this url
			BaseUrl: 'https://developer.api.autodesk.com',
			Version: 'v2',
		    IOGetTokenSrv: '/authentication/v1/authenticate',
			IOActivitySrv:'/autocad.io/us-east/v2/Activities',
		    IOWorkItemSrv: '/autocad.io/us-east/v2/WorkItems',
		    IOPackageSrv:'/autocad.io/us-east/v2/AppPackages',
			IOGetPackageURLSrv:'/autocad.io/us-east/v2/AppPackages/Operations.GetUploadUrl',
			IOUploadPackageSrv:'/autocad.io/us-east/v2/AppPackages/Operations.GetUploadUrl(RequireContentType=true)'
	},
} ;

 
module.exports = credentials ;
