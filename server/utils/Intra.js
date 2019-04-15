const request = require("request-promise");
var token = "";

const refreshToken = async () => {
  let tokenRequest = {
    url: "https://api.intra.42.fr/oauth/token",
    method: "POST",
    form: {
      client_id:
        !process.env.NODE_ENV ||
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test"
          ? process.env.CLIENT_ID
          : JSON.parse(process.env.CLIENT_ID),
      client_secret:
        !process.env.NODE_ENV ||
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test"
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

module.exports = intraRequest;
