"use strict";

const bcrypt = require("bcrypt");
const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");
const Company = require("../models/company");

let testJobIds = [];

async function commonBeforeAll() {
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM jobs");
  
  // Insert companies
  await Company.create({ handle: "c1", name: "C1", numEmployees: 1, description: "Desc1", logoUrl: "http://c1.img" });
  await Company.create({ handle: "c2", name: "C2", numEmployees: 2, description: "Desc2", logoUrl: "http://c2.img" });
  await Company.create({ handle: "c3", name: "C3", numEmployees: 3, description: "Desc3", logoUrl: "http://c3.img" });

  // Insert users
  await db.query(
    `INSERT INTO users(username, password, first_name, last_name, email)
     VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
            ('u2', $2, 'U2F', 'U2L', 'u2@email.com')`,
    [
      await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
    ]
  );

  // Insert jobs
  const result = await db.query(
    `INSERT INTO jobs (title, salary, equity, company_handle)
     VALUES ('Job1', 50000, 0.01, 'c1'),
            ('Job2', 60000, 0, 'c1'),
            ('Job3', 70000, 0.02, 'c2')
     RETURNING id`
  );

  testJobIds.length = 0;
  result.rows.forEach(r => testJobIds.push(r.id));
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
};
