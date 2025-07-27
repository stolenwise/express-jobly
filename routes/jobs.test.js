"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app.js");
const Job = require("../models/job.js");
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll, u1Token, adminToken, testJobIds } = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "New Job",
    salary: 120000,
    equity: "0.05",
    companyHandle: "c1",
  };

  test("works for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "New Job",
        salary: 120000,
        equity: "0.05",
        companyHandle: "c1",
      },
    });
  });

  test("unauthorized for non-admin user", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anonymous", async function () {
    const resp = await request(app).post("/jobs").send(newJob);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({ title: "Incomplete Job" })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({ ...newJob, salary: "not-a-number" })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("works for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: testJobIds[0],
          title: "Job1",
          salary: 50000,
          equity: "0.01",
          companyHandle: "c1",
        },
        {
          id: testJobIds[1],
          title: "Job2",
          salary: 60000,
          equity: "0",
          companyHandle: "c1",
        },
        {
          id: testJobIds[2],
          title: "Job3",
          salary: 70000,
          equity: "0.02",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("works with filter: title", async function () {
    const resp = await request(app).get("/jobs?title=Job1");
    expect(resp.body.jobs).toEqual([
      {
        id: testJobIds[0],
        title: "Job1",
        salary: 50000,
        equity: "0.01",
        companyHandle: "c1",
      },
    ]);
  });

  test("works with filter: minSalary", async function () {
    const resp = await request(app).get("/jobs?minSalary=60000");
    expect(resp.body.jobs).toEqual([
      {
        id: testJobIds[1],
        title: "Job2",
        salary: 60000,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: testJobIds[2],
        title: "Job3",
        salary: 70000,
        equity: "0.02",
        companyHandle: "c2",
      },
    ]);
  });

  test("works with filter: hasEquity=true", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.body.jobs).toEqual([
      {
        id: testJobIds[0],
        title: "Job1",
        salary: 50000,
        equity: "0.01",
        companyHandle: "c1",
      },
      {
        id: testJobIds[2],
        title: "Job3",
        salary: 70000,
        equity: "0.02",
        companyHandle: "c2",
      },
    ]);
  });

  test("fails: test next() handler", async function () {
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app).get("/jobs");
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
    expect(resp.body).toEqual({
      job: {
        id: testJobIds[0],
        title: "Job1",
        salary: 50000,
        equity: "0.01",
        companyHandle: "c1",
      },
    });
  });

  test("not found if job not found", async function () {
    const resp = await request(app).get(`/jobs/999999`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJobIds[0]}`)
      .send({ title: "Updated Job" })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: testJobIds[0],
        title: "Updated Job",
        salary: 50000,
        equity: "0.01",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJobIds[0]}`)
      .send({ title: "Updated Job" });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauthorized for non-admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJobIds[0]}`)
      .send({ title: "Updated Job" })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if job not found", async function () {
    const resp = await request(app)
      .patch(`/jobs/999999`)
      .send({ title: "No Job" })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${testJobIds[0]}`)
      .send({ salary: "not-a-number" })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/${testJobIds[0]}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: testJobIds[0] });
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/${testJobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauthorized for non-admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/${testJobIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if job not found", async function () {
    const resp = await request(app)
      .delete(`/jobs/999999`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
