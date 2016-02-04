///////////////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved 
// Written by Philippe Leefsma 2014 - ADN/Developer Technical Services
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
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Namespace declaration
//
///////////////////////////////////////////////////////////////////////////////
AutodeskNamespace("Autodesk.ADN.Toolkit.Viewer");

///////////////////////////////////////////////////////////////////////////////
// Autodesk.ADN.Toolkit.Viewer.AdnViewerManager
//
// Parameters:
//      tokenOrUrl :  An url which returns the access token in JSON foramt, 
//              for example: http://still-spire-1606.herokuapp.com/api/rawtoken,
//              it returns token  like :
//                  {"token_type":"Bearer",
//                   "expires_in":1799,
//                    "access_token":"nTeOdsiNRckNbiBF7lzdEZ3yjHRx"} 
//      viewerContainer : the html container of viewer
//      environment(optional) :  it is 'AutodeskProduction' by default 
///////////////////////////////////////////////////////////////////////////////
Autodesk.ADN.Toolkit.Viewer.AdnViewerManager = function (
    tokenOrUrl,
    viewerContainer,
    config) {

    ///////////////////////////////////////////////////////////////////////////
    // Check if string is a valid url
    //
    ///////////////////////////////////////////////////////////////////////////
    var _validateURL = function (str) {

        return (str.indexOf('http:') > -1 || str.indexOf('https:') > -1);
    }

    var _newGuid = function () {

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

    ///////////////////////////////////////////////////////////////////////////
    // Private Members
    //
    ///////////////////////////////////////////////////////////////////////////
    var _viewerDivId = _newGuid();

    var _viewer = null;

    var _self = this;

    //fit view on escape
    document.addEventListener("keyup", function (e) {
        // esc
        if (e.keyCode == 27) {

            if(_viewer) {
                _viewer.fitToView(false);
            }
        }
    });

    ///////////////////////////////////////////////////////////////////////////
    // Returns adsk viewer
    //
    ///////////////////////////////////////////////////////////////////////////
    this.getViewer = function () {

        return _viewer;
    };

    ///////////////////////////////////////////////////////////////////////////
    // Initialize Viewer and load document
    //
    ///////////////////////////////////////////////////////////////////////////
    this.loadDocument = function (urn, onViewerInitialized, onError) {

        _self.getViewablePath(

            urn, function (path, error) {

                if (!path) {

                    // error loading document
                    if (onError)
                        onError(error);

                    return;
                }

                _viewer = _createViewer();

                if (onViewerInitialized)
                    onViewerInitialized(_viewer);

                if (path.path3d.length > 0) {
                    _viewer.load(path.path3d[0]);
                }
                else if (path.path2d.length > 0) {
                    _viewer.load(path.path2d[0]);
                }
            })
    };

    ///////////////////////////////////////////////////////////////////////////
    // Get 2d and 3d viewable path
    //
    ///////////////////////////////////////////////////////////////////////////
    this.getViewablePath = function (documentId, callback) {

        var options = _initializeOptions();

        Autodesk.Viewing.Initializer(options, function () {

            if (documentId.indexOf('urn:') !== 0)
                documentId = 'urn:' + documentId;

            Autodesk.Viewing.Document.load(
                documentId,
                function (document) {

                    var path = {

                        path2d: [],
                        path3d: []
                    }

                    var items2d = Autodesk.Viewing.Document.getSubItemsWithProperties(
                        document.getRootItem(),
                        { 'type': 'geometry', 'role': '2d' },
                        true);

                    for (var i =0; i<items2d.length; ++i) {

                        path.path2d.push(document.getViewablePath(items2d[i]));
                    }

                    var items3d = Autodesk.Viewing.Document.getSubItemsWithProperties(
                        document.getRootItem(),
                        { 'type': 'geometry', 'role': '3d' },
                        true);

                    for (var i =0; i<items3d.length; ++i) {

                        path.path3d.push(document.getViewablePath(items3d[i]));
                    }

                    callback(path);
                },
                function (error) {
                    console.log("Error loading document: " + error)
                    callback(null, error);
                }
            );
        });
    };

    ///////////////////////////////////////////////////////////////////////////
    // Close current document if any
    //
    ///////////////////////////////////////////////////////////////////////////
    this.closeDocument = function () {

        var previousDiv = document.getElementById(_viewerDivId);

        previousDiv.parentElement.removeChild(previousDiv);

        _viewer = null;
    }

    ///////////////////////////////////////////////////////////////////////////
    // Initializes options
    //
    ///////////////////////////////////////////////////////////////////////////
    function _initializeOptions() {

        var options = {

            env: (config && config.environment ?
                config.environment : "AutodeskProduction")
        };

        // initialized with getToken callback
        if (_validateURL(tokenOrUrl)) {

            var getToken = function () {

                var xhr = new XMLHttpRequest();

                xhr.open("GET", tokenOrUrl, false);
                xhr.send(null);

                var response = JSON.parse(
                    xhr.responseText);

                return response.access_token;
            }

            options.getAccessToken = getToken;

            options.refreshToken = getToken;
        }

        // initialized with access token
        else {

            options.accessToken = tokenOrUrl;
        }

        return options;
    }

    ///////////////////////////////////////////////////////////////////////////
    // Creates new viewer div element
    //
    ///////////////////////////////////////////////////////////////////////////
    var _createViewerDiv = function (container) {

        var previousDiv = document.getElementById(_viewerDivId);

        if(previousDiv) {
            previousDiv.parentElement.removeChild(previousDiv);
        }

        var viewerDiv = document.createElement("div");

        viewerDiv.id = _viewerDivId;

        viewerDiv.style.height = "100%";

        container.appendChild(viewerDiv);

        viewerDiv.addEventListener("contextmenu",
          function (e) {
              e.preventDefault();
          });

        // disable scrolling on DOM document
        // while mouse pointer is over viewer area

        viewerDiv.addEventListener("mouseover",
          function (e) {
              var x = window.scrollX;
              var y = window.scrollY;
              window.onscroll = function () {
                  window.scrollTo(x, y);
              };
          });

        viewerDiv.addEventListener("mouseout",
          function (e) {
              window.onscroll = null;
          });

        return viewerDiv;
    };

    ///////////////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////////////
    var _createViewer = function () {

        if (_viewer) {

            _viewer.finish();

            _viewer = null;
        }

        var viewer = null;

        var viewerDiv = _createViewerDiv(viewerContainer);

        if(config && config.viewerType) {

            switch(config.viewerType) {
                case 'GuiViewer3D':
                    viewer = new Autodesk.Viewing.Private.GuiViewer3D(
                        viewerDiv);
                    break;
                case 'Viewer3D':
                    viewer = new Autodesk.Viewing.Viewer3D(
                        viewerDiv);
                    break;
                default:
                    viewer = new Autodesk.Viewing.Private.GuiViewer3D(
                        viewerDiv);
                    break;
            }
        }
        else {

            viewer = new Autodesk.Viewing.Private.GuiViewer3D(
                viewerDiv);
        }

        viewer.start();

        viewer.setProgressiveRendering(true);

        viewer.setQualityLevel(true, true);

        viewer.impl.setLightPreset(8);

        viewer.setBackgroundColor(3,4,5, 250, 250, 250);

        viewer.addEventListener(

            Autodesk.Viewing.GEOMETRY_LOADED_EVENT,

            function(event) {

                viewer.fitToView(false);
            });

        return viewer;
    }
}

///////////////////////////////////////////////////////////////////////////////
// Autodesk.ADN.Toolkit.Viewer.AdnViewerFactory
//
///////////////////////////////////////////////////////////////////////////////
Autodesk.ADN.Toolkit.Viewer.AdnViewerFactory = function (
    tokenOrUrl,
    factoryConfig) {

    ///////////////////////////////////////////////////////////////////////////
    // Check if string is a valid url
    //
    ///////////////////////////////////////////////////////////////////////////
    var _validateURL = function (str) {

        return (str.indexOf('http:') > -1 || str.indexOf('https:') > -1);
    }

    var _newGuid = function () {

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

    var _addGetProperty = function (object) {

        object.getProperty = function (propName, defaultValue) {

            if (this && this.hasOwnProperty(propName)) {

                return this[propName];
            }

            return defaultValue;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // Private Members
    //
    ///////////////////////////////////////////////////////////////////////////

    var _self = this;

    ///////////////////////////////////////////////////////////////////////////
    // Get 2d and 3d viewable path
    //
    ///////////////////////////////////////////////////////////////////////////
    this.getViewablePath = function (urn, onSuccess, onError) {

        var options = _initializeOptions();

        Autodesk.Viewing.Initializer(options, function () {

            if (urn.indexOf('urn:') !== 0)
                urn = 'urn:' + urn;

            Autodesk.Viewing.Document.load(
                urn,
                function (document) {

                    var pathCollection = {

                        path2d: [],
                        path3d: []
                    }

                    var items2d = Autodesk.Viewing.Document.getSubItemsWithProperties(
                        document.getRootItem(),
                        {
                            'type': 'geometry',
                            'role': '2d'
                        },
                        true);

                    for (var i =0; i<items2d.length; ++i) {

                        pathCollection.path2d.push({
                                name : items2d[i].name,
                                path: document.getViewablePath(items2d[i])
                            });
                    }

                    var items3d = Autodesk.Viewing.Document.getSubItemsWithProperties(
                        document.getRootItem(),
                        {
                            'type': 'geometry',
                            'role': '3d'
                        },
                        true);

                    for (var i =0; i<items3d.length; ++i) {

                        pathCollection.path3d.push({
                                name : items3d[i].name,
                                path: document.getViewablePath(items3d[i])
                            });
                    }

                    onSuccess(pathCollection);
                },
                function (error) {

                    onError(error);
                }
            );
        });
    };

    ///////////////////////////////////////////////////////////////////////////
    // Initializes options
    //
    ///////////////////////////////////////////////////////////////////////////
    function _initializeOptions() {

        var options = {

            env: factoryConfig.getProperty(
                'environment',
                'AutodeskProduction')
        };

        // initialized with getToken callback
        if (_validateURL(tokenOrUrl)) {

            var getToken = function () {

                var xhr = new XMLHttpRequest();

                xhr.open("GET", tokenOrUrl, false);
                xhr.send(null);

                var response = JSON.parse(
                    xhr.responseText);

                return response.access_token;
            }

            options.getAccessToken = getToken;

            options.refreshToken = getToken;
        }

        // initialized with access token
        else {

            options.accessToken = tokenOrUrl;
        }

        return options;
    }

    ///////////////////////////////////////////////////////////////////////////
    // Creates new viewer div element
    //
    ///////////////////////////////////////////////////////////////////////////
    var _createViewerDiv = function (container) {

        var id = _newGuid();

        var viewerDiv = document.createElement("div");

        viewerDiv.id = id;

        viewerDiv.style.height = "100%";

        container.appendChild(viewerDiv);

        // disable default context menu on viewer div

        viewerDiv.addEventListener("contextmenu",
          function (e) {
                e.preventDefault();
            });

        // disable scrolling on DOM document
        // while mouse pointer is over viewer area

        viewerDiv.addEventListener("mouseover",
          function (e) {
              var x = window.scrollX;
              var y = window.scrollY;
              window.onscroll = function () {
                  window.scrollTo(x, y);
              };
          });

        viewerDiv.addEventListener("mouseout",
          function (e) {
              window.onscroll = null;
          });

        return viewerDiv;
    };

    ///////////////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////////////
    this.createViewer = function (container, viewerConfig) {

        _addGetProperty(viewerConfig);

        var viewer = null;

        var viewerDiv = _createViewerDiv(container);

        switch(viewerConfig.getProperty('viewerType', 'GuiViewer3D')) {

            case 'GuiViewer3D':
                viewer = new Autodesk.Viewing.Private.GuiViewer3D(
                    viewerDiv);
                break;

            case 'Viewer3D':
                viewer = new Autodesk.Viewing.Viewer3D(
                    viewerDiv);
                break;

            default:

                console.log("Warning: viewerType not specified or incorrect in config, using Viewer3D");
                console.log("Valid values: {Viewer3D, GuiViewer3D}");

                viewer = new Autodesk.Viewing.Viewer3D(
                  viewerDiv);
                break;
        }

        viewer.start();

        viewer.setProgressiveRendering(
            viewerConfig.getProperty(
                'progressiveRendering',
                true)
        );

        var qualityLevel = viewerConfig.getProperty(
            'qualityLevel', [true, true]);

        viewer.setQualityLevel(
            qualityLevel[0],
            qualityLevel[1]);

        viewer.impl.setLightPreset(
            viewerConfig.getProperty(
                'lightPreset', 8)
        );

        var bkColor = viewerConfig.getProperty(
            'backgroundColor',
            [3,4,5, 250, 250, 250]);

        viewer.setBackgroundColor(
            bkColor[0], bkColor[1], bkColor[2],
            bkColor[3], bkColor[4], bkColor[5]);

        viewer.setDefaultNavigationTool(
            viewerConfig.getProperty(
            'navigationTool',
            'freeorbit'));

        viewer.addEventListener(

            Autodesk.Viewing.GEOMETRY_LOADED_EVENT,

            function(event) {

                viewer.fitToView(false);
            });

        return viewer;
    }
    
    _addGetProperty(factoryConfig);
}