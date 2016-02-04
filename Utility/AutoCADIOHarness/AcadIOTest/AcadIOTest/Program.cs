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
using System.Threading.Tasks;
using System.IO.Compression;

using System.Net.Http;
using Newtonsoft.Json;

using AIO.Operations;
using AIO.ACES.Models;

namespace AcadIOTest
{
    class Program
    {      

        //replace with the source dwg and json of your own
        //these two urls below are provided by xiaodong liang (xiaodong.liang@autodesk.com). They can subject to change or delete
        public static string sourceDWGUrl = "https://adnxdtest.herokuapp.com/adnxdtestgetdwgfile";
        public static string ExternalJsonUrl = "https://adnxdtest.herokuapp.com/adnxdtestgetjsonfile";


        //IO container
        static Container container = null;

        //package id 
        static string packId = "ADNTestDWGSignaturePackage";
        //activity id to generate json  
        static string actid_genjson = "Act_DWGSignature_GenJson";
        //result json 
        static string resultJsonFile = "drawing_raw_jsonData.json";
        //activity id to update drawing 
        static string actid_updatetb = "Act_DWGSignature_UpdateTB";
        //external json name
        static string ExternalJsonFile = "ExtUrl.json";       
        //result dwg file after updating
        static string resultDWGFile = "newTB.dwg";


        static void Main(string[] args)
        {
            container = new Container(new Uri("https://developer.api.autodesk.com/autocad.io/us-east/v2/"));
            var token = GetToken();

            container.SendingRequest2 += (sender, e) => e.RequestMessage.SetHeader(
              "Authorization",
              token);

            //can add workflow to 
            //delete old package            
            DelPackage(container, packId);
            //create the package
            CreateAppPackage(container, packId);

            
            ////delete old activity of generate json
            //DelActivity(container, actid_genjson);
            ////create activity to generate json
            //CreateActivityForGeneateTBJson(container);
            ////test the activity with a workitem
            ////check MyDocument to see the result json or report
            //WorkItem_For_Act_Gen_Json(container);


            ////delete old activity of update drawing 
            //DelActivity(container, actid_updatetb);
            ////create activity to update drawing 
            //CreateActivityForUpdateTB(container);
            ////test the activity with a workitem
            ////check MyDocument to see the result dwg or report
            //WorkItem_For_Act_Update_TB(container); 
             

        }

        static string GetToken()
        {
            using (var client = new HttpClient())
            {
                var values = new List<KeyValuePair<string, string>>();

                values.Add(new KeyValuePair<string, string>(
                    "client_id",
                    Credentials.ConsumerKey));

                values.Add(new KeyValuePair<string, string>(
                    "client_secret",
                    Credentials.ConsumerSecret));

                values.Add(new KeyValuePair<string, string>(
                    "grant_type",
                    "client_credentials"));

                var requestContent = new FormUrlEncodedContent(values);

                var response = client.PostAsync(
                    "https://developer.api.autodesk.com/authentication/v1/authenticate",
                    requestContent).Result;

                var responseContent = response.Content.ReadAsStringAsync().Result;

                var resValues = JsonConvert.DeserializeObject<Dictionary<string, string>>(
                    responseContent);

                return resValues["token_type"] + " " + resValues["access_token"];
            }
        }


        #region "activity"
            static void CreateActivityForGeneateTBJson(Container container)
            {

                var act = new Activity()
                {
                    Id = actid_genjson,
                    Version = 1,
                    Instruction = new Instruction()
                    {
                        Script = "_tilemode 1 GenerateTBJson "
                    },
                    Parameters = new Parameters()
                    {
                        InputParameters = { 
                             new Parameter() { Name = "HostDwg", LocalFileName = "$(HostDwg)"}
                           },
                        OutputParameters = { 
                             new Parameter() { Name = "Result", LocalFileName = resultJsonFile } 
                         }
                    },
                    RequiredEngineVersion = "20.1"
                };

                if (packId != "")
                {
                    // reference the custom AppPackage                  
                    act.AppPackages.Add(packId);
                    Console.WriteLine("add {0} to activity", packId);

                }
                container.AddToActivities(act);
                container.SaveChanges();

                GetActivities(container);
            }

