const { json } = require('express');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const { getDate } = require('javascript-time-ago/gradation');
const Model = require('../models/model');
const UserModel = require('../models/user');
const ChatModel = require('../models/chat');
const MedicalRecordModel = require('../models/medicalrecord');
const MedicalRecordAIModel = require('../models/medicalrecordaidata');
var axios = require('axios');
const VitalDetailsSchema = require('../models/vitalDetails');
const MajorVitalsSchema = require('../models/majorvitals');

const BenificiariesSchema = require('../models/benificiaries');
const LaborderdetailsSchema = require('../models/laborderdetails');
const ReferalsSchema = require('../models/referals');
const auth = require("../middleware/auth");
const jwt = require("jsonwebtoken");

const sleep = require('util').promisify(setTimeout);

var moment = require('moment');
var haversine = require("haversine-distance");
const LikesModel = require('../models/likes');
const SubCategoryModel = require('../models/subcategories');
const ChatContentModel = require('../models/chatcontent');
const router = express.Router();
var fcm = require('fcm-notification');
var FCM = new fcm('./nearwe-db88e-firebase-adminsdk-92i06-7d33a51877.json');
const { success, error, validation } = require("./responseApi");
const multer = require('multer')

const { exists } = require('../models/model');
const { Mongoose } = require('mongoose');
var multerAzure = require('multer-azure')

const fs = require('fs')



const medicalrecord = require('../models/medicalrecord');
const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");
const client = new TextAnalyticsClient("https://ayushmedicaltestentitys.cognitiveservices.azure.com/", new AzureKeyCredential("38ef59bdbdc046d5b4249b8886b509fb"));

const { FormRecognizerClient } = require("@azure/ai-form-recognizer");
const { ComputerVisionClient } = require("@azure/cognitiveservices-computervision");
const { CognitiveServicesCredentials } = require("@azure/ms-rest-azure-js");
const vitalDetails = require('../models/vitalDetails');
const laborderdetails = require('../models/laborderdetails');
var upload = multer({
  storage: multerAzure({
    account: 'poacdocreports', //The name of the Azure storage account
    key: 'G4Pobr5f7uU5B/t9n93ZyosDDzS+jo50ocZM+yPpJmMkUkVV19eQDLLANHoVQbniic4zA6Tmir/B+ASt89+iLQ==', //A key listed under Access keys in the storage account pane
    container: 'reports',  //Any container name, it will be created if it doesn't exist
    blobPathResolver: function (req, file, callback) {
      var blobPath = GetRandomId(1080, 800000) + ".pdf"
      callback(null, blobPath);
    }
  })
})
var uploadimage = multer({
  storage: multerAzure({
    account: 'poacdocreports', //The name of the Azure storage account
    key: 'G4Pobr5f7uU5B/t9n93ZyosDDzS+jo50ocZM+yPpJmMkUkVV19eQDLLANHoVQbniic4zA6Tmir/B+ASt89+iLQ==', //A key listed under Access keys in the storage account pane
    container: 'reports',  //Any container name, it will be created if it doesn't exist
    blobPathResolver: function (req, file, callback) {
      var blobPath = GetRandomId(1080, 800000) + ".jpg"
      callback(null, blobPath);
    }
  })
})









let ts = Date.now();
function GetRandomId(min, max) {
  return Math.floor(
    Math.random() * (max - min) + min
  )
}





//User Routes
router.post('/user/post', async (req, res) => {
  const referedBy=req.body.referedBy
  const data = new UserModel({
    emailAddress: req.body.emailAddress,
    userId: GetRandomId(10000, 1000000),
    name: req.body.name,
    token: req.body.token,
    image: req.body.image,
    referedBy: req.body.referedBy
 

  })

  const user = await UserModel.findOne({
    emailAddress: data.emailAddress,

  });
  if (user == null || user.length == 0) {

    const authtoken = jwt.sign(
      { userId: data.userId },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );
    data.authtoken=authtoken
   

    const refreshtoken = jwt.sign(
      { userId: data.userId },
      process.env.REFRESH_TOKEN_PRIVATE_KEY,
      { expiresIn: "90d" }
  );

data.refreshtoken=refreshtoken

    const dataToSave = await data.save();

    if(referedBy != null &&referedBy!=0)
    {


 const referal =await new ReferalsSchema({

    referedBy:referedBy,
    referedTo:dataToSave.userId,
    referedAmount:10,
    status:false

  })

  const referald  =await referal.save();
  console.log(referald)

    }


    res.json(success("User Added SuccessFully", { data: dataToSave }, res.statusCode))
  }
  else {
    res.json(success("User Added SuccessFully", { data: user }, res.statusCode))
  }

})


router.get('/User/UpdateToken/:token', auth, async (req, res) => {

  const decoded = jwt.verify(req.header('x-access-token'), process.env.TOKEN_KEY);  
  var userId = decoded.userId  
  var myquery = { userId: userId };
  var newvalues = { $set: { token: req.params.token } };
  UserModel.findOneAndUpdate(myquery,
    newvalues,
    function (err, response) {
      // do something
    });
  res.json(success("User Token Updated", { data: "1" }, res.statusCode))


})
router.get('/User/UpdateMobile/:mobile',auth, async (req, res) => {
  const decoded = jwt.verify(req.header('x-access-token'), process.env.TOKEN_KEY);  
  var userId = decoded.userId  
  var myquery = { userId: userId };
  var newvalues = { $set: { mobile: req.params.mobile } };
  UserModel.findOneAndUpdate(myquery,
    newvalues,
    function (err, response) {
      // do something
    });
  res.json(success("Phone Number Updated !", { data: "1" }, res.statusCode))


})


