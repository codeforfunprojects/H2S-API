require("dotenv").config();
const request = require("supertest");
const app = require("./server").app;
const closeServer = require("./server").closeServer;

describe("Server", () => {
  describe("GET /students", () => {
    it("should return the list of students", done => {
      request(app)
        .get("/students")
        .set("Authorization", process.env.API_KEY)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBeTruthy();
        })
        .end(done);
      closeServer();
    });
  });
});