            static void CreateActivityForUpdateTB(Container container)
            {
                var act = new Activity()
                {
                    Id = actid_updatetb,
                    Version = 1,
                    Instruction = new Instruction()
                    {
                        Script = "_tilemode 1 updateTBFromJson ExtUrl.json "
                    },
                    Parameters = new Parameters()
                    {
                        InputParameters = { 
                             new Parameter() { Name = "HostDwg", LocalFileName = "$(HostDwg)"},
                             new Parameter() { Name = "ExtUrl", LocalFileName = ExternalJsonFile}
                          },
                        OutputParameters = { 
                             new Parameter() { Name = "Result", LocalFileName = resultDWGFile } 
                         }
                    },
                    RequiredEngineVersion = "20.1"
                };

                if (packId != "")
                {
                    act.AppPackages.Add(packId); // reference the custom AppPackage                  
                    Console.WriteLine("add {0} to activity", packId);

                }
                container.AddToActivities(act);
                container.SaveChanges();
            }

            static void GetActivities(Container container)
            {
                Console.WriteLine("***Actitivies****");
                foreach (var act in container.Activities)
                {
                    Console.WriteLine("{0}", act.Id);
                }
            }

            static void DelActivity(Container container, string actId = "")
            {
                if (actId == "")
                {
                    //delete all actvities
                    foreach (var act in container.Activities)
                    {
                        if (!act.IsPublic)
                            container.DeleteObject(act);
                    }
                    container.SaveChanges();
                }
                else
                {

                    try
                    {
                        var act = container.Activities.ByKey(actId).GetValue();
                        if (act != null)
                        {
                            container.DeleteObject(act);
                            container.SaveChanges();
                        }
                    }
                    catch { } // the activity does not exist. will throw exception
                }

            } 

        #endregion


        #region "workitem"
            static void WorkItem_For_Act_Gen_Json(Container container)
            {
                var wi = new WorkItem()
                {
                    Id = "",
                    ActivityId = actid_genjson,

                    Arguments = new Arguments()
                    {
                        InputArguments = {
                            new Argument() {
                            Name = "HostDwg",
                            Resource = sourceDWGUrl,
                            StorageProvider = StorageProvider.Generic
                            } 
                        },
                        OutputArguments = {new Argument() {
                            Name = "Result",
                            StorageProvider = StorageProvider.Generic,
                            HttpVerb = HttpVerbType.POST,
                            Resource = null                         
                        }},

                    }

                };

                Console.WriteLine("Submitting workitem...");

                container.AddToWorkItems(wi);
                container.SaveChanges();

                container.MergeOption = Microsoft.OData.Client.MergeOption.OverwriteChanges;


                do
                {
                    System.Threading.Thread.Sleep(5000);
                    wi = container.WorkItems.Where(p => p.Id == wi.Id).SingleOrDefault();
                }
                while (wi.Status == ExecutionStatus.Pending ||
                    wi.Status == ExecutionStatus.InProgress);

                Console.WriteLine("The result is downloadable at {0}",
                    wi.Arguments.OutputArguments.First().Resource);

                wi = container.WorkItems.ByKey(wi.Id).GetValue();

                //Resource property of the output argument "Result" will have the output url
                var url = wi.Arguments.OutputArguments.First(a => a.Name == "Result").Resource;
                if (url != null && url != "")
                    DownloadToDocs(url, resultJsonFile);
                //download the status report
                url = wi.StatusDetails.Report;
                if (url != null && url != "")
                    DownloadToDocs(url, "workitem-genjson.log");
            }