router.post('/User/UpdateProfile', auth,async (req, res) => {

  const decoded = jwt.verify(req.header('x-access-token'), process.env.TOKEN_KEY);  
  var userId = decoded.userId  

  var newvalues = { $set: { name: req.body.name, image: req.body.image } };
  UserModel.findOneAndUpdate(Number(userId),
    newvalues,
    function (err, response) {
      if (err == null) {
        res.json(success("Profile Updated Successfully", { data: "0" }, res.statusCode))
      }
      else {
        res.json(success("PRofile Updation failed Try Later ", { data: "1" }, res.statusCode))
      }
    }, { useFindAndModify: false });



})



//likes Routes 





router.post('/fileupload', upload.single("file"),auth, async function (req, res, next) {


  const decoded = jwt.verify(req.header('x-access-token'), process.env.TOKEN_KEY);  
  var userId = decoded.userId  

  const medicalrecordModel = new MedicalRecordModel({
    recordId: GetRandomId(10000, 1000000),
    dateTimeStamp: new Date(),
    fileUrl: req.file.url,
    fileType: 1,
    userId: userId,
    smartReport: 0

  })
  medicalrecordModel.save()
  res.json(success("Record Saved! We will update once Smart Report Gets Generated", { data: 1 }, res.statusCode))
  var printedTextSampleURL = req.file.url; // pdf/jpeg/png/tiff formats

  const computerVisionKey = "817c78b1b5d042f2a9077eb345ff7c96";
  const computerVisionEndPoint = "https://ayushmanocrdetectionpdfs.cognitiveservices.azure.com/";
  const cognitiveServiceCredentials = new CognitiveServicesCredentials(computerVisionKey);
  const computerVisionClient = new ComputerVisionClient(cognitiveServiceCredentials, computerVisionEndPoint);

  const printedResult = await readTextFromURL(computerVisionClient, printedTextSampleURL);

  var data = "";
  var hasRecords = false
  for (const page in printedResult) {

    const result = printedResult[page];
    if (result.lines) {
      if (result.lines.length) {
        for (const line of result.lines) {

          data = data + " " + line.text + " "
        }
      }
    }

    else { }
  }

console.log(data);
  var documents = [
    data
  ];
  const poller = await client.beginAnalyzeHealthcareEntities(documents);
  const results = await poller.pollUntilDone();
  var Dated = "";
  for await (const result of results) {
    console.log(result);

    if (!result.error) {
      var TextName = "";
      var TEST_VALUE = "";
      var TEST_Unit = "";
      var NormalizedText = "";
      for (const entity of result.entities) {
        if (entity.category == "Date"&&Dated=="") {
          Dated=entity.text
        }
        if (entity.category == "ExaminationName" && entity.text != "RESULT IN INDEX" && entity.text != "Hence" && entity.text != "TextName" && entity.text != "Test" && entity.text != "test" && entity.text != "Lab" && entity.text != "Tests" && entity.text != "blood" && entity.text != "Count" && entity.text != "RESULT IN INDEX REMARKS") {

          TextName = entity.text
          hasRecords = true
          NormalizedText = entity.normalizedText

        }
        if (entity.category == "MeasurementValue") {

          TEST_VALUE = entity.text
          hasRecords = true


        }
        if (entity.category == "MeasurementUnit") {
          TEST_Unit = entity.text
          hasRecords = true
          //
        }

        if (TextName != "" && TEST_VALUE != "" && TEST_Unit != "") {
          var vitalId = 0
          NormalizedText ? NormalizedText.toString() : 'Undetermined'
          const data = new VitalDetailsSchema({

            vitalId: GetRandomId(10000, 1000000),
            normalizedText: NormalizedText == "" ? "Undetermined" : NormalizedText,
            normalvalues: "Undetermined",
            description: "Undetermined"


          })
          const user = await VitalDetailsSchema.findOne({
            normalizedText: NormalizedText

          });
          if (user == null || user.length == 0) {
            const dataToSave = await data.save();
            console.log("not found" + vitalId)
            vitalId = data.vitalId

          }
          else {
            vitalId = user.vitalId
            console.log("found" + vitalId)
          }

          const medicalRecordAIModel = new MedicalRecordAIModel({
            mraiId: GetRandomId(10000, 1000000),
            recordId: medicalrecordModel.recordId,
            testname: TextName,
            testvalue: TEST_VALUE,
            testunit: TEST_Unit,
            normalizedText: NormalizedText,
            vitalId: vitalId,
            dated:Dated,
            userId:req.body.userId

          })
          medicalRecordAIModel.save()
          TextName = "";
          TEST_VALUE = "";
          TEST_Unit = "";
          if (hasRecords) {
            var myquery = { recordId: medicalrecordModel.recordId };
            var newvalues = { $set: { smartReport: 1 } };
            MedicalRecordModel.findOneAndUpdate(myquery,
              newvalues,
              function (err, response) {
                // do something
              });
          }
          else {
            var myquery = { recordId: medicalrecordModel.recordId };
            var newvalues = { $set: { smartReport: 2 } };
            MedicalRecordModel.findOneAndUpdate(myquery,
              newvalues,
              function (err, response) {
                // do something
              });
          }

          continue;


        }



      }

    } else console.error("\tError:", result.error);
  }





})
router.post('/fileuploadImage', uploadimage.single("file"),auth, async function (req, res, next) {

  const decoded = jwt.verify(req.header('x-access-token'), process.env.TOKEN_KEY);  
  var userId = decoded.userId  


  const medicalrecordModel = new MedicalRecordModel({
    recordId: GetRandomId(10000, 1000000),
    dateTimeStamp: new Date(),
    fileUrl: req.file.url,
    fileType: 2,
    userId: userId,
    smartReport: 0

  })
  medicalrecordModel.save()
  res.json(success("Record Saved! We will update once Smart Report Gets Generated", { data: 1 }, res.statusCode))
  var printedTextSampleURL = req.file.url; // pdf/jpeg/png/tiff formats

  const computerVisionKey = "817c78b1b5d042f2a9077eb345ff7c96";
  const computerVisionEndPoint = "https://ayushmanocrdetectionpdfs.cognitiveservices.azure.com/";
  const cognitiveServiceCredentials = new CognitiveServicesCredentials(computerVisionKey);
  const computerVisionClient = new ComputerVisionClient(cognitiveServiceCredentials, computerVisionEndPoint);

  const printedResult = await readTextFromURL(computerVisionClient, printedTextSampleURL);

  var data = "";
  var hasRecords = false
  for (const page in printedResult) {

    const result = printedResult[page];
    if (result.lines) {
      if (result.lines.length) {
        for (const line of result.lines) {

          data = data + " " + line.text + " "
        }
      }
    }

    else { }
  }
console.log(data)

  var documents = [
    data
  ];
  const poller = await client.beginAnalyzeHealthcareEntities(documents);
  const results = await poller.pollUntilDone();
  var Dated = "";
  for await (const result of results) {


    if (!result.error) {
      var TextName = "";
      var TEST_VALUE = "";
      var TEST_Unit = "";
      var NormalizedText = "";
 
      for (const entity of result.entities) {

        if (entity.category == "Date"&&Dated=="") {
          Dated=entity.text
        }

        if (entity.category == "ExaminationName" && entity.text != "RESULT IN INDEX" && entity.text != "Hence" && entity.text != "TextName" && entity.text != "Test" && entity.text != "test" && entity.text != "Lab" && entity.text != "Tests" && entity.text != "blood" && entity.text != "Count" && entity.text != "RESULT IN INDEX REMARKS") {

          TextName = entity.text
          NormalizedText = entity.normalizedText
          hasRecords = true

        }
        if (entity.category == "MeasurementValue") {

          TEST_VALUE = entity.text
          hasRecords = true


        }
        if (entity.category == "MeasurementUnit") {
          TEST_Unit = entity.text
          hasRecords = true
          //
        }

        if (TextName != "" && TEST_VALUE != "" && TEST_Unit != "") {


          var vitalId = 0
          NormalizedText ? NormalizedText.toString() : 'Undetermined'
          const data = new VitalDetailsSchema({

            vitalId: GetRandomId(10000, 1000000),
            normalizedText: NormalizedText == "" ? "Undetermined" : NormalizedText,
            normalvalues: "Undetermined",
            description: "Undetermined"


          })

          const user = await VitalDetailsSchema.findOne({
            normalizedText: NormalizedText

          });
          if (user == null || user.length == 0) {
            const dataToSave = await data.save();

            vitalId = data.vitalId

          }
          else {
            vitalId = user.vitalId

          }










































          const medicalRecordAIModel = new MedicalRecordAIModel({
            mraiId: GetRandomId(10000, 1000000),
            recordId: medicalrecordModel.recordId,
            testname: TextName,
            testvalue: TEST_VALUE,
            testunit: TEST_Unit,
            normalizedText: NormalizedText,
            vitalId: vitalId,
            dated:Dated,
            userId:req.body.userId

          })
          medicalRecordAIModel.save()
          TextName = "";
          TEST_VALUE = "";
          TEST_Unit = "";
          if (hasRecords) {
            var myquery = { recordId: medicalrecordModel.recordId };
            var newvalues = { $set: { smartReport: 1 } };
            MedicalRecordModel.findOneAndUpdate(myquery,
              newvalues,
              function (err, response) {
                // do something
              });
          }
          else {
            var myquery = { recordId: medicalrecordModel.recordId };
            var newvalues = { $set: { smartReport: 2 } };
            MedicalRecordModel.findOneAndUpdate(myquery,
              newvalues,
              function (err, response) {
                // do something
              });
          }

          continue;
        }
      }

    } else console.error("\tError:", result.error);
  }


})
async function readTextFromURL(client, url) {
  // To recognize text in a local image, replace client.read() with readTextInStream() as shown:
  let result = await client.read(url);
  // Operation ID is last path segment of operationLocation (a URL)
  let operation = result.operationLocation.split('/').slice(-1)[0];

  // Wait for read recognition to complete
  // result.status is initially undefined, since it's the result of read
  while (result.status !== "succeeded") { await sleep(1000); result = await client.getReadResult(operation); }

  return result.analyzeResult.readResults; // Return the first page of result. Replace [0] with the desired page if this is a multi-page file such as .pdf or .tiff.
}






