# DWG-TitleBlock-Signature
===========================
This is an Node.js application that allows the user fill in the title block fields with text or signature in an AutoCAD drawing in the browser. The signatures will be merged to the drawing (as a kind of entity ‘Solid’). The application also provides the user to download the updated drawing. 

Application Usage
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
       //these two urls below are provided by xiaodong liang (xiaodong.liang@autodesk.com). They can subject to change or delete
       public static string sourceDWGUrl = "https://adnxdtest.herokuapp.com/adnxdtestgetdwgfile";
       public static string ExternalJsonUrl = "https://adnxdtest.herokuapp.com/adnxdtestgetjsonfile";

 ```
    * Rename package id, activity id if you like
    * Build and run the program. It will firstly create the package, upload the binary (bundle) of [TitleBlockMap] to IO. Then it creates one activity to generate the json file of the source DWG, linking to the package. Then run a work item (job) to generate json file from this DWG. It also creates the other activity to update the DWG file with the json. Then run a work item (job) to update the DWG with the demo json.
    


	
 
 
   
    
## License

That samples are licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.

## Written by 

Written by [Xiaodong Liang](http://adndevblog.typepad.com/aec/xiaodong-liang.html), Autodesk Developer Network.  



