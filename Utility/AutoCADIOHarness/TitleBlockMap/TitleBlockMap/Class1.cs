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
////////////////////////////////////////////////////////////////////////////////

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Autodesk.AutoCAD.ApplicationServices;
using Autodesk.AutoCAD.DatabaseServices;
using Autodesk.AutoCAD.EditorInput;
using Autodesk.AutoCAD.Runtime;
using System.Collections;
using Newtonsoft.Json;
using Autodesk.AutoCAD.Geometry;
using RestSharp;
using System.Drawing;
using Autodesk.AutoCAD.ApplicationServices.Core;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using System.Drawing.Imaging;

namespace TitleBlockMap
{
    //json class for attribute array
    [Serializable]
    class jsonDrawing
    {
        //[JsonProperty("tblayer")]
        //public string tblayer;

        [JsonProperty("tbjson")]
        public jsonAttribute[] tbjson;
    }

    //json class for attribute 
    [Serializable]
    class jsonAttribute
    {
        [JsonProperty("tag")]
        public string tag;

        [JsonProperty("height")]
        public string height;

        [JsonProperty("width_ratio")]
        public string width_ratio;

        [JsonProperty("position")]
        public string position;

        [JsonProperty("content")]
        public string content;

        [JsonProperty("isImage")]
        public bool isImage;         

        [JsonProperty("imgbase64")]
        public string imgbase64;
    }


    public class Class1
    {   

        

        private void createImages(jsonAttribute eachatt, Transaction tr, ObjectId lyid)
        {
            Editor ed = Autodesk.AutoCAD.ApplicationServices.Core.Application.DocumentManager.MdiActiveDocument.Editor; 

            //produce the bitmap of the signature from base64 string
            string imgPath = "temp.png";
            try
            {
                //remove the header of the base64
                var base64str = eachatt.imgbase64.Replace("data:image/png;base64,", "");
                byte[] arr = Convert.FromBase64String(base64str);
                using (MemoryStream ms = new MemoryStream(arr))
                {
                    System.Drawing.Image streamImage = System.Drawing.Image.FromStream(ms);

                    streamImage.Save(imgPath, ImageFormat.Png);
                    
                } 

            }
            catch (System.Exception ex)
            {
                ed.WriteMessage("\nBase64StringToImage failed ：" + ex.Message);
                return;
            }


            try
            {
                //get block table and model space
                Database db = HostApplicationServices.WorkingDatabase;
                BlockTable bt = tr.GetObject(db.BlockTableId, OpenMode.ForWrite) as BlockTable;
                BlockTableRecord msBtr = tr.GetObject(bt[BlockTableRecord.ModelSpace], OpenMode.ForWrite) as BlockTableRecord;

                //get the position of this attribute
                string[] split = eachatt.position.Split(new Char[] { ',' });
                double posX = Convert.ToDouble(split[0]);
                double posY = Convert.ToDouble(split[1]);
                double posZ = Convert.ToDouble(split[2]);

                //get the range of this attribute
                double fieldheight = Convert.ToDouble(eachatt.height);
                double fieldwidth = Convert.ToDouble(eachatt.width_ratio) * fieldheight;
                double field_center_x = posX + fieldwidth / 2;
                double field_center_y = posY + fieldheight / 2;

                //read the signature image
                
                System.Drawing.Bitmap operateimage = new System.Drawing.Bitmap(imgPath); 
                
                System.Drawing.Color c;

                double maxX = 0, minX = operateimage.Width;
                double maxY = 0, minY = operateimage.Height;

                ed.WriteMessage("\nbegin create block def for image");
                ObjectId blkRecId = ObjectId.Null;

                using (BlockTableRecord signatureBlkDef = new BlockTableRecord())
                {
                    System.Guid guid = System.Guid.NewGuid();

                    //block definition name
                    signatureBlkDef.Name = "sigblk" + guid.ToString();
                    ArrayList ptArr = new ArrayList();

                    //each pixel color
                    for (int y = 0; y < operateimage.Height; y++)
                        for (int x = 0; x < operateimage.Width; x++)
                        {
                            c = operateimage.GetPixel(x, y);

                            if (c.R == 0 && c.G == 0 && c.B == 0 && c.A == 255)
                            {
                                Autodesk.AutoCAD.Geometry.Point3d pt = new Autodesk.AutoCAD.Geometry.Point3d(x, operateimage.Height - y, 0);

                                minY = y < minY ? y : minY;
                                maxY = y > maxY ? y : maxY;

                                minX = x < minX ? x : minX;
                                maxX = x > maxX ? x : maxX;

                                var sol =
                               new Solid(
                                 new Point3d(pt.X, pt.Y, 0),
                                 new Point3d(pt.X + 1, pt.Y, 0),
                                 new Point3d(pt.X, pt.Y + 1, 0),
                                 new Point3d(pt.X + 1, pt.Y + 1, 0)
                               );

                                //set the solid to the specific layer
                                sol.LayerId = lyid;
                                signatureBlkDef.AppendEntity(sol);
                            }
                        }

                    ed.WriteMessage("\ncreate and add block def");

                    signatureBlkDef.Origin = new Point3d((maxX + minX) / 2, operateimage.Height - (maxY + minY) / 2, 0);
                    bt.Add(signatureBlkDef);
                    tr.AddNewlyCreatedDBObject(signatureBlkDef, true);

                    //set the block definition to the specific layer
                    blkRecId = signatureBlkDef.Id;

                    ed.WriteMessage("\nend creating block def");
                }

                operateimage.Dispose();
                //scale the signature to fit the field along X, Y

                double blkscaleY = fieldheight / (maxY - minY) * 2;
                double blkscaleX = (maxX - minX) / (maxY - minY) * blkscaleY;

                ed.WriteMessage("\nto begin create block ref");

                using (BlockReference acBlkRef = new BlockReference(new Point3d(field_center_x, field_center_y, 0), blkRecId))
                {
                    acBlkRef.ScaleFactors = new Scale3d(blkscaleY, blkscaleY, 1);
                    acBlkRef.LayerId = lyid;
                    msBtr.AppendEntity(acBlkRef);
                    tr.AddNewlyCreatedDBObject(acBlkRef, true);
                }

                ed.WriteMessage("\nend of creating block ref");
            }
            catch (Autodesk.AutoCAD.Runtime.Exception ex){
                ed.WriteMessage("\nfailed to produce the image: " + ex.ToString());
            }

        }

