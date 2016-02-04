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

//urn for default file
var defaultUrn = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6eGlhb2Rvbmd0ZXN0YnVja2V0L0RlZmF1bHREZW1vLmR3Zw==';
//default file
var _currentFileName = 'DefaultDemo.dwg';
//json of attributes. default is for 'DWG_Mech_iso.dwg'
var drawing_raw_jsonData = '{"tbjson":[{"tag":"GEN-TITLE-DWG{13.6}","height":"3","width_ratio":"13.6","position":"3495.11735931149,1283.16459408962,0","content":"Drawing2","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-SCA{12.7}","height":"3","width_ratio":"12.7","position":"3618.75003917539,1283.26050386328,0","content":"1:1","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-DAT{7.1}","height":"3","width_ratio":"7.1","position":"3504.50771338907,1272.35812316958,0","content":"2015/10/17","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-NAME{14.9}","height":"3","width_ratio":"14.9","position":"3527.76042212433,1272.35812316958,0","content":"kh","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-DES1{12.3}","height":"6","width_ratio":"12.3","position":"3578.56437772605,1261.06388890014,0","content":"","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-DES2{24.5}","height":"3","width_ratio":"24.5","position":"3578.59003577605,1255.57091762878,0","content":"","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-NR{12.3}","height":"6","width_ratio":"12.3","position":"3578.72788457683,1241.76210687743,0","content":"-","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-DACT{21}","height":"3.5","width_ratio":"21","position":"3578.59003577978,1273.26458502583,0","content":"","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-FSCM{8.6}","height":"3","width_ratio":"8.6","position":"3543.48691740784,1283.16459408962,0","content":"","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-APPM{14.9}","height":"3","width_ratio":"14.9","position":"3527.76042212433,1260.29880878792,0","content":"","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-APPD{7.1}","height":"3","width_ratio":"7.1","position":"3504.50771338907,1260.29880878792,0","content":"","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-ISSM{14.9}","height":"3","width_ratio":"14.9","position":"3527.76042212433,1254.21208244699,0","content":"","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-ISSD{7.1}","height":"3","width_ratio":"7.1","position":"3504.50771338907,1254.21208244699,0","content":"","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-SIZ{22.6}","height":"3","width_ratio":"22.6","position":"3504.50771338907,1278.35812316958,0","content":"A3","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-CHKM{14.9}","height":"3","width_ratio":"14.9","position":"3527.76042212433,1266.27139682865,0","content":"","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-CTRN{19.4}","height":"3.5","width_ratio":"19.4","position":"3504.50771338907,1242.21208244699,0","content":"","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-CHKD{7.1}","height":"3","width_ratio":"7.1","position":"3504.50771338907,1266.27139682865,0","content":"","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-SHEET{11.8}","height":"3","width_ratio":"11.8","position":"3577.13817821117,1283.23335488896,0","content":"","isImage":false,"imageName":"","imgbase64":""},{"tag":"GEN-TITLE-REV{22.6}","height":"3","width_ratio":"22.6","position":"3504.50771338907,1248.21208244699,0","content":"","isImage":false,"imageName":"","imgbase64":""}]}';
//download url for result file from work item of IO: json or dwg
var _currentDownloadUrl = 'none';
//download url for report file from work item of IO: log
var _currentReportUrl = 'none';
//current result type;
var _currentResultType = 'none';

//viewer object
var _viewer;
var _adnViewerMng;
//sigature panel
var _sigPanel;

//----------------windows loading-----------------------------
window.onload = function init() {
     
};//window.onload

//----------------document loading-----------------------------
$(document).ready(function () {
	 
	//load a default drawing 
	iniViewerFactory(defaultUrn); 
	//ini default attribute map
	getAttMap(); 	
	 
}); //$(document).ready

function iniViewerFactory(thisUrn){
     var tokenurl = 'http://' + window.location.host + '/viewroute/token';
	 _adnViewerMng = new Autodesk.ADN.Toolkit.Viewer.AdnViewerManager(
                tokenurl,
                document.getElementById('viewerDiv'));

	var paramUrn = Autodesk.Viewing.Private.getParameterByName('urn');
	urn = (paramUrn !== '' ? paramUrn : thisUrn);
	if (urn.substring(0,4)!="urn:")
		urn = 'urn:' + urn;
	_adnViewerMng.loadDocument(urn, onViewerInitialized, onError); 			 
} 

