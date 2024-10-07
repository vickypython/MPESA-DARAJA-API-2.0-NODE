require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const moment = require("moment");
const app = express();
const server = http.createServer(app);
const axios = require("axios");
const mongoose = require("mongoose");
const PORT = process.env.PORT;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const MpesaTutorial = require("./notification");
const getAccessToken = async (_req, res, next) => {
  const consumerSecret = `${process.env.Mpesa_Secret}`;
  const consumerKey = `${process.env.Consumer_Key}`;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64"
  );

  await axios
    .get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    )
    .then((response) => {
      token = response.data.access_token;
      next();
    })
    .catch((error) => {
      console.log("this is the error:", error);
      // res.status(400).json({message:"Error occured",error:error.message})
    });
};
app.get("/", (req, res) => {
  res.send("welcome to Torvic");
});
// const timestamps=moment().format('YYYYMMDDHHmmss')
//   console.log(timestamps);
 
    
app.post("/stkPush", getAccessToken, async (req, res) => {
  const phone = req.body.phone.substring(1);
  const amount = req.body.amount;
  const now = new Date();
  const timestamp =
    now.getFullYear() +
    ("0" + (now.getMonth() + 1)).slice(-2) + //month is zero index so that the reason we add one for jan
    ("0" + now.getDate()).slice(-2) +
    ("0" + now.getHours()).slice(-2) +
    ("0" + now.getMinutes()).slice(-2) +
    ("0" + now.getSeconds()).slice(-2);

  const shortCode = `${process.env.SHORT_CODE}`;
  const passKey = `${process.env.PASS_KEY}`;
  const password = Buffer.from(shortCode + passKey + timestamp).toString(
    "base64"
  );
  await axios
    .post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: `254${phone}`,
        PartyB: shortCode,
        PhoneNumber: `254${phone}`,
        CallBackURL: "https://eb20-41-81-86-240.ngrok-free.app/api/callbackPath",
        AccountReference: "Payment of X",
        TransactionDesc: "Test",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    .then((response) => {
      console.log(response.data);
      res.status(200).json(response.data);
    })
    .catch((error) => {
      console.log("failed to push", error.message);
      res.status(400).json(error.message);
    });
});

app.post("/api/callbackPath", async (req, res) => {
  
  const callbackInformation = req.body.Body.stkCallback.callbackMetadata;
  if (!callbackInformation) {
    console.log("The transaction diD NOT go as planned");
    res.json("happy saf");
  }
  const phone = callbackInformation.Item[4].value;
  const amount = callbackInformation.Item[0].value;
  const trx_id = callbackInformation.Item[1].value;
  console.log(phone);
  console.log(amount);
  console.log(trx_id);
  //create a new instance of an object
  const Payment =  new MpesaTutorial({
    amount: amount,
    phone: phone,
    trx_id: trx_id,
  });
  const results = await Payment.save();
  res.status(200).json({ message: "new Payment made successfully", transaction: results });
});

server.listen(PORT, () => {
  console.log(`server runnibg on port:http://localhost:${PORT}`);
});

const MONGO_URL = `mongodb+srv://vickymlucky:${process.env.MONGODB_PASSWORD}@cluster0.xaqfsym.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
//connet to the db //establish connection
mongoose.connect(MONGO_URL);

const db=mongoose.connection
db.on('error',(error)=>console.log(error))
db.once('open',()=>console.log(' connected to the database'))

