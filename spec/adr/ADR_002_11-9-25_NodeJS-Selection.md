# Architecture Decision Record (ADR)

**ADR #:** 002  
**Title:** Selection of Backend Framework and Runtime Environment  
**Date:** 2025-11-09  
**Status:** Proposed  

---

## 1. Context

Conductor is a web application designed to simplify the management of software engineering courses. The platform allows instructors to view and manage courses, students, and assignments through a web interface.
Our goal is to implement a backend that is reliable, easy to maintain, and widely supported, while ensuring long-term viability. Furthermore, we aim to stick as closely to vanilla technologies as possible to maintain ease of long-term support.

Key considerations:
  - The system needs to handle course data, student rosters, and activity tracking efficiently.
  - The team requires a technology stack that offers good documentation, maintainability, and minimal overhead.
  - The solution should support long-term maintainability for future contributors with minimal dependency complexity.

Furthermore, we wanted our system to use a unified language to simplify the implementation of a future Continuous Integration and Delivery pipeline, as well as to ease the burden of testing. We felt that in our current state, if we chose an architecture that required multiple languages and thus mutliple languages for compilation, linting, tests, and execution, we would not be able to complete the project in time.

---

## 2. Decision
We will implement the backend using *Node.js v24.11.0 LTS* with the *Express 5.1.0* framework, and *PostgreSQL 18.0* as our relational database.

This setup leverages our team’s collective experience with JavaScript, enabling efficient development while adhering closely to incumbent, well-supported libraries.
By using LTS releases, we prioritize stability, security updates, and long-term support, minimizing risks of deprecated dependencies.
We aim to keep Conductor close to vanilla Express to reduce framework coupling and ensure future developers can easily maintain or extend the project.

---

## 3. Alternatives Considered
As a team, we considered the following alternatives before agreeing on NodeJS with Express:
- **Option 1:** PHP: Hypertext Preprocessor
  - Pros: PHP is 30 years old. It is a time-tested language for the design and implementation of servers. 
  - Cons: Our team is not familiar with PHP, and we did not have the work-hours to onboard with PHP. If something went wrong, we would likely take a long time to resolve it.
- **Option 2:** NodeJS + Hono Framework
  - Pros: Hono is a very new NodeJS framework, which appears to greatly reduce boilerplate code. Furthermore, it is closer to vanilla NodeJS, since it does not override NodeJS's request/response.
  - Cons: Since Hono is so new, there are likely less resources for learning Hono. Furthermore, since it is so new, we do not have good information on stability or long term support.
- **Option 3:** Python with Flask Framework
  - Pros: Python as a productivity language makes rapid prototyping easy. Onboarding and development would likely be very rapid.
  - Cons: Merging Python and Javascript on the frontend would likely be a challenge. Furthrore, since Python is a heavy language, it may present difficulties meeting RAIL.

The Backend team decided on Express primarily because of the incumbency advantage—most members already have experience with it—reducing onboarding and development time.

---

## 4. Consequences
Positive outcomes:  
  - Simplified onboarding for developers familiar with Node.js/Express.
  - Express, being 15 years old, is nearly as old as NodeJS and will likely remain supported in the future.
  - PostgreSQL provides a powerful relational foundation for structured course and user data.  

Negative outcomes:  
  - Manual setup for routing, validation, and error handling increases initial boilerplate.
  - NodeJS and PostgreSQL LTS versions are only supported at most for 5 years-so a code base update will be necessary soon.
  - A Relational database limits the ease with which we can change data types in the future. (However, it is likely still appropriate due to the nature of our structured data.)  

However, our choice of NodeJS + Express irrecovably locks us into this framework. Since Express overrides some of NodeJS's vanilla response headers, it is highly unlikely that the project may be easily shifted from NodeJS + Express in the future. Additionally, we must count on NodeJS and Express not making major changes to their platform in following releases, since our codebase will have to be modified if our stack's behaviour changes.

This also holds for other aspects of our system, such as our choice of node-postgres as the adapter of choice for talking to our PostgreSQL server. If any changes are made in these sources, a major refactor will likely be required.

---

## 5. Implementation Notes
Additional Implementation Notes:
  - Backend will be structured following the Ports and Adapters (Hexagonal Architecture) pattern to isolate domain logic from web and persistence layers. (A future ADR will be created with more detail!)
  - Database schema defined in Conductor PostgreSQL schema with separate tables for users, groups, courses, and activities.
  - Express middleware stack will handle authentication, validation, and error handling.
  - Environment managed via .env files and dotenv.

---

## 6. References
Further Info:
- [Backend Design Miro Board](https://miro.com/app/board/uXjVJzfnF8M=/?share_link_id=880836813530)
- [Node.js 24.11.0 LTS Schedule](https://github.com/nodejs/release)  
- [Express 5.1.0 Tentative LTS Strategy](https://expressjs.com/2025/03/31/v5-1-latest-release.html)
- [PostgreSQL Versioning Policy](https://www.postgresql.org/support/versioning/)
- [node-postgres PostgresSQL library](https://node-postgres.com)
