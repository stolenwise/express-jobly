"use strict";

const db = require("../db.js");
const Job = require("./job.js");
const { BadRequestError, NotFoundError } = require("../expressError");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "New Job",
    salary: 100000,
    equity: "0.05",
    companyHandle: "c1",
  };

  test("works", async function () {
    const job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "New Job",
      salary: 100000,
      equity: "0.05",
      companyHandle: "c1",
    });

    const result = await db.query(`SELECT title, salary, equity, company_handle FROM jobs WHERE id = $1`, [job.id]);
    expect(result.rows).toEqual([{
      title: "New Job",
      salary: 100000,
      equity: "0.05",
      company_handle: "c1"
    }]);
  });

  test("fails with invalid companyHandle", async function () {
    try {
      await Job.create({
        ...newJob,
        companyHandle: "no-such-company",
      });
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    const jobs = await Job.findAll();
    expect(jobs).toEqual([
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
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const job = await Job.get(testJobIds[0]);
    expect(job).toEqual({
      id: testJobIds[0],
      title: "Job1",
      salary: 50000,
      equity: "0.01",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(999999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "Updated Job",
    salary: 80000,
    equity: "0.1",
  };

  test("works", async function () {
    const job = await Job.update(testJobIds[0], updateData);
    expect(job).toEqual({
      id: testJobIds[0],
      title: "Updated Job",
      salary: 80000,
      equity: "0.1",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(999999, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request if attempt to change companyHandle", async function () {
    try {
      await Job.update(testJobIds[0], { companyHandle: "c2" });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("bad request if attempt to change id", async function () {
    try {
      await Job.update(testJobIds[0], { id: 1234 });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(testJobIds[0]);
    const res = await db.query(`SELECT id FROM jobs WHERE id=$1`, [testJobIds[0]]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(999999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
