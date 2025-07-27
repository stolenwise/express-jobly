"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if companyHandle doesn't exist.
   **/
  static async create({ title, salary, equity, companyHandle }) {
    // Validate that companyHandle exists
    const companyCheck = await db.query(
      `SELECT handle FROM companies WHERE handle = $1`,
      [companyHandle]
    );
    if (companyCheck.rows.length === 0) {
      throw new BadRequestError(`Company not found: ${companyHandle}`);
    }

    const result = await db.query(
      `INSERT INTO jobs
       (title, salary, equity, company_handle)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];

    return {
      id: job.id,
      title: job.title,
      salary: Number(job.salary),
      equity: job.equity,
      companyHandle: job.companyHandle,
    };
  }

  /** Find all jobs with optional filters.
 *
 * filters: { title, minSalary, hasEquity }
 * 
 * Returns [{ id, title, salary, equity, companyHandle }, ...]
 **/
static async findAll(filters = {}) {
    let query = `
      SELECT id,
             title,
             salary,
             equity,
             company_handle AS "companyHandle"
      FROM jobs`;
    
    const whereExpressions = [];
    const queryValues = [];
  
    const { title, minSalary, hasEquity } = filters;
  
    // Filtering logic
    if (title) {
      queryValues.push(`%${title}%`);
      whereExpressions.push(`title ILIKE $${queryValues.length}`);
    }
  
    if (minSalary !== undefined) {
      queryValues.push(minSalary);
      whereExpressions.push(`salary >= $${queryValues.length}`);
    }
  
    if (hasEquity === true) {
      whereExpressions.push(`equity::float > 0`);
    }
  
    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }
  
    query += " ORDER BY id ASC";
  
    const jobsRes = await db.query(query, queryValues);
    return jobsRes.rows;
  }
  
  

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if job not found.
   **/
  static async get(id) {
    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
       FROM jobs
       WHERE id = $1`,
      [id]
    );

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return {
      id: job.id,
      title: job.title,
      salary: Number(job.salary),
      equity: job.equity,
      companyHandle: job.companyHandle,
    };
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Cannot change id or companyHandle.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if job not found.
   **/
  static async update(id, data) {
    if ("id" in data || "companyHandle" in data) {
      throw new BadRequestError("Not allowed to change id or companyHandle");
    }

    const { setCols, values } = sqlForPartialUpdate(data, {
      title: "title",
      salary: "salary",
      equity: "equity",
    });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols}
                      WHERE id = ${idVarIdx}
                      RETURNING id,
                                title,
                                salary,
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return {
      id: job.id,
      title: job.title,
      salary: Number(job.salary),
      equity: job.equity,
      companyHandle: job.companyHandle,
    };
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/
  static async remove(id) {
    const result = await db.query(
      `DELETE FROM jobs
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }
}

module.exports = Job;