        //create layer for signature
        private ObjectId createLayer(string lyname)
        {
            Editor ed = Autodesk.AutoCAD.ApplicationServices.Core.Application.DocumentManager.MdiActiveDocument.Editor;
            Database db = HostApplicationServices.WorkingDatabase;            

            //search the specific layer  
            TypedValue[] filList = new TypedValue[1] {
                        new TypedValue((int)DxfCode.LayerName, lyname)
                };
            SelectionFilter filter = new SelectionFilter(filList);

            PromptSelectionResult selRes = ed.SelectAll(filter);
            if (selRes.Status != PromptStatus.OK && 
                selRes.Status != PromptStatus.Error) //error means no such layer. can continue the following code
            {
                ed.WriteMessage("\nerror in getting all entities on a layer named " + lyname + " >>error:" + selRes.Status);
                return ObjectId.Null;
            }
                        
            LayerTableRecord signatureLayer = null;
            try
            {

                using (Transaction tr =
                    db.TransactionManager.StartTransaction())
                {
                    if (selRes.Status == PromptStatus.OK)
                    {
                        ed.WriteMessage("\nTo delete entities on the signature layer");

                        //delete all signatures (solids) on the old layer
                        ObjectId[] ids = selRes.Value.GetObjectIds();
                        foreach (ObjectId eachentid in ids)
                        {
                            Entity oEnt = tr.GetObject(eachentid, OpenMode.ForWrite) as Entity;
                            oEnt.Erase();
                        }
                    }

                    ed.WriteMessage("\nTo delete signature layer");
                    LayerTable layerTable = tr.GetObject(db.LayerTableId, OpenMode.ForWrite) as LayerTable;
                    if (layerTable.Has(lyname))
                    {
                        //delete the old layer
                        ObjectId LTR_id = layerTable[lyname];
                        ObjectIdCollection idCol = new ObjectIdCollection();
                        idCol.Add(LTR_id);
                        db.Purge(idCol);

                        LayerTableRecord oLTR = tr.GetObject(LTR_id, OpenMode.ForWrite) as LayerTableRecord;
                        oLTR.Erase();
                    }

                    ed.WriteMessage("\nTo create  signature layer");
                    //create new layer
                    signatureLayer = new LayerTableRecord();
                    signatureLayer.Name = lyname;
                    layerTable.Add(signatureLayer);
                    tr.AddNewlyCreatedDBObject(signatureLayer, true);

                    tr.Commit();
                }

                if (signatureLayer != null)
                    return signatureLayer.ObjectId;
                else
                    return ObjectId.Null;
            }
            catch (Autodesk.AutoCAD.Runtime.Exception ex)
            {
                ed.WriteMessage("\nerror in create layer " + ex.ToString());
                return ObjectId.Null;
            }
        }


