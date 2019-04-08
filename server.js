const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const firebase = require("firebase-admin");
const ServiceAccount = require("./ServiceAccount");
const app = express();
const port = process.env.PORT || 3000;

firebase.initializeApp({
  credential: firebase.credential.cert(ServiceAccount),
  databaseURL: "https://h2s-student-management.firebaseio.com"
});

const db = firebase.database();

// TODO: Need a one time setup to sync our DB with intra login/image_url data

app.get("/students", (req, res) => {
  // TODO: Get all HackHighSchool students' short details from our DB
});

app.get("/students/:login", (req, res) => {
  // TODO: Get full profile from our DB & Intra API
});

app.post("/evaluations/:login", (req, res) => {
  // TODO: Post a new evaluation to user by login
});

app.patch("/checkin/:login", (req, res) => {
  // TODO: Update the checkin status by login
});

app.listen(port, () => {
  console.log("Server running on port: " + port);
});