var onViewerInitialized = function(viewer) {
	//export the viewer object to global object
	_viewer = viewer;
	_viewer.addEventListener(
		Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
		function (event) {
			//_viewer.setBackgroundColor(127, 255, 212, 0,0, 0);
			var options = {};
			_sigPanel = new Autodesk.ADN.Viewing.Extension.UIComponent(_viewer, options);
			_sigPanel.load();
		});

	$(_viewer.container).bind("click", this.onMouseClick);

	document.getElementById('viewerDiv').addEventListener("touchstart", this.onTouchStart);

}


//when ini viewer failed
var onError = function(error){
	console.error("initial viewer failed: " + error);
};


var drawing_raw_jsonData; 
var drawing_att_map; 
 
 //build the attribute map from the raw json
function getAttMap(){ 
		
	drawing_att_map = new Array();
	
	var att_array = eval('(' + drawing_raw_jsonData + ')').tbjson;
	
	//data of each attribute
	for(var eachAtt in att_array)
	{
		var att_pos = att_array[eachAtt].position.split(','); 
		var att_height = parseFloat(att_array[eachAtt].height);
		var att_width_ratio = parseFloat(att_array[eachAtt].width_ratio);
		
		var att_tag = att_array[eachAtt].tag;
		var att_content = att_array[eachAtt].content;
		
		//calculate the range of the attribute
		var att_pos_1_x = parseFloat(att_pos[0]);
		var att_pos_1_y = parseFloat(att_pos[1]);
		
		var att_pos_2_x = att_pos_1_x + att_height * att_width_ratio;
		var att_pos_2_y = att_pos_1_y ;
		
		var att_pos_3_x = att_pos_1_x + att_height * att_width_ratio;
		var att_pos_3_y = att_pos_1_y + att_height;
		
		var att_pos_4_x = att_pos_1_x;
		var att_pos_4_y = att_pos_1_y + att_height;  
		
		var thisAttPosArray = [];
		thisAttPosArray.push(att_content);	 
		thisAttPosArray.push(att_pos_1_x);
		thisAttPosArray.push(att_pos_1_y);
		thisAttPosArray.push(att_pos_2_x);
		thisAttPosArray.push(att_pos_2_y);
		thisAttPosArray.push(att_pos_3_x);
		thisAttPosArray.push(att_pos_3_y);
		thisAttPosArray.push(att_pos_4_x);
		thisAttPosArray.push(att_pos_4_y);	 
	
		//add the data to the map
		drawing_att_map[att_tag] = thisAttPosArray; 	 
	}	
}


//this is for mouse click or touch

function whenclick(screenPoint) {
	//get the clicked point in WCS of this drawing

	var nn = normalizeCoords(screenPoint);
	var sheetPt = _viewer.navigation.getWorldPoint(nn.x,nn.y);
 	var clickPt =
	{
		x:sheetPt.x,
		y:sheetPt.y,
		z:sheetPt.z
	};

	_viewer.model.pageToModel(clickPt,0);
 	//check which attribute range this point locates at
	var found = false;
	for(var att_tag in drawing_att_map){
		if( clickPt.x > drawing_att_map[att_tag][1] &&
			clickPt.x < drawing_att_map[att_tag][3] &&
			clickPt.y > drawing_att_map[att_tag][2] &&
			clickPt.y < drawing_att_map[att_tag][6])
		{
			//notify the panel of signature to refresh
			console.log('tag: ' + att_tag);
			var att_content = drawing_att_map[att_tag][0];
			_sigPanel.getPanel().refreshTag(att_tag,att_content);
			found = true;
		}
	}
}
//when mouse click  
function onMouseClick(event) {

	var screenPoint = {
		x: event.clientX,
		y: event.clientY
	};
	whenclick(screenPoint);
}

//when touch on mobile
function onTouchStart(event) {
	var screenPoint = {
		x: event.changedTouches[0].clientX,
		y: event.changedTouches[0].clientY
	};
	alert('touch');
	whenclick(screenPoint);
}



//help function for screen point to WCS point	
this.normalizeCoords = function(screenPoint) {

	var viewport =
		_viewer.navigation.getScreenViewport(); 

	var n = {
		x: (screenPoint.x - viewport.left) / viewport.width,
		y: (screenPoint.y - viewport.top) / viewport.height
	};

	return n;
}
 