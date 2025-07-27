# Jobly Backend

This is the Express backend for Jobly, version 2.

To run this:

    node server.js
    
To run the tests:

    jest -i


### Features
User Management

- Register users (admin only)

- Update or delete user accounts

- View user details, including applied jobs

Authentication & Authorization

- JWT-based authentication

- Role-based permissions (admin vs. regular user)

Companies

- View all companies with optional filters

- Get detailed company info including jobs

- Admin-only: create, update, delete companies

Jobs

- View all jobs with optional filters (title, minSalary, hasEquity)

- Admin-only: create, update, delete jobs

Applications

- Users (or admins) can apply for jobs

- Users see applied jobs on their profile

### Tech Stack
Node.js with Express.js

PostgreSQL using pg library

bcrypt for password hashing

jsonwebtoken (JWT) for authentication

Jest + Supertest for testing

### Database Schema
users: stores user info and authentication details

companies: company details

jobs: job postings linked to companies

applications: join table linking users to jobs

### API Endpoints
Auth
POST /auth/token

Description: Login and get a JWT token.

Body:
{ "username": "u1", "password": "password" }
POST /auth/register

Description: Register a new user.

### Users
POST /users – Create a user (admin only)

GET /users – List all users (admin only)

GET /users/:username – Get user details (includes applied job IDs)

PATCH /users/:username – Update user (self or admin)

DELETE /users/:username – Delete user (self or admin)

POST /users/:username/jobs/:id – Apply for a job

Example Response for GET /users/:username:


{
  "user": {
    "username": "u1",
    "firstName": "U1F",
    "lastName": "U1L",
    "email": "u1@email.com",
    "isAdmin": false,
    "jobs": [ 101, 102 ]
  }
}

### Companies
POST /companies – Add company (admin only)

GET /companies – List companies (filters: nameLike, minEmployees, maxEmployees)

GET /companies/:handle – Get company info + jobs

PATCH /companies/:handle – Update company (admin only)

DELETE /companies/:handle – Delete company (admin only)

### Jobs
POST /jobs – Add job (admin only)

GET /jobs – List jobs (filters: title, minSalary, hasEquity)

GET /jobs/:id – Get job details

PATCH /jobs/:id – Update job (admin only)

DELETE /jobs/:id – Delete job (admin only)

### Filtering
Companies:

nameLike: case-insensitive match

minEmployees / maxEmployees: numeric range

Jobs:

title: case-insensitive match

minSalary: numeric filter

hasEquity=true: only jobs with equity > 0

### Run the App
Start the server:

node server.js

Start in development mode:

nodemon server.js


### Run Tests
We use Jest with Supertest:

npm test
Run a specific test file:


npm test routes/users.test.js -- -i


### Environment Variables
Create a .env file in the root:


DATABASE_URL=postgresql:///jobly
DATABASE_TEST_URL=postgresql:///jobly_test
SECRET_KEY=your-secret-key
BCRYPT_WORK_FACTOR=12


