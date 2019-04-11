if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  require("dotenv").config();
}
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const firebase = require("firebase-admin");
const ServiceAccount = require("./ServiceAccount");
const intraRequest = require("./Intra");
const moment = require("moment");
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

/*
 * Student Routes
 */
// Get all HackHighSchool students' quick details from our DB
app.get("/students", async (req, res) => {
  studentsRef.once("value", studentSnapshot => {
    let students = Object.values(studentSnapshot.val());
    res.status(200).send(students);
  });
});

// Get full profile from our DB & Intra API
app.get("/students/:login", async (req, res) => {
  let student = {};
  const { login } = req.params;

  await studentsRef.child(login).once("value", studentSnapshot => {
    student = studentSnapshot.val();
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

// Update student
app.patch("/students/:login", async (req, res) => {
  const { login } = req.params;
  const { displayname, group } = req.body;
  let student = {};

  await studentsRef.child(login).once("value", studentSnapshot => {
    student = studentSnapshot.val();
  });
  let update = {
    displayname: displayname ? displayname : student.displayname,
    group: group ? group : student.group
  };
  student = await studentsRef.child(login).update(update);
  res.status(200).send(student);
});

// Update the checkin status by login
app.patch("/checkin/:login", async (req, res) => {
  const { login } = req.params;
  const { checkin_status } = req.body;
  let student = {};

  await studentsRef.child(login).once("value", studentSnapshot => {
    student = studentSnapshot.val();
  });

  let attendance_history = student.attendance_history
    ? student.attendance_history
    : [];
  try {
    if (
      (typeof student.checkin_status === "undefined" ||
        student.checkin_status === false) &&
      checkin_status === true
    ) {
      let today = moment().format("MM DD YYYY");
      if (!attendance_history.includes(today)) {
        attendance_history.push(today);
      }
    }
  } catch (error) {
    console.error(error);
  }
  await studentsRef
    .child(login)
    .update({ checkin_status, attendance_history: attendance_history });
  res.status(200).send(`Checkin status update to ${checkin_status}`);
});

// Post a new evaluation to user by login
app.post("/evaluations/:login", async (req, res) => {
  const { login } = req.params;
  const { evaluation } = req.body;

  await studentsRef.child(`${login}/evaluations`).push(evaluation);
  res.status(200).send("Eval added");
});

/*
 * Group/Mentor Routes
 */

// Get list of groups w/ mentor
app.get("/groups", (req, res) => {
  groupsRef.once("value", groupSnapshot => {
    let groups = Object.values(groupSnapshot.val());
    res.status(200).send(groups);
  });
});

// Get info for a group -> Current Mentor, students, projects
app.get("/groups/:code", async (req, res) => {
  const { code } = req.params;
  let group = {};
  await groupsRef.child(code).once("value", groupSnapshot => {
    group = groupSnapshot.val();
  });
  let intraDetails = await intraRequest(
    `https://api.intra.42.fr/v2/projects/${group.id}`,
    err => {
      console.error(err);
    }
  );
  group = { ...group, ...intraDetails };
  res.status(200).send(group);
});

app.patch("/groups/:code", async (req, res) => {
  const { code } = req.params;
  const { mentor, image_url, students } = req.body;
  let group = {};

  await groupsRef.child(code).once("value", groupSnapshot => {
    group = groupSnapshot.val();
  });
  if (typeof group.students === "undefined") {
    group.students = [];
  }
  if (typeof group.image_url === "undefined") {
    group.image_url = "";
  }

  let update = {
    mentor: mentor ? mentor : group.mentor,
    image_url: image_url ? image_url : group.image_url,
    students: students ? students : group.students
  };
  await groupsRef.child(code).update(update);
  group = { ...group, ...update };
  res.status(200).send(group);
});

// BONUS TODO: End session route to set all students' checkin_status to false
app.listen(port, () => {
  console.log("Server running on port: " + port);
});

// Get all students -> "https://api.intra.42.fr/v2/cursus/17/cursus_users?filter%5Bactive%5D=true&filter%5Bcampus_id%5D=7&page%5Bsize%5D=100&per_page"
