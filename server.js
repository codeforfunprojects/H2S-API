require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const firebase = require("firebase-admin");
const ServiceAccount = require("./ServiceAccount");
const intraRequest = require("./Intra");
const app = express();
const port = process.env.PORT || 3000;

const studentList = require("./students.json");

// Intialize firebase and save DB refs
firebase.initializeApp({
  credential: firebase.credential.cert(ServiceAccount),
  databaseURL: "https://h2s-student-management.firebaseio.com"
});
const db = firebase.database();
const studentsRef = db.ref("students");
const groupsRef = db.ref("groups");

// Add CORS & bodyParser middleware
app.use(cors());
app.use(bodyParser.json());
app.unsubscribe(bodyParser.urlencoded({ extended: false }));

/****************/
/* 				*/
/* Begin Routes */
/*				*/
/****************/

// Get all HackHighSchool students' quick details from our DB
app.get("/students", async (req, res) => {
  /* const schema = {
    login,
    displayname,
    image_url
  };
   */
  studentsRef.orderByChild("name").once("value", studentSnapshot => {
    let students = Object.values(studentSnapshot.val());
    res.status(200).send(students);
  });
});

// Get full profile from our DB & Intra API
app.get("/students/:login", async (req, res) => {
  let student = {};
  const { login } = req.params;

  await studentsRef.orderByChild("name").once("value", studentSnapshot => {
    let students = Object.values(studentSnapshot.val());

    student = students.find(item => {
      return item.login === login;
    });
  });
  let intraDetails = await intraRequest(
    `https://api.intra.42.fr/v2/users/${student.login}`,
    (err, response, body) => {
      if (err) {
        console.error(err);
      }
    }
  );
  student = { ...student, ...intraDetails };
  res.send(student);
});

// Get list of groups w/ mentor
app.get("/groups", (req, res) => {
  groupsRef.orderByChild("name").once("value", groupSnapshot => {
    let groups = Object.values(groupSnapshot.val());
    res.status(200).send(groups);
  });
});

// Get info for a group -> Current Mentor, students, projects
app.get("/groups/:id", (req, res) => {
  const { id } = req.params;
  console.log(id, typeof id);

  groupsRef.orderByChild("name").once("value", groupSnapshot => {
    let groups = Object.values(groupSnapshot.val());
    let group = groups.find(item => {
      return item.id == id;
    });
    res.status(200).send(group);
  });
});

app.post("/evaluations/:login", (req, res) => {
  //what is this asking for? to create an eval slot from the site? or sign up to one?
  // TODO: Post a new evaluation to user by login
});

// Update the checkin status by login
app.patch("/checkin/:login", async (req, res) => {
  // TODO: Keep track of attendance dates
  const { login } = req.params;
  const { checkin_status } = req.body;

  await studentsRef.orderByChild("name").once("value", studentSnapshot => {
    let students = Object.values(studentSnapshot.val());

    student = students.find(item => {
      return item.login === login;
    });
    if (
      typeof student.checkin_status === "undefined" ||
      student.checkin_status !== checkin_status
    ) {
      student.checkin_status = checkin_status;
    }
    res.status(200).send(student);
  });
});

// TODO: Update Groups
// TODO: Update students

// BONUS TODO: End session route to set all students' checkin_status to false
app.listen(port, () => {
  console.log("Server running on port: " + port);
});

// Get all students -> "https://api.intra.42.fr/v2/cursus/17/cursus_users?filter%5Bactive%5D=true&filter%5Bcampus_id%5D=7&page%5Bsize%5D=100&per_page"
