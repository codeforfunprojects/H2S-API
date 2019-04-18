if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  require("dotenv").config();
}
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const moment = require("moment");
const intraRequest = require("./utils/Intra");

const db = require("./firebase");
const studentsRef = db.ref("students");
const groupsRef = db.ref("groups");
const usersRef = db.ref("users");

// Create app, then add CORS & bodyParser middleware
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.unsubscribe(bodyParser.urlencoded({ extended: false }));

/******************************************************************************/
/* 																																						*/
/* 														Begin API Setup 																*/
/*																																						*/
/******************************************************************************/

const port = process.env.PORT || 8080;
const API_KEY =
  !process.env.NODE_ENV ||
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV === "test"
    ? process.env.API_KEY
    : JSON.parse(process.env.API_KEY);

/******************************************************************************/
/* 																																						*/
/* 																User Routes 																*/
/*																																						*/
/******************************************************************************/

// Set a user role
app.post("/user", async (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).send("Invalid API Key");
  }
  let { user } = req.body;
  try {
    await usersRef.push(user);
    res.status(200).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Return user's role
app.get("/user/:email", async (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).send("Invalid API Key");
  }
  const { email } = req.params;
  let user;
  try {
    await usersRef.once("value", studentSnapshot => {
      let users = Object.values(studentSnapshot.val());

      user = users.find(item => {
        return item.email === email;
      });
    });
    res.status(200).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

/******************************************************************************/
/* 																																						*/
/* 															Student Routes 																*/
/*																																						*/
/******************************************************************************/

// Get all HackHighSchool students' quick details from our DB
app.get("/students", async (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).send("Invalid API Key");
  }
  studentsRef.once("value", studentSnapshot => {
    let students = Object.values(studentSnapshot.val());
    res.status(200).send(students);
  });
});

// Get full profile from our DB & Intra API
app.get("/students/:login", async (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).send("Invalid API Key");
  }
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
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).send("Invalid API Key");
  }
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

// Add student to group
app.patch("/groups/students/:login", async (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).send("Invalid API Key");
  }
  try {
    const { login } = req.params;
    const { code } = req.body;
    let student = {};
    await studentsRef.child(login).once("value", studentSnapshot => {
      student = studentSnapshot.val();
    });
    if (typeof student.group !== "undefined") {
      console.log(student.group.code);

      await groupsRef
        .child(`${student.group.code}/students`)
        .once("value", loginSnapshot => {
          let groupLogins = loginSnapshot.val();
          let userKey = Object.keys(groupLogins).find(
            key => groupLogins[key] === login
          );
          db.ref(`groups/${student.group.code}/students/${userKey}`).remove();
        });
    }
    await groupsRef.child(`${code}/students`).push(login);
    await groupsRef.child(`${code}`).once("value", groupSnapshot => {
      let groupDetails = groupSnapshot.val();
      const { code, name, image_url } = groupDetails;
      student.group = { code, name, image_url };
    });
    await studentsRef.child(login).set(student);
    res.status(200).send(student);
  } catch (error) {
    console.error(error);
    res.status(400);
  }
});

// Update the checkin status by login
app.patch("/checkin/:login", async (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).send("Invalid API Key");
  }
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
      let today = moment().format("MM-DD-YYYY");
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
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).send("Invalid API Key");
  }
  const { login } = req.params;
  const { progress } = req.body;
  let today = moment().format("MM-DD-YYYY");

  if (typeof progress.goal !== "string") {
    return res.status(400).send("Evaluations must start with goals");
  }
  await studentsRef
    .child(`${login}/evaluations`)
    .child(today)
    .set(progress);
  res.status(200).send("Eval added");
});

// Update evaluation
app.patch("/evaluations/:login", async (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).send("Invalid API Key");
  }
  const { login } = req.params;
  const { progress } = req.body;
  let today = moment().format("MM-DD-YYYY");

  // TODO: Check for goal before posting new eval

  try {
    await studentsRef
      .child(`${login}/evaluations`)
      .child(today)
      .update(progress);
    res.status(200).send("Progress updated");
  } catch (err) {
    res.status(400).send(err);
  }
});

/******************************************************************************/
/* 																																						*/
/* 																Group Routes 																*/
/*																																						*/
/******************************************************************************/

// Get list of groups w/ mentor
app.get("/groups", (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).send("Invalid API Key");
  }
  groupsRef.once("value", groupSnapshot => {
    let groups = Object.values(groupSnapshot.val());
    res.status(200).send(groups);
  });
});

// Get info for a group -> Current Mentor, students, projects
app.get("/groups/:code", async (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).send("Invalid API Key");
  }
  const { code } = req.params;
  let group = {};
  await groupsRef.child(code).once("value", groupSnapshot => {
    group = groupSnapshot.val();
  });
  if (group.students) {
    let logins = Object.values(group.students);
    await studentsRef.once("value", studentsSnapshot => {
      let students = Object.values(studentsSnapshot.val());
      group.students = students.filter(student => {
        return logins.includes(student.login);
      });
    });
  }
  let intraDetails = await intraRequest(
    `https://api.intra.42.fr/v2/projects/${group.id}`,
    err => {
      console.error(err);
    }
  );
  group = { ...group, ...intraDetails };
  res.status(200).send(group);
});

// Update group by code
app.patch("/groups/:code", async (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).send("Invalid API Key");
  }
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

const server = app.listen(port, () => {
  console.log("Server running on port: " + port);
});

const closeServer = () => {
  server.close();
};

module.exports = { app, closeServer };

// FIXME: Need to check values on post/patch route parameters & body
// FIXME: Need better error handling