router.get('/medicalreport/GetReport', auth, async (req, res) => {
  const decoded = jwt.verify(req.header('x-access-token'), process.env.TOKEN_KEY);  
  var userId = decoded.userId  
  MedicalRecordModel.aggregate([

    { $match: { userId: Number(userId) } },


  ]).exec(function (err, students) {

    students.forEach(result => {
      const unixTime = result.dateTimeStamp;
      const date = new Date(unixTime);
      result.ago = moment(date, "YYYY-MM-DD HH:mm:ss").fromNow();


    });
    res.json(success("OK", { data: students }, res.statusCode))
  });

})
router.get('/medicalreport/GetSmartReport/:recordId', auth,async (req, res) => {



  const recordId = req.params.recordId

  MedicalRecordAIModel.aggregate([
    { $match: { recordId: Number(recordId) } },

    {

      $lookup: {
        from: "vitaldetailsschemas",
        localField: "vitalId",
        foreignField: "vitalId",
        as: "vitaldetails"
      },

    }
    ,
  ]).exec(function (err, students) {
    res.json(success("OK", { data: students }, res.statusCode))
  });

})













































router.post('/vitaldetails/post',auth, async (req, res) => {


  const posts = new VitalDetailsSchema({

    vitalId: GetRandomId(10000, 1000000),
    normalizedText: req.body.normalizedText,
    normalvalues: req.body.normalvalues,
    description: req.body.description,
    majorVitalId: req.body.majorVitalId,
    

  })
  posts.save()
  res.json(success("OK", { data: posts }, res.statusCode))



});

