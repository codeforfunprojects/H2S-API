const request = require("request-promise");
const Bottleneck = require("bottleneck/es5");
const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 500
});
var token = "";

const refreshToken = async () => {
  let tokenRequest = {
    url: "https://api.intra.42.fr/oauth/token",
    method: "POST",
    form: {
      client_id:
        !process.env.NODE_ENV || process.env.NODE_ENV === "development"
          ? process.env.CLIENT_ID
          : JSON.parse(process.env.CLIENT_ID),
      client_secret:
        !process.env.NODE_ENV || process.env.NODE_ENV === "development"
          ? process.env.CLIENT_SECRET
          : JSON.parse(process.env.CLIENT_SECRET),
      grant_type: "client_credentials"
    }
  };
  let response = await request(tokenRequest, (err, res) => {
    if (res) {
      let json = JSON.parse(res.body);
      return json.access_token;
    } else {
      console.log("res undefined");
      console.log(err);
    }
  });
  return JSON.parse(response);
};

const intraRequest = async (intraURL, callback) => {
  if (token === "" || token.created_at + token.expires_in < Date.now() / 1000) {
    token = await refreshToken();
  }

  let response = await request(
    {
      url: intraURL,
      auth: {
        bearer: token.access_token
      }
    },
    callback
  );
  response = JSON.parse(response);
  return response;
};

const intraLimited = limiter.wrap(intraRequest);
// One time setup to sync our DB with intra login/image_url data
const syncIntraFirebase = async () => {
  let i = 1;

  while (i < 14) {
    let studentsH2S = await intraRequest(
      `https://api.intra.42.fr/v2/cursus/17/cursus_users?filter%5Bactive%5D=true&filter%5Bcampus_id%5D=7&page=${i}`,
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

    studentsH2S.forEach(async (item, index) => {
      try {
        const { login } = item.user;
        let details = await intraLimited(
          `https://api.intra.42.fr/v2/users/${login}`,
          (err, res) => {
            if (err) {
              console.error(err);
            } else if (res.statusCode === 429) {
              console.log("Rate limit excedded");
            }
          }
        );

        let { displayname, image_url } = details;
        let student = { login, displayname, image_url };
        console.log(index, student);
        studentsRef.push(student);
      } catch (error) {
        console.error(error);
      }
    });
    i++;
  }
};
// syncIntraFirebase();

module.exports = intraRequest;
