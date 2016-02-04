# DWG-TitleBlock-Signature
===========================
This is an Node.js application that allows the user fill in the title block fields with text or signature in an AutoCAD drawing in the browser. The signatures will be merged to the drawing (as a kind of entity ‘Solid’). The application also provides the user to download the updated drawing. 

Application Usage (Demo site: http://adnxddwgsig.herokuapp.com/viewer.html) 
1.	Open the page. A default demo drawing will be loaded. The right-bottom corner is the title block that can be modified. 

    
2.	custom buttons:
    1)	New Drawing: this button allows user to upload a new local drawing. The drawing with same name on the server will be replaced.   
        After uploading, a process will start. after a moment, the new drawing will be displayed in the window. 
        
        Note: since this is an experimental application, it can only detect a title block on the layer whose name is ‘AM_BOR’. 

    2)	Show Panel: this button will pop out a panel. Click the area of  title block fields, the corresponding attribute will be 
        detected, if it is a Text, its current value will be displayed

    Note: The demo website works on computer web. On iPad or iPhone, it is not working with touching point because of an issue of View & Data.