router.get('/vitaldetails/getcharts/:vitalId',auth, async (req, res) => {
  const decoded = jwt.verify(req.header('x-access-token'), process.env.TOKEN_KEY);  
  var userId = decoded.userId 
  const vitalId = req.params.vitalId
  try {
    MedicalRecordAIModel.aggregate([
      { $match: { $and: [{ userId: Number(userId) }, { vitalId: Number(vitalId) }] } },

    ]).exec(function (err, students) {
      res.json(success("OK", { data: students }, res.statusCode))
    });
  }
  catch (errors) {
    res.json(error(errors.message, res.statusCode))
  }
});
router.get('/vitaldetails/updateVitalValue/:mraiId/:testvalue/:testname',auth, async (req, res) => {

  var myquery = { mraiId: Number(req.params.mraiId) };
  var newvalues = { $set: { testvalue: req.params.testvalue ,testname: req.params.testname} };
  MedicalRecordAIModel.findOneAndUpdate(myquery,
    newvalues,
    function (err, response) {
     
    });
  res.json(success("Record Successfully Updated", { data: "1" }, res.statusCode))


})
router.post('/vitaldetails/addnewLabVital', auth, async  (req, res) => {
  const decoded = jwt.verify(req.header('x-access-token'), process.env.TOKEN_KEY); f 
  var userId = decoded.userId 
 var recordId=req.body.recordId
 var data=req.body.data
 var Dated=req.body.dated
 
 res.json(success("Record Added Updated", { data: "1" }, res.statusCode))
  var documents = [
    data
  ];
  const poller = await client.beginAnalyzeHealthcareEntities(documents);
  const results = await poller.pollUntilDone();

  for await (const result of results) {


    if (!result.error) {
      var TextName = "";
      var TEST_VALUE = "";
      var TEST_Unit = "";
      var NormalizedText = "";
 
      for (const entity of result.entities) {


        if (entity.category == "ExaminationName" && entity.text != "RESULT IN INDEX" && entity.text != "Hence" && entity.text != "TextName" && entity.text != "Test" && entity.text != "test" && entity.text != "Lab" && entity.text != "Tests" && entity.text != "blood" && entity.text != "Count" && entity.text != "RESULT IN INDEX REMARKS") {

          TextName = entity.text
          NormalizedText = entity.normalizedText
          hasRecords = true

        }
        if (entity.category == "MeasurementValue") {

          TEST_VALUE = entity.text
          hasRecords = true


        }
        if (entity.category == "MeasurementUnit") {
          TEST_Unit = entity.text
          hasRecords = true
          //
        }

        if (TextName != "" && TEST_VALUE != "" && TEST_Unit != "") {


          var vitalId = 0
          NormalizedText ? NormalizedText.toString() : 'Undetermined'
          const data = new VitalDetailsSchema({

            vitalId: GetRandomId(10000, 1000000),
            normalizedText: NormalizedText == "" ? "Undetermined" : NormalizedText,
            normalvalues: "Undetermined",
            description: "Undetermined"


          })

          const user = await VitalDetailsSchema.findOne({
            normalizedText: NormalizedText

          });
          if (user == null || user.length == 0) {
            const dataToSave = await data.save();

            vitalId = data.vitalId

          }
          else {
            vitalId = user.vitalId

          }










































          const medicalRecordAIModel = new MedicalRecordAIModel({
            mraiId: GetRandomId(10000, 1000000),
            recordId:recordId,
            testname: TextName,
            testvalue: TEST_VALUE,
            testunit: TEST_Unit,
            normalizedText: NormalizedText,
            vitalId: vitalId,
            dated:Dated,
            userId:userId

          })
          medicalRecordAIModel.save()
          TextName = "";
          TEST_VALUE = "";
          TEST_Unit = "";
         
          continue;
        }
      }

    } else console.error("\tError:", result.error);
  }


})
router.post('/fileuploadImagePrescriptions', uploadimage.single("file"),auth, async function (req, res, next) {




  const medicalrecordModel = new MedicalRecordModel({
    recordId: GetRandomId(10000, 1000000),
    dateTimeStamp: new Date(),
    fileUrl: req.file.url,
    fileType: 2,
    userId: req.body.userId,
    smartReport: 0

  })
 // medicalrecordModel.save()
  res.json(success("Record Saved! We will update once Smart Report Gets Generated", { data: 1 }, res.statusCode))
  var printedTextSampleURL = req.file.url; // pdf/jpeg/png/tiff formats

  const computerVisionKey = "817c78b1b5d042f2a9077eb345ff7c96";
  const computerVisionEndPoint = "https://ayushmanocrdetectionpdfs.cognitiveservices.azure.com/";
  const cognitiveServiceCredentials = new CognitiveServicesCredentials(computerVisionKey);
  const computerVisionClient = new ComputerVisionClient(cognitiveServiceCredentials, computerVisionEndPoint);

  const printedResult = await readTextFromURL(computerVisionClient, printedTextSampleURL);

  var data = "";
  var hasRecords = false
  for (const page in printedResult) {

    const result = printedResult[page];
    if (result.lines) {
      if (result.lines.length) {
        for (const line of result.lines) {

          data = data + " " + line.text + " "
        }
      }
    }

    else { }
  }


  var documents = [
    data
  ];
  const poller = await client.beginAnalyzeHealthcareEntities(documents);
  const results = await poller.pollUntilDone();
  var Dated = "";

  for await (const result of results) {

    console.log(result)
  /*   if (!result.error) {
      var TextName = "";
      var TEST_VALUE = "";
      var TEST_Unit = "";
      var NormalizedText = "";
 
      for (const entity of result.entities) {

        if (entity.category == "Date"&&Dated=="") {
          Dated=entity.text
        }

        if (entity.category == "ExaminationName" && entity.text != "RESULT IN INDEX" && entity.text != "Hence" && entity.text != "TextName" && entity.text != "Test" && entity.text != "test" && entity.text != "Lab" && entity.text != "Tests" && entity.text != "blood" && entity.text != "Count" && entity.text != "RESULT IN INDEX REMARKS") {

          TextName = entity.text
          NormalizedText = entity.normalizedText
          hasRecords = true

        }
        if (entity.category == "MeasurementValue") {

          TEST_VALUE = entity.text
          hasRecords = true


        }
        if (entity.category == "MeasurementUnit") {
          TEST_Unit = entity.text
          hasRecords = true
          //
        }

        if (TextName != "" && TEST_VALUE != "" && TEST_Unit != "") {


          var vitalId = 0
          NormalizedText ? NormalizedText.toString() : 'Undetermined'
          const data = new VitalDetailsSchema({

            vitalId: GetRandomId(10000, 1000000),
            normalizedText: NormalizedText == "" ? "Undetermined" : NormalizedText,
            normalvalues: "Undetermined",
            description: "Undetermined"


          })

          const user = await VitalDetailsSchema.findOne({
            normalizedText: NormalizedText

          });
          if (user == null || user.length == 0) {
            const dataToSave = await data.save();

            vitalId = data.vitalId

          }
          else {
            vitalId = user.vitalId

          }










































          const medicalRecordAIModel = new MedicalRecordAIModel({
            mraiId: GetRandomId(10000, 1000000),
            recordId: medicalrecordModel.recordId,
            testname: TextName,
            testvalue: TEST_VALUE,
            testunit: TEST_Unit,
            normalizedText: NormalizedText,
            vitalId: vitalId,
            dated:Dated,
            userId:req.body.userId

          })
          medicalRecordAIModel.save()
          TextName = "";
          TEST_VALUE = "";
          TEST_Unit = "";
          if (hasRecords) {
            var myquery = { recordId: medicalrecordModel.recordId };
            var newvalues = { $set: { smartReport: 1 } };
            MedicalRecordModel.findOneAndUpdate(myquery,
              newvalues,
              function (err, response) {
                // do something
              });
          }
          else {
            var myquery = { recordId: medicalrecordModel.recordId };
            var newvalues = { $set: { smartReport: 2 } };
            MedicalRecordModel.findOneAndUpdate(myquery,
              newvalues,
              function (err, response) {
                // do something
              });
          }

          continue;
        }
      }

    } else console.error("\tError:", result.error); */
  }
 

})


