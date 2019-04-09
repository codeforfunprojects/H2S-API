require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const firebase = require("firebase-admin");
const ServiceAccount = require("./ServiceAccount");
const intraRequest = require("./Intra");
const app = express();
const port = process.env.PORT || 3000;
const projid = [
  { id: 1132, name: "OOP" },
  { id: 1175, name: "WEBDEV" },
  { id: 1200, name: "APCSP" },
  { id: 1172, name: "GAME2" },
  { id: 1107, name: "ALGPUZ" },
  { id: 1109, name: "HACKADV" },
  { id: 1141, name: "PYTHON" },
  { id: 1295, name: "NODE" },
  { id: 1291, name: "PYGAME" },
  { id: 1167, name: "GAME1" },
  { id: 1283, name: "MCHLRN" },
  { id: 1196, name: "POLCALC" },
  { id: 1191, name: "DATAMIN" }
];
firebase.initializeApp({
  credential: firebase.credential.cert(ServiceAccount),
  databaseURL: "https://h2s-student-management.firebaseio.com"
});

const db = firebase.database();

// Add CORS & bodyParser middleware
app.use(cors());
app.use(bodyParser.json());
app.unsubscribe(bodyParser.urlencoded({ extended: false }));

//
//
/* Begin Routes */
//

// TODO: Need a one time setup to sync our DB with intra login/image_url data
const syncIntraFirebase = async () => {
  let intraDetails = [];
  let studentsH2S = await intraRequest(
    "https://api.intra.42.fr/v2/cursus/17/cursus_users?filter%5Bactive%5D=true&filter%5Bcampus_id%5D=7&page%5Bsize%5D=100&per_page",
    (err, response, body) => {
      if (!err) {
        let studentsH2S = JSON.parse(body);
        // NOTE: Is this all H2S students
        return studentsH2S;
      } else {
        console.error(err);
      }
    }
  );
  studentsH2S = JSON.parse(studentsH2S);
  //   let { login } = studentsH2S[0].user;
  //   let details = await intraRequest(
  //     `https://api.intra.42.fr/v2/users/${login}`,
  //     (err, res) => {
  //       if (err) {
  //         console.error(err);
  //       }
  //     }
  //   );
  //   console.log(JSON.parse(details));
  //   console.log();

  //   let { displayname, image_url } = details;
  //   let student = { login, displayname, image_url };
  //   console.log(student);

  studentsH2S.forEach(async item => {
    setTimeout(
      async item => {
        const { login } = item.user;
        // console.log(item);

        let details = await intraRequest(
          `https://api.intra.42.fr/v2/users/${login}`,
          (err, res) => {
            if (err) {
              console.error(err);
            }
          }
        );
        details = JSON.parse(details);
        let { displayname, image_url } = details;
        let student = { login, displayname, image_url };
        db.ref("students").push(student);
      },
      2000,
      item
    );
  });
};

syncIntraFirebase();

app.get("/students", async (req, res) => {
  /* const schema = {
    login: Joi.string().min(2).required(),
    project: Joi.projid.string().required(),
    photo:,
    level:
  };
   */
  //get only proj, level, photo, login
  // TODO: Get all HackHighSch students' short details from our DB
  let intraStudents = [];
  let details = await intraRequest(
    "https://api.intra.42.fr/v2/cursus/17/cursus_users?filter%5Bactive%5D=true&filter%5Bcampus_id%5D=7&page%5Bsize%5D=100&per_page",
    (err, response, body) => {
      if (err) {
        console.error(err);
      }
    }
  );
  intraStudents = details.map(item => {
    return item.user.login;
  });
  //   RN returns array of logins
  res.send(intraStudents);
  //   TODO: Serch firebase by login
});

app.get("/groups", (req, res) => {
  //list of all parent projects
  // TODO: Get list of groups w/ mentor -> Should come from our DB
  res.send(projid);
});

app.get("/students/:login", (req, res) => {
  //pull all objs from api
  // TODO: Get full profile from our DB & Intra API
});

app.get("/groups/:id", (req, res) => {
  //mentor is a bit hard to catch, maybe manually add
  // TODO: Get info on Groups -> Current Mentor, students, projects
  const proj = projid.find(c => c.id === parseInt(req.params.id));
  /*add check if ! a proj we have info on */
});

app.post("/evaluations/:login", (req, res) => {
  //what is this asking for? to create an eval slot from the site? or sign up to one?
  // TODO: Post a new evaluation to user by login
});

app.patch("/checkin/:login", (req, res) => {
  //search for a specific user in the H2S database, by login, pass login as param
  // TODO: Update the checkin status by login
});

app.listen(port, () => {
  console.log("Server running on port: " + port);
});

// Get all students -> "https://api.intra.42.fr/v2/cursus/17/cursus_users?filter%5Bactive%5D=true&filter%5Bcampus_id%5D=7&page%5Bsize%5D=100&per_page"
