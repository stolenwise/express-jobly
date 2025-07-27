"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");


const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  adminToken,
  testJobIds, 
} = require("./_testCommon");



beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /users", function () {
  const newUser = {
    username: "u-new",
    firstName: "First-new",
    lastName: "Last-newL",
    password: "password-new",
    email: "new@email.com",
    isAdmin: false,
  };

  test("works for admins: create non-admin", async function () {
    const resp = await request(app)
      .post("/users")
      .send(newUser)
      .set("authorization", `Bearer ${adminToken}`); // adminToken required
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: false,
      },
      token: expect.any(String),
    });
  });

  test("works for admins: create admin user", async function () {
    const resp = await request(app)
      .post("/users")
      .send({ ...newUser, username: "u-admin", isAdmin: true })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-admin",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      },
      token: expect.any(String),
    });
  });

  test("unauthorized for non-admin users", async function () {
    const resp = await request(app)
      .post("/users")
      .send(newUser)
      .set("authorization", `Bearer ${u1Token}`); // non-admin token
    expect(resp.statusCode).toEqual(401);
  });

  test("unauthorized for anonymous", async function () {
    const resp = await request(app).post("/users").send(newUser);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
      .post("/users")
      .send({ username: "u-new" })
      .set("authorization", `Bearer ${adminToken}`); // only admin allowed
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid email", async function () {
    const resp = await request(app)
      .post("/users")
      .send({ ...newUser, email: "not-an-email" })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** POST /users/:username/jobs/:id */

describe("POST /users/:username/jobs/:id", function () {
  test("works for same user", async function () {
    const resp = await request(app)
      .post(`/users/u1/jobs/${testJobIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ applied: testJobIds[0] });
  });

  test("works for admin", async function () {
    const resp = await request(app)
      .post(`/users/u1/jobs/${testJobIds[0]}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ applied: testJobIds[0] });
  });

  test("unauthorized for other user", async function () {
    const resp = await request(app)
      .post(`/users/u1/jobs/${testJobIds[0]}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such user", async function () {
    const resp = await request(app)
      .post(`/users/nope/jobs/${testJobIds[0]}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .post(`/users/u1/jobs/999999`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if already applied", async function () {
    await User.applyToJob("u1", testJobIds[0]);
    const resp = await request(app)
      .post(`/users/u1/jobs/${testJobIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});


/************************************** GET /users */


describe("GET /users", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${adminToken}`);
      expect(resp.body).toEqual({
        users: [
          {
            username: "admin",
            firstName: "AdminF",
            lastName: "AdminL",
            email: "admin@admin.com",
            isAdmin: true,
          },
          {
            username: "u1",
            firstName: "U1F",
            lastName: "U1L",
            email: "user1@user.com",
            isAdmin: false,
          },
          {
            username: "u2",
            firstName: "U2F",
            lastName: "U2L",
            email: "user2@user.com",
            isAdmin: false,
          },
        ],
      });      
  });

  test("unauthorized for non-admin", async function () {
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async function () {
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("works for correct user", async function () {
    const resp = await request(app)
      .get(`/users/u1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
        jobs: []
      },
    });
  });

  test("works for admin", async function () {
    const resp = await request(app)
      .get(`/users/u1`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
        jobs: []
      },
    });
  });

  test("unauthorized for wrong non-admin user", async function () {
    const resp = await request(app)
      .get(`/users/u1`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found", async function () {
    const resp = await request(app)
      .get(`/users/nope`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works for same user", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: "New",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: "AdminEdit",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "AdminEdit",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("unauthorized for wrong non-admin user", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: "Hacker",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: "New",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such user", async function () {
    const resp = await request(app)
      .patch(`/users/nope`)
      .send({
        firstName: "Nope",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: 42,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("works: set new password for same user", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        password: "new-password",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });
});

/************************************** DELETE /users/:username */


describe("DELETE /users/:username", function () {
  test("works for same user", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("works for admin", async function () {
    const resp = await request(app)
      .delete(`/users/u2`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "u2" });
  });

  test("unauthorized for wrong non-admin user", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing", async function () {
    const resp = await request(app)
      .delete(`/users/nope`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});