router.post('/majorvitals/post',auth, async (req, res) => {


  const posts = new MajorVitalsSchema({

    majorVitalId: GetRandomId(10000, 1000000),
    normalizedText: req.body.normalizedText,
    image: req.body.image,
  })
  posts.save()
  res.json(success("OK", { data: posts }, res.statusCode))
});




router.get('/smartHealth/GetSmartHealthAnalysis',auth, async (req, res) => {
  const decoded = jwt.verify(req.header('x-access-token'), process.env.TOKEN_KEY);  
  var userId = decoded.userId 


  MajorVitalsSchema.aggregate([
  

    {

      $lookup: {
        from: "vitaldetailsschemas",
        localField: "majorVitalId",
        foreignField: "majorVitalId",
        as: "vitaldetails"
      },

    },
 
   
    { 
      $unwind: "$vitaldetails" 
  },
 
  {

    $lookup: {
      from: "medicalrecordaidatas",
      localField: "vitaldetails.vitalId",
      foreignField: "vitalId",
  
      as: "medicalrecord"
    },

  },

  { $group:{ _id:'$_id', data: { $push: '$$ROOT' }} },
 

 
    
  ]).exec(function (err, students) {









    res.json(success("OK", { data: students }, res.statusCode))
  });

})



router.post('/vitaldetails/addHeartRate',auth,  async  (req, res) => {
  const decoded = jwt.verify(req.header('x-access-token'), process.env.TOKEN_KEY);  
  var userId = decoded.userId 
  const medicalRecordAIModel = new MedicalRecordAIModel({
    mraiId: GetRandomId(10000, 1000000),
    recordId:0,
    testname: req.body.testname,
    testvalue:req.body.testvalue,
    testunit: req.body.testunit,
    normalizedText: req.body.normalizedText,
    vitalId: req.body.vitalId,
    dated:req.body.dated,
    userId:userId

  })
  medicalRecordAIModel.save()
  res.json(success("Heart Rates  Added", { data: "1" }, res.statusCode))
 
 })




 router.get('/getvitals/getvitalsByMajorVitalId/:majorVitalId',auth, async (req, res) => {
  const majorVitalId = req.params.majorVitalId

 
  const data = await vitalDetails.find({ majorVitalId: Number(majorVitalId) });

  res.json(success("Vitals Fetched Succeddfully", { data: data }, res.statusCode))

})











 router.get('/labtest/getProviderToken/:providerId', auth, async  (req, res) => {
 var providerId=req.params.providerId
if(providerId==1)
{
  var config = {
  baseURL: 'https://velso.thyrocare.cloud/api',
}


axios.post('/Login/Login', {
  username: "9650269758",  password: "050A24",  portalType: "", userType: "dsa", facebookId: "string",  mobile: "string" 
},config)
.then(function (response) {
 res.json(success("Meddleware Logged In", { data: response.data.apiKey}, res.statusCode))
})
.catch(function (error) {

});
}
 })




 router.post('/labtest/gettests', auth, async  (req, res) => {

  var providerId=req.body.providerId
  var testtype=req.body.type
  var vendorApiKey=req.body.apiKey

 if(providerId==1)
 {
   var config = {
   baseURL: 'https://velso.thyrocare.cloud/api',
 }
 
 
 axios.post('/productsmaster/Products', {ProductType: testtype,  apiKey: vendorApiKey},config)
 .then(function (response) {
 

  let testsArray = [];
switch (testtype) {
  case 'TEST':
  
    response.data.master.tests.forEach(results => {
      let childArray = [];
      results.childs.forEach(child => {
        childArray.push({
    
          name: child.name,
          code: child.code,
          groupName: results.groupName,
      });
      });
  
      testsArray.push({
        name: results.name,
        code: results.code,
        testCount: results.testCount,
        fasting: results.fasting,
        diseaseGroup: results.diseaseGroup,
        units: results.units,
        groupName: results.groupName,
        category: results.category,
        rate:results.rate.b2C,
        discount:results.rate.b2B,
       
        testlist:childArray
  
    });
        });
  
      
  
  
  
    res.json(success("Lab Tests Feched Successfully", { data: testsArray}, res.statusCode))
    break;

  case 'Profile':
    console.log('Profile');
    
    response.data.master.profile.forEach(results => {
      let childArray = [];
      results.childs.forEach(child => {
        childArray.push({
    
          name: child.name,
          code: child.code,
          groupName: results.groupName,
      });
      });
  
      testsArray.push({
        name: results.name,
        code: results.code,
        testCount: results.testCount,
        fasting: results.fasting,
        diseaseGroup: results.diseaseGroup,
        units: results.units,
        groupName: results.groupName,
        category: results.category,
        rate:results.rate.b2C,
        discount:results.rate.b2B,
        image:results.imageMaster[0].imgLocations,
        image1:results.imageMaster[1].imgLocations,
        testlist:childArray
  
    });
        });
  
      
  
  
  
    res.json(success("Lab Tests Feched Successfully", { data: testsArray}, res.statusCode))
    break;
    case 'Offer':
      console.log('Offer');
     
  response.data.master.offer.forEach(results => {
    let childArray = [];
    results.childs.forEach(child => {
      childArray.push({
  
        name: child.name,
        code: child.code,
        groupName: results.groupName,
    });
    });

    testsArray.push({
      name: results.name,
      code: results.code,
      testCount: results.testCount,
      fasting: results.fasting,
      diseaseGroup: results.diseaseGroup,
      units: results.units,
      groupName: results.groupName,
      category: results.category,
      rate:results.rate.b2C,
      discount:results.rate.b2B,
      image:results.imageMaster[0].imgLocations,
      image1:results.imageMaster[1].imgLocations,
      testlist:childArray

  });
      });

    



  res.json(success("Lab Tests Feched Successfully", { data: testsArray}, res.statusCode))
      break;
  default:
    console.log(`Sorry, we are out of ${testtype}.`);
}

 
 })
 .catch(function (error) {
  console.log(error)
 });
 }
  })


  
 
  router.post('/labtest/getAppontmentSlots', auth, async  (req, res) => {

      var providerId=req.body.providerId
      var pincode=req.body.Pincode
      var vendorApiKey=req.body.apiKey
      var date=req.body.date
     if(providerId==1)
     {
       var config = {
       baseURL: 'https://velso.thyrocare.cloud/api',
     }
     
     
     axios.post('/TechsoApi/GetAppointmentSlots', {Pincode: pincode,  ApiKey: vendorApiKey,  Date: date},config)
     .then(function (data) {
       let testsArray = [];
       data.data.lSlotDataRes.forEach(child => {
        testsArray.push({
    
          id: child.id,
          slot: child.slot,
      
      });
      }); 
      res.json(success(data.data.response, { data:testsArray}, res.statusCode))
    
     
     })
     .catch(function (error) {
      console.log(error)
     });
     }
      })




  router.post('/labtest/verifyPinCodeAvaiblity',auth,  async  (req, res) => {

        var providerId=req.body.providerId
        var pincode=req.body.Pincode
        var vendorApiKey=req.body.apiKey
       
       if(providerId==1)
       {
         var config = {
         baseURL: 'https://velso.thyrocare.cloud/api',
       }
       
       
       axios.post('/TechsoApi/PincodeAvailability', {Pincode: pincode,  ApiKey: vendorApiKey},config)
       .then(function (data) {
        
        res.json(success(data.data.response, { data:data.data}, res.statusCode))
      
       
       })
       .catch(function (error) {
        console.log(error)
       });
       }
        })
  


  router.post('/labtest/bookLabTest', auth, async  (req, res) => {
    const decoded = jwt.verify(req.header('x-access-token'),process.env.TOKEN_KEY);  
  var userId = decoded.userId 
        var providerId=req.body.providerId
      
        var vendorApiKey=req.body.apiKey
       
        var Email=req.body.Email
        var Gender=req.body.Gender
        var Mobile=req.body.Mobile
        var Address=req.body.Address
        var ApptDate=req.body.ApptDate
        var Pincode=String(req.body.Pincode)
        var Product= req.body.Product
        var Rate= req.body.Rate
        var Reports = req.body.Reports
        var BenCount= req.body.BenCount
        var ReportCode= req.body.ReportCode
        var BenDataXML= req.body.BenDataXML
       
       

      
        
        
       if(providerId==1)
       {
         var config = {
         baseURL: 'https://velso.thyrocare.cloud/api',
          headers: {
    'Content-Type': 'application/json'
  }
       }
       
     
        axios.post('/BookingMaster/DSABooking', { 
        ApiKey:vendorApiKey,
         Email:Email,
         Gender:Gender,
         Mobile:Mobile,
         Address:Address,
         ApptDate:ApptDate,
         Pincode:String(Pincode),
         Product: Product,
         Rate: Rate,
    
         ReportCode:ReportCode, 
         Reports : Reports,
         BenCount:BenCount,

         BenDataXML:BenDataXML,
         Margin:"0",
         OrderId: String(GetRandomId(10000, 1000000)),
         OrderBy:"DSA",
         Passon: 0,
         PayType: "Postpaid",
         PhoneNo:"",
       
         Remarks:"",
        
         ServiceType: "H",
         RefCode: "9650269758"},config)
       .then(function (data) {
        console.log(data)

        if(data.data.respId=="RES02012")
        {
          

          const laborderdetails = new LaborderdetailsSchema({
            orderId:data.data.refOrderId,
           
            userId:userId,


             providerId:req.body.providerId,
             bookedOn:req.body.providerId,
             
           
         
             address:req.body.Address,
             bookedOn: new Date(),
          
             product: req.body.Product,
             rate: data.data.customerRate,
             paymentType: data.data.payType,
          
             serviceType: data.data.serviceType,
          
        
             appointmentDate:ApptDate,
           
        
          })
          laborderdetails.save()
          


        }






        res.json(success("Done", { data:data.data}, res.statusCode))
         
















       
       })
       .catch(function (error) {
        if (error.response) {
          console.log(error.response.data);
        
        }
       });  
       }})


  router.post('/vitaldetails/addCustomVitalRecords',auth,  async  (req, res) => {
    const decoded = jwt.verify(req.header('x-access-token'), process.env.TOKEN_KEY);  
  var userId = decoded.userId 
          const medicalRecordAIModel = new MedicalRecordAIModel({
            mraiId: GetRandomId(10000, 1000000),
            recordId:0,
            testname: req.body.testname,
            testvalue:req.body.testvalue,
            testunit: req.body.testunit,
            normalizedText: req.body.normalizedText,
            vitalId: req.body.vitalId,
            dated:req.body.dated,
            userId:userId,
            majorVitalId: req.body.majorVitalId,
        
          })
          medicalRecordAIModel.save()
          res.json(success("Vitals Added  Successfully", { data: "1" }, res.statusCode))
         
         })




         
