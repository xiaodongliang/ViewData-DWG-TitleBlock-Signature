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
////////////////////////////////////////////////////////////////////////////////-->

AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

Autodesk.ADN.Viewing.Extension.UIComponent = function (viewer, options) {

    Autodesk.Viewing.Extension.call(this, viewer, options);

    var _panel = null;
    this.getPanel = function () {
        return _panel;
    }

    var _OnOff = true;

    function onShowPanel() {
        _panel.setVisible(_OnOff);
        _OnOff = !_OnOff;
    }

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    this.load = function () {

        var buttons = [{name: 'NewDraw', ratio: '20%'},
            {name: 'ShowPanel', ratio: '40%'},
            {name: 'UpdateDraw', ratio: '60%'},
            {name: 'DownloadDWG', ratio: '80%'}];

        for (var index in buttons) {
            var ctrlGroup = getControlGroup(buttons[index].name, buttons[index].ratio);
            createControls(ctrlGroup, buttons[index].name);
        }

        _panel = new Autodesk.ADN.Viewing.Extension.UIComponent.Panel(
            viewer.container,
            newGUID());

        console.log('UIComponent loaded');

        return true;
    };

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    this.unload = function () {

        try {

            var toolbar = viewer.getToolbar(true);

            toolbar.removeControl(
                'Autodesk.ADN.UIComponent.ControlGroup');
        }
        catch (ex) {
            $('#divUIComponentToolbar').remove();
        }

        console.log('Autodesk.ADN.Viewing.Extension.UIComponent unloaded');

        return true;
    };

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    function getControlGroup(ctrlName, leftratio) {

        var toolbar = null;

        try {
            toolbar = viewer.getToolbar(true);

            if (!toolbar) {
                toolbar = createDivToolbar(ctrlName, leftratio);
            }
        }
        catch (ex) {
            toolbar = createDivToolbar(ctrlName, leftratio);
        }

        var control = toolbar.getControl(
            'Autodesk.ADN.UIComponent' + ctrlName);

        if (!control) {
            control = new Autodesk.Viewing.UI.ControlGroup(
                'Autodesk.ADN.UIComponent' + ctrlName);
            toolbar.addControl(control);
        }

        return control;
    }

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    function createDivToolbar(ctrlName, ratio) {

        var toolbarDivHtml =
            '<div id="divUIComponentToolbar' + ctrlName + '"> </div>';

        $(viewer.container).append(toolbarDivHtml);

        $('#divUIComponentToolbar' + ctrlName).css({
            'bottom': '0%',
            //'left': '50%',
            'left': ratio,
            'z-index': '100',
            'position': 'absolute'
        });

        var toolbar = new Autodesk.Viewing.UI.ToolBar(true);

        $('#divUIComponentToolbar' + ctrlName)[0].appendChild(
            toolbar.container);

        return toolbar;
    }

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    function createControls(parentGroup, ctrlName) {

        var btn;
        if (ctrlName == 'NewDraw') {
            btn = createButton(
                'Autodesk.ADN.UIComponent.Button.NewDraw',
                'glyphicon glyphicon-new-window',
                'New Drawing',
                onNewDrawing);
        }

        else if (ctrlName == 'ShowPanel') {
            btn = createButton(
                'Autodesk.ADN.UIComponent.Button.ShowPanel',
                'glyphicon glyphicon-plus',
                'Show Panel',
                onShowPanel);
        }

        else if (ctrlName == 'UpdateDraw') {
            btn = createButton(
                'Autodesk.ADN.UIComponent.Button.UpdateDraw',
                'glyphicon glyphicon-refresh',
                'Update Drawing',
                onUpdateDrawing);
        }
        else if (ctrlName == 'DownloadDWG') {
            btn = createButton(
                'Autodesk.ADN.UIComponent.Button.DownloadDWG',
                'glyphicon glyphicon-download',
                'Download DWG',
                onDownloadDWG);
        }
        else {
        }
        parentGroup.addControl(btn);
    }

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////

    //option for spinner
    var opts = {
        innerImage: {url: '../img/logo.png', width: 56, height: 56},
        lines: 13,
        length: 20,
        width: 20,
        radius: 50,
        corners: 1,
        rotate: 0,
        direction: 1,
        color: '#6882FA',
        speed: 1,
        trail: 60,
        shadow: false,
        hwaccel: false,
        className: 'spinner',
        zIndex: 2e9,
        top: '50%',
        left: '50%',
        position: 'absolute',
        progress: true,
        progressTop: 0,
        progressLeft: 0
    };
    var spinner = new Spinner(opts);




    //tell the server the last running job can be ignored.
    function resetjobstatus(filename) {
        $.ajax({
            async: true,
            dataType: 'json',
            data: {filename: filename},
            type: "POST",
            url: '/IOroute/updateRunStatus',
            cache: false,
            success: function (result) {

            }
        }); //ajax for update running status
    }


    // load a new drawing or updated drawing
    function loadnewdwg(filename) {

        $.ajax({
            async: false,
            dataType: 'json',
            data: {filename: filename},
            type: "POST",
            url: '/IOroute/callViewerTranslateFromIO',
            cache: false,
            beforeSend: function () {
                spinner.spin($('#loading')[0]);
            },
            success: function (result) {

                if (result.success) {
                    try {
                        var viewurn = result.data;
                        console.log('final uern:' + viewurn);
                        //clean the viewer
                        $('#viewerDiv').html('');
                        //intialize the viewer
                        iniViewerFactory('urn:' + viewurn);
                        //generate attributes map
                        getAttMap();


                    }
                    catch (e) {
                        alert('Failed after getting new URN at /IOroute/callViewerTranslateFromIO!');
                    }

                }
                else {
                    alert('Failed to Translate a Drawing at /IOroute/callViewerTranslateFromIO!');
                }
                spinner.spin();

                resetjobstatus(filename);
            }
        });//  second ajax
    }

    //upload new a drawing
    function onNewDrawing() {

        //form & button for upload file process
        var tempuploadbuttonhtml = [
            '<form action="/uploadnewfile" id="uploadFileForm" method="post" enctype="multipart/form-data" >',
            '<input id= "selectFile" type="file" name ="file" accept="application/x-zip-compressed,image/*"> ',
            '<input id= "submitFile" type="submit" value="Upload selected file to server">',
            '</form> '].join('\n');
        var newNode = document.createElement("div");//
        newNode.id = 'tempuploadfilediv';
        newNode.innerHTML = tempuploadbuttonhtml;
        $('#tempuploadfilediv').css({"display": "none"});
        document.body.appendChild(newNode);


        var control = document.getElementById("selectFile");

        //after uploading file
        $('#uploadFileForm').ajaxForm(function () {

            if (_currentFileName != '') {
                $.ajax({
                    async: true,
                    dataType: 'json',
                    data: {filename: _currentFileName},
                    type: "POST",
                    url: '/IOroute/GenerateTBJson',
                    cache: false,
                    beforeSend: function () {
                        spinner.spin($('#loading')[0]);
                    },
                    success: function (result) {

                        if (result.success) {
                            console.log(result);

                            //get the result json file
                            _currentDownloadUrl = result.data.resulturl;
                            _currentResultType = '.json'
                            //get the report file
                            _currentReportUrl = result.data.reporturl;

                            //get json content from server
                            //can also read out from _currentDownloadUrl, but since server read it, get it directly.
                            $.ajax({
                                async: true,
                                dataType: 'json',
                                data: {filename: _currentFileName},
                                type: "GET",
                                url: '/IOroute/getCurrentDWGTJson',
                                cache: false,
                                success: function (result) {
                                    drawing_raw_jsonData = result.data;
                                    //send the new drawing to translate for viewing
                                    loadnewdwg(_currentFileName);
                                }
                            });//  ajax  /IOroute/getCurrentDWGTJson
                        }
                        else {
                            var errormag = 'New Drawing Failed!>>';

                            if(result.data && result.data == 'running')
                            {
                                errormag += 'a job is running! Plese wait a moment and try again.';
                            }
                            else {
                                if (result.reporturl) {
                                    errormag += 'click download to check log of work item.';
                                    _currentReportUrl = result.reporturl;
                                    resetjobstatus(_currentFileName);
                                }
                                else if (result.data) {
                                    errormag += result.data;
                                }
                                resetjobstatus(_currentFileName);
                            }
                            alert(errormag);
                        }
                        spinner.spin();
                    }
                });//ajax  /IOroute/GenerateTBJson
            }
            else {
                alert('no drawing file name!');
            }
        });

        //when selecting file for uploading
        control.addEventListener("change", function (event) {
            var i = 0,
                files = control.files,
                len = files.length;
            if (len > 0) {
                _currentFileName = files[0].name;

                console.log("Filename: " + files[0].name);
                console.log("Type: " + files[0].type);
                console.log("Size: " + files[0].size + " bytes");
                $("#submitFile").click();

            }
            var oldNode = document.getElementById("tempuploadfilediv");
            document.body.removeChild(oldNode);
        }, false);

        //perform selecting file and uploading
        $("#selectFile").click();
    }


    //updating a drawing with the new json
    function onUpdateDrawing() {
        _currentDownloadUrl = 'none';
        _currentReportUrl = 'none';

        $.ajax({
            async: true,
            dataType: 'json',
            data: {
                filename: _currentFileName,
                jsonfile: drawing_raw_jsonData
            },
            type: "POST",
            url: '/IOroute/updateTBFromJson',
            cache: false,
            beforeSend: function () {
                spinner.spin($('#loading')[0]);
            },
            success: function (result) {
                var fullSuccess = false;
                if (result.success) {
                    _currentReportUrl = result.data.reporturl;
                    _currentResultType = '.dwg';
                    _currentDownloadUrl = result.data.resulturl;

                    if (_currentDownloadUrl == '') {
                        alert('WorkItem for updateTBFromJson Failed!Click Download Button to Get Report!');
                    }
                    else {
                        //alert('WorkItem OK1!Click Download Button to Get DWG!');
                        fullSuccess = true;
                    }
                }
                else {

                    var errormag = 'updateTBFromJson Failed! >>';

                    if(result.data && result.data == 'running')
                    {
                        errormag += 'a job is running! Plese wait a moment and try again.';
                    }
                    else {
                        if (result.data) {
                            errormag += result.data;
                        }
                        resetjobstatus(_currentFileName);
                    }
                    alert(errormag);
                }
                spinner.spin();

                if (fullSuccess) {
                    loadnewdwg(_currentFileName);
                }
            }
        });// ajax: /IOroute/updateTBFromJson
    }


    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    function onDownloadDWG() {
        if (_currentDownloadUrl == 'none' || _currentDownloadUrl == null) {

            if (_currentReportUrl == 'none' || _currentReportUrl == null) {
                alert('No Valid Result or Log URL!');
            }
            else {
                var hf = document.createElement('a');
                hf.id = 'templog';
                hf.href = _currentReportUrl;
                hf.download = new Date().toISOString() + '.log';
                hf.innerHTML = hf.download;
                document.body.appendChild(hf);
                document.getElementById('templog').click();
                document.body.removeChild(document.getElementById('templog'));
            }
        }
        else {
            var hf = document.createElement('a');
            hf.id = 'tempwiresult';
            if (_currentResultType == '.json') {
                hf.href = 'https://' + window.location.host + '/getjsonfile/' + _currentFileName + '.json' ;
                hf.download = new Date().toISOString() + _currentFileName + '.json' ;
            }
            else {
                hf.href = 'https://' + window.location.host + '/getdwgfile/' + _currentFileName;
                hf.download = new Date().toISOString() + _currentFileName;
            }

            hf.innerHTML = hf.download;
            document.body.appendChild(hf);
            document.getElementById('tempwiresult').click();
            document.body.removeChild(document.getElementById('tempwiresult'));
        }
    }

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    function createButton(id, className, tooltip, handler) {

        var button = new Autodesk.Viewing.UI.Button(id);

        button.icon.style.fontSize = "24px";

        button.icon.className = className;

        button.setToolTip(tooltip);

        button.onClick = handler;

        return button;
    }

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    function newGUID() {

        var d = new Date().getTime();

        var guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(
            /[xy]/g,
            function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
            });

        return guid;
    };


    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    Autodesk.ADN.Viewing.Extension.UIComponent.Panel = function (parentContainer,
                                                                 baseId) {

        this.content = document.createElement('div');

        this.content.id = baseId + 'PanelContentId';
        this.content.className = 'uicomponent-panel-content';

        Autodesk.Viewing.UI.DockingPanel.call(
            this,
            parentContainer,
            baseId,
            "Signature",
            {shadow: true});

        this.container.style.right = "0px";
        this.container.style.top = "0px";

        this.container.style.width = "380px";
        this.container.style.height = "500px";

        this.container.style.resize = "auto";

        var _rawjson;

        var html = [
            '<div class="uicomponent-panel-container">',
            '<div class="uicomponent-panel-controls-container">',
            '<div>',

            '<input class="uicomponent-panel-input" type="text" placeholder="Attribute Tag" id="' + baseId + 'txt_tag"></p>',
            '<p   style="color: #FFFFFF">',
            '<input  id="' + baseId + 'radio_txt" checked="true" name="R_Sign" type="radio" value="Text" />Text</p>',
            '<p   style="color: #FFFFFF">',
            '<input id="' + baseId + 'radio_sig" checked="false" name="R_Sign" type="radio" value="Signature" />Signature</p>',

            '<input class="uicomponent-panel-input" type="text" placeholder="Attribute Content" id="' + baseId + 'txt_sig"></p>',

            '<div id = "' + baseId + 'div_sig">',
            '<button class="btn btn-info" id="' + baseId + 'btn_newSig">',
            '<span class="glyphicon glyphicon-asterisk" aria-hidden="true"></span> New Signature</p>',
            '</button>',
            '<canvas  id="' + baseId + 'canvas_sig"  width="350" height="200" >HTML5 Canvas Not Supported...</canvas></p>',
            '</div>',

            '<button class="btn btn-info" id="' + baseId + 'btn_update">',
            '<span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Update',
            '</button>',

            '</div>',
            '<br>',
            '</div>',
            '<div id="' + baseId + 'PanelContainerId" class="list-group uicomponent-panel-list-container">',
            '</div>',
            '</div>'
        ].join('\n');

        $('#' + baseId + 'PanelContentId').html(html);
        $('#' + baseId + 'radio_txt').attr("checked", true);
        $('#' + baseId + 'txt_sig').css({"display": "inline"});
        $('#' + baseId + 'div_sig').css({"display": "none"});


        /////////////////////////////////////////////
        //
        //
        /////////////////////////////////////////////
        var att_array;
        var _isimg = false;
        var _imgName = '';
        var imgBase64 = '';

        $('#' + baseId + 'radio_txt').click(function () {

            $('#' + baseId + 'txt_sig').css({"display": "inline"});
            $('#' + baseId + 'div_sig').css({"display": "none"});

            _isimg = false;

        });
        /////////////////////////////////////////////
        //
        //
        /////////////////////////////////////////////
        $('#' + baseId + 'radio_sig').click(function () {

            $('#' + baseId + 'txt_sig').css({"display": "none"});
            $('#' + baseId + 'div_sig').css({"display": "inline"});

            _isimg = true;
        });

        /////////////////////////////////////////////
        //
        //
        /////////////////////////////////////////////
        $('#' + baseId + 'btn_update').click(function () {

            att_array = eval('(' + drawing_raw_jsonData + ')');
            for (var eachAtt in att_array['tbjson']) {
                var att_tag = att_array['tbjson'][eachAtt].tag;
                if ($('#' + baseId + 'txt_tag').val() == att_tag) {
                    att_array['tbjson'][eachAtt].isImage = _isimg;
                    if (_isimg) {

                        var signatureString = signaturePad.toDataURL();
                        att_array['tbjson'][eachAtt].imageName = '';
                        att_array['tbjson'][eachAtt].imgbase64 = signatureString;
                    }
                    else {
                        att_array['tbjson'][eachAtt].content = $('#' + baseId + 'txt_sig').val();
                        ;
                        att_array['tbjson'][eachAtt].imageName = '';
                        att_array['tbjson'][eachAtt].imgbase64 = '';
                    }
                    break;
                }
            }


            drawing_raw_jsonData = JSON.stringify(att_array);

        });


        /////////////////////////////////////////////
        //
        //
        /////////////////////////////////////////////
        $('#' + baseId + 'btn_newSig').click(function () {

            newSig();

        });

        var signaturePad;

        function newSig() {

            var c = $('#' + baseId + 'canvas_sig') [0];
            var ctx = c.getContext('2d');
            ctx.beginPath();
            ctx.fillRect(0, 0, 300, 200);
            ctx.stroke();
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 2;

            if (signaturePad)
                signaturePad.clear();
            else
                signaturePad = new SignaturePad(c);

        }

        newSig();


        this.refreshTag = function (tag, content) {
            $('#' + baseId + 'txt_tag').val(tag);
            $('#' + baseId + 'txt_sig').val(content);
        }

    };

    Autodesk.ADN.Viewing.Extension.UIComponent.Panel.prototype = Object.create(
        Autodesk.Viewing.UI.DockingPanel.prototype);

    Autodesk.ADN.Viewing.Extension.UIComponent.Panel.prototype.constructor =
        Autodesk.ADN.Viewing.Extension.UIComponent.Panel;

    Autodesk.ADN.Viewing.Extension.UIComponent.Panel.prototype.initialize = function () {
        // Override DockingPanel initialize() to:
        // - create a standard title bar
        // - click anywhere on the panel to move

        this.title = this.createTitleBar(
            this.titleLabel ||
            this.container.id);

        this.closer = this.createCloseButton();

        this.container.appendChild(this.title);
        this.title.appendChild(this.closer);
        this.container.appendChild(this.content);

        this.initializeMoveHandlers(this.title);
        this.initializeCloseHandler(this.closer);
    };

    var css = [

        'div.uicomponent-panel-content {',
        'height: calc(100% - 5px);',
        '}',

        'div.uicomponent-panel-container {',
        'height: calc(100% - 60px);',
        'margin: 10px;',
        '}',

        'div.uicomponent-panel-controls-container {',
        'margin-bottom: 10px;',
        '}',

        'div.uicomponent-panel-list-container {',
        'height: calc(100% - 60px);',
        'overflow-y: auto;',
        '}',

        'div.uicomponent-panel-item {',
        'margin-left: 0;',
        'margin-right: 0;',
        'color: #FFFFFF;',
        'background-color: #3F4244;',
        'margin-bottom: 5px;',
        'border-radius: 4px;',
        '}',

        'div.uicomponent-panel-item:hover {',
        'background-color: #5BC0DE;',
        '}',

        'label.uicomponent-panel-label {',
        'color: #FFFFFF;',
        '}',

        'input.uicomponent-panel-input {',
        'height: 30px;',
        'width: 150px;',
        'border-radius: 5px;',
        'color: #000000;',
        '}'

    ].join('\n');

    ///////////////////////////////////////////////////////
    // Checks if css is loaded
    //
    ///////////////////////////////////////////////////////
    function isCssLoaded(name) {

        for (var i = 0; i < document.styleSheets.length; ++i) {

            var styleSheet = document.styleSheets[i];

            if (styleSheet.href && styleSheet.href.indexOf(name) > -1)
                return true;
        }
        ;

        return false;
    }

    // loads bootstrap css if needed
    if (!isCssLoaded("bootstrap.css") && !isCssLoaded("bootstrap.min.css")) {

        $('<link rel="stylesheet" type="text/css" href="http://netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.css"/>').appendTo('head');
    }

    $('<style type="text/css">' + css + '</style>').appendTo('head');


};

Autodesk.ADN.Viewing.Extension.UIComponent.prototype =
    Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.UIComponent.prototype.constructor =
    Autodesk.ADN.Viewing.Extension.UIComponent;

Autodesk.Viewing.theExtensionManager.registerExtension(
    'Autodesk.ADN.Viewing.Extension.UIComponent',
    Autodesk.ADN.Viewing.Extension.UIComponent);

