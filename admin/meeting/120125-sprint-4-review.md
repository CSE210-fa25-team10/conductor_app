# Conductor — Sprint 3 Review 11/20/2025

Date: 01 December 2025  
Meeting Type: Sprint Review
Project: Conductor – Course Management Web Application

## Attendees

- Lisa Wang – Team Lead / Frontend Team
- Brandon Lai – Team Lead / Backend Team
- Zheng Yuan – Frontend Lead
- Mason Li – Project Manager / Backend Lead
- Jai Malegaonkar - Infrastructure Lead
- Jiesen Zhang – Infrastructure Team
- Dennis Chan - Infrastructure Team
- Chenhao Yan - Frontend Team
- Tian Zhang – Backend Team
- Saniya Patil – Backend Team
- Nikita Johny Kachappilly – Backend Team

## Overview

This sprint focused on finalizing Conductor's integration by covering frontend testing, contract based development to merge remaining frontend and backend api calls, and the CI/CD pipeline. Frontend tests were completed and merged into the pipeline. The Postman API system was utilized for a shared contract style of development between the frontend and backend. Furthermore, the team discussed remaining backend functionality, noting that course creation, join, and work journal APIs were still not completed and unsupported. Furthermore, the team discussed EC2 deployment to create a live demo, as well as setting up a pipeline to push directly from the repository to EC2. Finally, ADRs were brought up in order to be backfilled.

## Frontend Progress

Key Updates:	
- Lisa, Zheng, and Chenhao completed the following:
	- Most frontend pages are completed.
	- Unit tests for login and registration pages are finished.
	- A Postman API document has already been created by frontend to coordinate with backend.

Next Steps
- Remaining API integration depends on backend wiring.
- Waiting for final backend endpoints to finish remaining UI connections.

## Backend Progress

Key Updates:
- Brandon, Nikita, Saniya, Tian, and Mason completed the following:
	- Login and account creation functionality is functioning as intended.
	- Currently Wiring API calls with frontend for a live demo
	- API routes for database queries are active, and completed.
	- NodeJS API server is also handling frontend hosting for simplicity.

Next Steps:
- Complete the Course enrollment API, and work journal tool APIs.
- Role-based logic exists, but no separate TA/Team Lead pages are currently implemented.
  - Additional permissions will be handled using extra buttons/modules based on role.

## Infrastructure Progress

Key Updates:
- Jai, Dennis, and Jiesen completed the following:
	- Backend unit test skeleton created for easy filling by teams.
	- Infrastructure tests are prepared and awaiting merge.
	- Coordinated frontend testing.

Next Steps:
- Finalize and launch Conductor on Amazon EC2.
- Create a simple pipeline for pushing Git updates to merge automatically to EC2 once tests pass.

## Key Deliverables

- Live EC2 Demo.
- JSDocs documentation for Javascript functions.
- Completed tests for each team.