router.post('/labtest/Addbeni', auth, async  (req, res) => {
  const beniModel = new BenificiariesSchema({
    baniid: GetRandomId(10000, 1000000),
    beniUserId: req.body.beniUserId,
    beniname: req.body.beniname,
    age: req.body.age,
    gender: req.body.gender,
    lastname:req.body.lastname
    

  })
  beniModel.save()
  res.json(success("beneficiary Added Successfully", { data: "1" }, res.statusCode))
 
 })
 router.get('/labtest/Getbeni/:beniUserId',auth, async (req, res) => {
  var beniUserId=req.params.beniUserId
  BenificiariesSchema.aggregate([

    { $match: { beniUserId: Number(beniUserId) } },
    
  ]).exec(function (err, students) {

   
    res.json(success("OK", { data: students }, res.statusCode))
  });

})

router.get('/labtest/GetbeniDetails/:baniid',auth, async (req, res) => {
  var baniid=req.params.baniid
  BenificiariesSchema.aggregate([

    { $match: { baniid: Number(baniid) } },
    
  ]).exec(function (err, students) {

   
    res.json(success("OK", { data: students }, res.statusCode))
  });

})
router.get('/labtest/getOrders',auth, async (req, res) => {
  const decoded = jwt.verify(req.header('x-access-token'), process.env.TOKEN_KEY);  
  var userId = decoded.userId 




   try {
    LaborderdetailsSchema.aggregate([
      { $match: { userId: Number(userId) } },

    ]).exec(function (err, students) {


      
      res.json(success("OK", { data: students }, res.statusCode))
    });
  }
  catch (errors) {
    res.json(error(errors.message, res.statusCode))
  } 
});
router.post('/labtest/getOrdersSummary', auth,async (req, res) => {

  const orderId = req.body.orderId
  var providerId=req.body.providerId
      
  var vendorApiKey=req.body.apiKey

  if(providerId==1)
  {
    var config = {
    baseURL: 'https://velso.thyrocare.cloud/api',
     headers: {
'Content-Type': 'application/json'
}
  }
  

   axios.post('/OrderSummary/OrderSummary', { ApiKey:vendorApiKey,OrderNo:orderId},config)
  .then(function (data) {


   if(data.data.respId=="RES00001")
   {


    res.json(success(data.data.response, { data:data.data}, res.statusCode))


   }
   else
   {
    
   res.json(success(data.data.response, { data:data.data}, res.statusCode))
   }

  }
  )
}




 






});

