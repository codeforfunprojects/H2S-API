const firebase = require("firebase-admin");
const ServiceAccount = require("./ServiceAccount");
// Intialize firebase and save DB refs
firebase.initializeApp({
  credential: firebase.credential.cert(ServiceAccount),
  databaseURL: "https://h2s-student-management.firebaseio.com"
});
const db = firebase.database();

module.exports = db;