            static void WorkItem_For_Act_Update_TB(Container container)
            {
                var wi = new WorkItem()
                {
                    Id = "",
                    ActivityId = actid_updatetb,

                    Arguments = new Arguments()
                    {
                        InputArguments = {
                            new Argument() {
                            Name = "HostDwg",
                            Resource = sourceDWGUrl,
                            StorageProvider = StorageProvider.Generic
                            } ,
                            new Argument() {
                            Name = "ExtUrl",
                            Resource =  ExternalJsonUrl,
                            StorageProvider = StorageProvider.Generic
                            }
                        },
                        OutputArguments = {new Argument() {
                            Name = "Result",
                            StorageProvider = StorageProvider.Generic,
                            HttpVerb = HttpVerbType.POST,
                            Resource = null                         
                        }},
                    }

                };

                Console.WriteLine("Submitting workitem...");

                container.AddToWorkItems(wi);
                container.SaveChanges();

                container.MergeOption = Microsoft.OData.Client.MergeOption.OverwriteChanges;
                do
                {
                    System.Threading.Thread.Sleep(5000);
                    wi = container.WorkItems.Where(p => p.Id == wi.Id).SingleOrDefault();
                }
                while (wi.Status == ExecutionStatus.Pending ||
                    wi.Status == ExecutionStatus.InProgress);

                Console.WriteLine("The result is downloadable at {0}",
                    wi.Arguments.OutputArguments.First().Resource);

                wi = container.WorkItems.ByKey(wi.Id).GetValue();

                //Resource property of the output argument "Result" will have the output url
                var url = wi.Arguments.OutputArguments.First(a => a.Name == "Result").Resource;
                if (url != null && url != "")
                    DownloadToDocs(url, resultDWGFile);
                //download the status report
                url = wi.StatusDetails.Report;
                if (url != null && url != "")
                    DownloadToDocs(url, "workitem-updatedwg.log");
            }

        #endregion 


        #region "download result and log"
        static void DownloadToDocs(string url, string localFile)
        {
            var client = new HttpClient();

            var content = (StreamContent)client.GetAsync(url).Result.Content;

            var filename = System.IO.Path.Combine(
                Environment.GetFolderPath(
                Environment.SpecialFolder.MyDocuments),
                localFile);

            Console.WriteLine("Downloading to {0}.", filename);

            using (var output = System.IO.File.Create(filename))
            {
                content.ReadAsStreamAsync().Result.CopyTo(output);
                output.Close();
            }
        }
        #endregion

        #region "Package"

        static void GetPackages(Container container)
        {
            Console.WriteLine("***Packages****");

            foreach (var pack in container.AppPackages)
            {
                Console.WriteLine("{0}", pack.Id);
            }
        }

        static void DelPackage(Container container, string packId = "")
        {

            if (packId == "")
            {
                foreach (var pack in container.AppPackages)
                {
                    if (!pack.IsPublic)
                        container.DeleteObject(pack);
                }
                container.SaveChanges();
            }
            else
            {
                try
                {
                    var pack = container.AppPackages.ByKey(packId).GetValue();
                    if (pack != null)
                    {
                        container.DeleteObject(pack);
                        container.SaveChanges();
                    }
                }
                catch { }// the package does not exist. will throw the exception.
            }
        }

        static string CreateZip(string packId)
        {
            Console.WriteLine("Generating autoloader zip...");
            string zip = "package.zip";
            if (System.IO.File.Exists(zip))
                System.IO.File.Delete(zip);
            using (var archive = ZipFile.Open(zip, ZipArchiveMode.Create))
            {
                string bundle = packId + ".bundle";
                string name = "PackageContents.xml";
                archive.CreateEntryFromFile(name, System.IO.Path.Combine(bundle, name));
                name = "TitleBlockMap.dll";
                archive.CreateEntryFromFile(name, System.IO.Path.Combine(bundle, "Contents", name));
                name = "Newtonsoft.Json.dll";
                archive.CreateEntryFromFile(name, System.IO.Path.Combine(bundle, "Contents", name));
                name = "RestSharp.dll";
                archive.CreateEntryFromFile(name, System.IO.Path.Combine(bundle, "Contents", name));
            }
            return zip;

        }

        static void UploadObject(string url, string filePath)
        {
            Console.WriteLine("Uploading autoloader zip...");
            var client = new HttpClient();
            client.PutAsync(url, new StreamContent(System.IO.File.OpenRead(filePath))).Result.EnsureSuccessStatusCode();
        }


        static void CreateAppPackage(Container container,
                                     string packId)
        {
            Console.WriteLine("Creating/Updating AppPackage...");

            string zip = CreateZip(packId);

            // First step -- query for the url to upload the AppPackage file
            var url = container.AppPackages.GetUploadUrl().GetValue();

            // Second step -- upload AppPackage file
            UploadObject(url, zip);
            // third step -- after upload, create the AppPackage entity
            AppPackage package = new AppPackage()
            {
                Id = packId,
                RequiredEngineVersion = "20.1",
                Resource = url
            };
            container.AddToAppPackages(package);
            container.SaveChanges();
        }
        #endregion

    }

}