router.post('/abha/getToken',auth, async (req, res) => {
 

var  clientId= "SBX_001797";
var clientSecret="59f20f08-e0e6-4f59-99b8-ffd65ecf70d0";

   axios.post('https://dev.abdm.gov.in/gateway/v0.5/sessions', { clientId:clientId,clientSecret:clientSecret})
  .then(function (data) {
    res.json(success(data.data.response, { data:data.data}, res.statusCode))

  }
  )



});
router.post('/addAbhaToBeni',auth, async (req, res)=> {

console.log(req)


 //req.file.url,
 var myquery = { baniid: req.body.baniid };
 var newvalues = { $set: { abhaid:String(req.body.abhaid) ,abhanumber: String(req.body.abhanumber),token: String(req.body.token),refreshToken: String(req.body.refreshToken) } };
  BenificiariesSchema.findOneAndUpdate(myquery,
    newvalues,
    function (err, response) {
      // do something
    });







  res.json(success("Synced To Your Profile Successfully", { data: 1 }, res.statusCode))
 

})


router.post('/generateAuthToken',auth,async (req,res) => {
  
  const refreshToken = req.body.refreshToken
console.log(refreshToken)
 
  if((refreshToken) ) {

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_PRIVATE_KEY, 
      (err, decoded) => {
          if (err) {

              // Wrong Refesh Token
              return  res.json(success("Wrong refresh Token", { data:null}, res.statusCode))
          }
          else {
            const decoded = jwt.verify(req.header('x-access-token'),process.env.TOKEN_KEY);  
            var userId = decoded.userId  
            
             
              const authtoken = jwt.sign(
                { userId: userId },
                process.env.TOKEN_KEY,
                {
                  expiresIn: "2h",
                }
              );
              const newRefreshtoken = jwt.sign(
                { userId: userId },
                process.env.REFRESH_TOKEN_PRIVATE_KEY,
                { expiresIn: "90d"}
            );
               
             var tokens={newAuthtoken:authtoken,newRefreshtoken: newRefreshtoken }
          var myquery = { userId: userId};
          var newvalues = { $set: { authtoken: authtoken,refreshtoken: newRefreshtoken } };
          UserModel.findOneAndUpdate(myquery,
            newvalues,
            function (err, response) {
              res.json(success("Auth Token Created", { data:tokens}, res.statusCode))
            });
          }
      })
  } else {
      res.status(401).send('Invalid request')
  }
})


module.exports = router;