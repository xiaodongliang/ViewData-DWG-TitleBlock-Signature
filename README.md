# DWG-TitleBlock-Signature
===========================
This is an Node.js application that allows the user fill in the title block fields with text or signature in an AutoCAD drawing in the browser. The signatures will be merged to the drawing (as a kind of entity ‘Solid’). The application also provides the user to download the updated drawing. 

Demo Site Usage
-----------------------------------
* Demo site: [http://adnxddwgsig.herokuapp.com/viewer.html](http://adnxddwgsig.herokuapp.com/viewer.html)
* Open the page. A default demo drawing will be loaded. The right-bottom corner is the title block that can be modified. 
![Picture](https://github.com/xiaodongliang/DWG-TitleBlock-Signature/blob/master/Help/appusage1.png)
* custom buttons:
  * 1. New Drawing: this button allows user to upload a new local drawing. The drawing with same name on the server will be replaced. After uploading, a process will start. after a moment, the new drawing will be displayed in the window. 
Note: since this is an experimental application, it can only detect a title block on the layer whose name is ‘AM_BOR’.
  * 2. Show Panel: this button will pop out a panel. Click the area of the title block fields, the corresponding attribute will be detected, if it is a Text, its current value will be displayed. Note: The demo website works on computer web. On iPad and iPhone, it is not working with touching point because of an issue of View & Data.
  ![Picture](https://github.com/xiaodongliang/DWG-TitleBlock-Signature/blob/master/Help/appusage2.png)
   In [Text] mode, input the new value and click [Update] button to confirm the new value. In [Signature] mode, draw any graphics by mouse and click [Update] button to confirm the new value.
 ![Picture](https://github.com/xiaodongliang/DWG-TitleBlock-Signature/blob/master/Help/appusage3.png)
 ![Picture](https://github.com/xiaodongliang/DWG-TitleBlock-Signature/blob/master/Help/appusage4.png)
  * 3 Update Drawing: click this button, all updated values of the title block will be sent to server and Autodesk IO & Viewer to produce the updated drawing. After a moment, the updated drawing will be displayed in the window with the new values. A layer named ‘signature_layer’ is added. It can show on / off the signature.
  ![Picture](https://github.com/xiaodongliang/DWG-TitleBlock-Signature/blob/master/Help/appusage5.png) 
  ![Picture](https://github.com/xiaodongliang/DWG-TitleBlock-Signature/blob/master/Help/appusage65.png) 
  * 4 Download Result: click this button, the result updated DWG file will be downloaded. Or if any issue with IO job, the report file will be downloaded.
   
Local Test of AutoCAD Package and IO
-----------------------------------
* Open Utility/AutoCADIOHarness/AutoCADIOHarness.sln, two projects, one is AutoCAD package [TitleBlockMap], the other is the console program [AcadIOTest] to client test with IO with the package produced from TitleBlockMap
  * add/install necessary references of .NET.
  * AutoCAD IO extension has been enclosed in the project
  * AutoCAD references locate with SDK of AutoCAD API.
  * You will need to have AutoCAD installed.
* Test [TitleBlockMap] in AutoCAD (this sample has been tested in release 2016)
  * Load the binary of the program in AutoCAD
  * Open any AutoCAD drawing with a title block whose attributes locates on layer named ‘AM_BOR’. Such drawing can be produced from AutoCAD Mechanical template
  * Run command ‘GenerateTBJsonLocal’. It will check each attibutes of the title block and generate a json file (Utility/AutoCADIOHarness/bin/drawing_raw_jsonData.txt) with properties of the attributes. To mimic a signature, some attributes are intentionally set with a demo picture (Utility/AutoCADIOHarness/bin/testsig.png)
There is a companion command ‘GenerateTBJson’, it is for running on AutoCAD I/O.
  * Run command ‘updateTBFromJson’. It will ask to load a json file. select the file in c), the code will refresh each attribute with the new json values. Some attributes will be filled in with the signatures. They are solids on the layer named ‘signature_layer’.
    ![Picture](https://github.com/xiaodongliang/DWG-TitleBlock-Signature/blob/master/Help/dev1.png) 

* Test [AcadIOTest]
  * In [Utility/AutoCADIOHarness/AcadIOTest/AcadIOTest/Credentials.cs](https://github.com/xiaodongliang/DWG-TitleBlock-Signature/blob/master/Utility/AutoCADIOHarness/AcadIOTest/AcadIOTest/Credentials.cs), replace the consumer key and secret with your own. You can follow the tutorial on [https://developer.autodesk.com/api/autocadio/](https://developer.autodesk.com/api/autocadio/) to apply for the API consumer key and secret.
 ```
 class Credentials
 {
        //get your ConsumerKey/ConsumerSecret at http://developer.autodesk.com
        public static string ConsumerKey = "your key";
        public static string ConsumerSecret = "your secret";
 }

 ```
    * In  [Utility/AutoCADIOHarness/AcadIOTest/AcadIOTest/Programs.cs](https://github.com/xiaodongliang/DWG-TitleBlock-Signature/blob/master/Utility/AutoCADIOHarness/AcadIOTest/AcadIOTest/Program.cs), provide the urls of the source DWG and demo json file. you can use what xiaodong provided, but they may subject to change or delete.
```
class Program
 {      

       //replace with the source dwg and json of your own
       //these two urls below are provided by xiaodong liang (xiaodong.liang@autodesk.com). 
       // They may subject to change or delete
       public static string sourceDWGUrl = "https://adnxdtest.herokuapp.com/adnxdtestgetdwgfile";
       public static string ExternalJsonUrl = "https://adnxdtest.herokuapp.com/adnxdtestgetjsonfile";

 ```
    * Rename package id, activity id if you like
    * Build and run the program. It will firstly create the package, upload the binary (bundle) of [TitleBlockMap] to IO. Then it creates one activity to generate the json file of the source DWG, linking to the package. Then run a work item (job) to generate json file from this DWG. It also creates the other activity to update the DWG file with the json. Then run a work item (job) to update the DWG with the demo json.
    
Dependencies of Application
-----------------------------------
* Make sure to create the package, two activities locally where are mentioned in [Local Test of AutoCAD Package and IO] >> Test [AcadIOTest].
* The Javascript library of signature is from [https://github.com/szimek/signature_pad](https://github.com/szimek/signature_pad) . A copy is enclosed in this repository at [/www/js/signature_pad.js](https://github.com/xiaodongliang/DWG-TitleBlock-Signature/blob/master/www/js/signature_pad.js)
* Install [Node.js](https://nodejs.org/) on your machine and clone this repo. Download the project dependencies using npm before launching the app by running the following command in the project root directory:
```
npm install
```
This will install the following node.js modules in the project:

	express
	request
	serve-favicon
	body-parser
	multer
	q 
	
Setup/Usage Instructions
-----------------------------------
Currently this sample has been tested on Windows OS with Autodesk production server (vs. staging). It should also work with OSX/Linux, or Autodesk staging server, but has not yet been tested.

* Apply for your own credentials (API keys) of AutoCAD I/O and View &Data from developer.autodesk.com
* From the sample root folder, replace the placeholders with your own keys in [credentials.js](https://github.com/xiaodongliang/DWG-TitleBlock-Signature/blob/master/credentials.js). In addition, make sure to provide valid urls for source DWG and json file. 
```
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
		
	....... ......
	
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
		
	....... ......	
		
```
* Upload one of your models to your account and get its URN using another workflow sample, for example:
  -  Windows: [.NET WPF application workflow sample](https://github.com/Developer-Autodesk/workflow-wpf-view.and.data.api) 
   - Browser: [models.autodesk.io web page](http://models.autodesk.io) or [java lmv walk through web page](http://javalmvwalkthrough-vq2mmximxb.elasticbeanstalk.com)
* Copy the URN which was generated in the previous step in file [/www/viewer.js] at line #20 <br />
  ```
  var defaultUrn = '<replace with your encoded urn>';
  ```
  
 * Run the server from the Node.js console, by running the following command: <br />
  ```
  node server.js
  ```
* Connect to your local server using a WebGL-compatible browser: [http://localhost:8080/](http://localhost:8080/viewer.html)
   
    
## License

That samples are licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.

## Written by 

Written by [Xiaodong Liang](http://adndevblog.typepad.com/aec/xiaodong-liang.html), Autodesk Developer Network.  



