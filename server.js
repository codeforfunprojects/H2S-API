const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const firebase = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const app = express();
const port = process.env.PORT || 3000;

firebase.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://h2s-student-management.firebaseio.com"
});

const db = firebase.database();

// TODO: Add routes
/*
 * 0. POST Add new students (Takes CSV)
 *	-> Should iterate through CSV, check if student exists and create students
 *	-> Should
 *
 * 1. GET Students
 * 	-> Should get all HackHighSchool students' short details from our DB & intra
 *
 * 2. GET Student/:id
 * 	-> Should get student details from our DB and from Intra;
 * 	-> Will update projects & check to update user information
 *
 * 3. POST StudentReport/:id (Takes JSON)
 * 	-> Send student reports
 *
 * 4. PATCH StudentCheckIn/:id (Takes Bool)
 *  -> Sets student checkIn status
 *
 * 5. DELETE Student:id
 * 6. PATCH Student:id
 * 	-> Allows updates to student info; ?? Should we update in Intra
 */

app.listen(port, () => {
  consol.log("Server running on port: " + port);
});
