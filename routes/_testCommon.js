"use strict";

const bcrypt = require("bcrypt");
const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { createToken } = require("../helpers/tokens");

let testJobIds = [];

async function commonBeforeAll() {
  // Clear tables
  await db.query("DELETE FROM applications");
  await db.query("DELETE FROM jobs");
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM users");

  // Insert companies
  await db.query(`
    INSERT INTO companies (handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img')`);

  // Insert users: one regular user, one admin
  await db.query(`
    INSERT INTO users (username, password, first_name, last_name, email, is_admin)
    VALUES ('u1', $1, 'U1F', 'U1L', 'user1@user.com', FALSE),
           ('u2', $2, 'U2F', 'U2L', 'user2@user.com', FALSE),
           ('admin', $3, 'AdminF', 'AdminL', 'admin@admin.com', TRUE)`,
[
  await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
  await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
  await bcrypt.hash("adminpass", BCRYPT_WORK_FACTOR)
]);


  // Insert jobs and capture IDs
  const resultJobs = await db.query(
    `INSERT INTO jobs (title, salary, equity, company_handle)
     VALUES 
     ('Job1', 50000, 0.01, 'c1'),
     ('Job2', 60000, 0, 'c1'),
     ('Job3', 70000, 0.02, 'c2')
     RETURNING id`
  );

  testJobIds.splice(0, testJobIds.length, ...resultJobs.rows.map(r => r.id));
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

// Tokens
const u1Token = createToken({ username: "u1", isAdmin: false });
const adminToken = createToken({ username: "admin", isAdmin: true });

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
  u1Token,
  adminToken
};