        /// <summary>
        /// update the attributes from json
        /// </summary>
        [CommandMethod("MyTestCommands", "updateTBFromJson", CommandFlags.Modal)]
        public void updateTBFromFile()
        { 
            Database db = HostApplicationServices.WorkingDatabase;
            Editor ed = Autodesk.AutoCAD.ApplicationServices.Core.Application.DocumentManager.MdiActiveDocument.Editor;

            //read external json
            PromptFileNameResult pfnr = ed.GetFileNameForOpen("\nSpecify json file");
            if (pfnr.Status != PromptStatus.OK)
            {
                ed.WriteMessage("\nerror to read external json file " + pfnr.Status.ToString());
                return;
            }

            string paramFile = pfnr.StringResult;
            string rawJsonContent  = File.ReadAllText(paramFile);     

            Transaction tr = db.TransactionManager.StartTransaction();
            // Start the transaction
            try
            {
                //convert json to json class
                jsonDrawing jsonDrawingInstance = JsonConvert.DeserializeObject<jsonDrawing>(rawJsonContent);
                if (jsonDrawingInstance == null)
                {
                    ed.WriteMessage("\nraw json file is bad!\n");
                    return;
                }

                //string tblayer = jsonDrawingInstance.tblayer;

                //create the layer for signature
                ObjectId lyId = createLayer("signature_layer");
                if (lyId.IsNull)
                {
                    ed.WriteMessage("\nlayer cannot be created");
                    return;
                }

                // Build a filter list so that only block references are selected
                TypedValue[] filList = new TypedValue[1] {
                        new TypedValue((int)DxfCode.Start, "INSERT")
                };

                SelectionFilter filter = new SelectionFilter(filList);
                PromptSelectionResult res = ed.SelectAll(filter);

                // Do nothing if selection is unsuccessful
                if (res.Status != PromptStatus.OK)
                {
                    ed.WriteMessage("\nno any Insert in this drawing!");
                    return;
                }

                SelectionSet selSet = res.Value;
                ObjectId[] idArray = selSet.GetObjectIds();
                foreach (ObjectId blkId in idArray)
                {
                    BlockReference blkRef = (BlockReference)tr.GetObject(blkId, OpenMode.ForRead);
                    BlockTableRecord btr = (BlockTableRecord)tr.GetObject(blkRef.BlockTableRecord, OpenMode.ForRead);
                    ed.WriteMessage("\nBlock: " + btr.Name);
                    btr.Dispose();

                    AttributeCollection attCol = blkRef.AttributeCollection;
                    foreach (ObjectId attId in attCol)
                    {
                        AttributeReference attRef = (AttributeReference)tr.GetObject(attId, OpenMode.ForWrite);
                        //check the block ref of title block on the specific layer 
                        if (attRef.Layer == Helper.tblayer)
                        {
                            foreach (var eachAtt in jsonDrawingInstance.tbjson)
                            {
                                if (eachAtt.tag == attRef.Tag)
                                {
                                    ed.WriteMessage("\nbegin: " + eachAtt.tag + " \n");
                                    ed.WriteMessage("\nis image: " + eachAtt.isImage + " \n");
                                    if (eachAtt.isImage)
                                    { 
                                        attRef.TextString = "";
                                        //create image for signature
                                        createImages(eachAtt, tr, lyId);
                                    }
                                    else
                                    {
                                        attRef.TextString = eachAtt.content;
                                    }
                                    break;
                                    ed.WriteMessage("\nend: " + eachAtt.tag + " \n");
                                }

                            }
                        }
                    }
                }

                tr.Commit();
            }
            catch (Autodesk.AutoCAD.Runtime.Exception ex)
            {
                ed.WriteMessage(("\nException: " + ex.Message));
            }
            finally
            {
                tr.Dispose();
            }

            db.SaveAs("newTB.dwg", DwgVersion.Newest);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="isLocalTest">true: simulate an signature image to a json string. the example image is testsig.png</param>
        void GenerateTBJson(bool isLocalTest = false)
        {
            


            Editor ed = Autodesk.AutoCAD.ApplicationServices.Core.Application.DocumentManager.MdiActiveDocument.Editor;

            Database db = HostApplicationServices.WorkingDatabase;
            Transaction tr = db.TransactionManager.StartTransaction();
            try
            {
                ed.WriteMessage("\nbegin att checking");

                // Build a filter list so that only block references are selected
                TypedValue[] filList = new TypedValue[1] {
                  new TypedValue((int)DxfCode.Start, "INSERT")
                };

                SelectionFilter filter = new SelectionFilter(filList);
                PromptSelectionResult res = ed.SelectAll(filter);

                // Do nothing if selection is unsuccessful
                if (res.Status != PromptStatus.OK)
                    return;

                SelectionSet selSet = res.Value;
                ObjectId[] idArray = selSet.GetObjectIds();

                List<jsonAttribute> jsonDataArray = new List<jsonAttribute>();

                ed.WriteMessage("\nbegin each checking");

                foreach (ObjectId blkId in idArray)
                {
                    BlockReference blkRef = (BlockReference)tr.GetObject(blkId, OpenMode.ForRead);
                    BlockTableRecord btr = (BlockTableRecord)tr.GetObject(blkRef.BlockTableRecord, OpenMode.ForRead);
                    ed.WriteMessage("\nBlock: " + btr.Name);
                    btr.Dispose();

                    AttributeCollection attCol = blkRef.AttributeCollection;

                    //attribute index
                    int index = 0;

                    foreach (ObjectId attId in attCol)
                    {
                        AttributeReference attRef = (AttributeReference)tr.GetObject(attId, OpenMode.ForRead);
                        if (attRef.Layer == "AM_BOR")
                        {
                            ed.WriteMessage("\nbegin: " + attRef.Tag);
                            string _height = attRef.Height.ToString();
                            string _tag = attRef.Tag;

                            int pFrom = _tag.IndexOf("{") + 1;
                            int pTo = _tag.LastIndexOf("}");

                            string _width_radio = _tag.Substring(pFrom, pTo - pFrom);

                            string _pos = attRef.Position.X.ToString() + "," +
                            attRef.Position.Y.ToString() + "," +
                            attRef.Position.Z.ToString();

                            string _cont = attRef.TextString;
                            var jsonData = new jsonAttribute()
                            {
                                tag = _tag,
                                height = _height,
                                width_ratio = _width_radio,
                                position = _pos,
                                content = _cont,
                                isImage = false,
                                imgbase64 = ""
                            };

                            //if this is to test an image locally
                            //only simulate the attribute in even index will be an image
                            if (isLocalTest && (index%2==1))
                            {
                                jsonData.isImage = true;
                                jsonData.imgbase64 = imageToBase64();
                            }

                            jsonDataArray.Add(jsonData);
                            ed.WriteMessage("end: " + attRef.Tag);

                            index++;

                        }
                        //tag: {12.3} is the\ ratio of the defined width for the text to the text height. For example, if the text height is 5 units, and the width of the available space is 100 units, the value between the curly brackets is 20.
                        //http://knowledge.autodesk.com/support/autocad-mechanical/getting-started/caas/CloudHelp/cloudhelp/2015/ENU/AutoCAD-Mechanical/files/GUID-ADFE83F7-CE92-4996-8231-D3C5FD5A1A92-htm.html
                    }
                }

                tr.Commit();

                var jsonDrawingInstance = new jsonDrawing()
                {
                    tbjson = jsonDataArray.ToArray<jsonAttribute>()
                };

                // this is the Newtonsoft API method
                string json_data = JsonConvert.SerializeObject(jsonDrawingInstance);

                var jsonOut = Path.Combine(Helper.jsonfilename);
                FileStream fs = new FileStream(jsonOut, FileMode.Create);
                StreamWriter sw = new StreamWriter(fs);
                try
                {
                    sw.Write(json_data);
                    sw.Flush();
                }
                catch (System.Exception ex)
                {
                    System.Windows.Forms.MessageBox.Show(ex.Message.ToString());
                }
                finally
                {
                    sw.Close();
                    fs.Close();
                }

                ed.WriteMessage("\nend att checking");
            }
            catch (Autodesk.AutoCAD.Runtime.Exception ex)
            {
                ed.WriteMessage(("\nException: " + ex.Message));
                return;
            }
            finally
            {
                tr.Dispose();
            } 
        }
      
        /// <summary>
        ///  produce json array for attributes of title block
        /// </summary>
        [CommandMethod("MyTestCommands", "GenerateTBJson", CommandFlags.Modal)]
        public void PostTBAttJson()
        {
            GenerateTBJson();
        }

        /// <summary>
        ///  produce json array for attributes of title block. for local test
        /// </summary>
        [CommandMethod("MyTestCommands", "GenerateTBJsonLocal", CommandFlags.Modal)]
        public void MyTest()
        {
            GenerateTBJson(true);
        }

        string imageToBase64()
        {            
            string testsigfile =  "testsig.png";
            if (File.Exists(testsigfile))
            {
                string strbaser64 = "";
                try
                {
                    System.Drawing.Image imgfromfile = System.Drawing.Image.FromFile(testsigfile);
                    MemoryStream ms = new MemoryStream();
                    imgfromfile.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
                    byte[] arr = new byte[ms.Length];
                    ms.Position = 0;
                    ms.Read(arr, 0, (int)ms.Length);
                    ms.Close();
                    strbaser64 = Convert.ToBase64String(arr); 
                }
                catch (System.Exception ex)
                {
                }
                return strbaser64;
            }
            else
            {
                return "";
            }
        }
    }
}



