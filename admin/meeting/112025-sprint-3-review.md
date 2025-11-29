# Conductor — Sprint 3 Review 11/20/2025

Date: 20 November 2025  
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

This sprint focused on finishing the remaining core elements needed for Conductor's core features, as well as refactoring the codebase and improving documentation. Key highlights were the completion of several frontend elements required for Conductor's core features, such as course registration pages. Furthermore, we solidified the CI/CD pipeline with ESLint checks for formatting and best practices.

## Frontend Progress

Key Updates:	
- Lisa, Zheng, and Chenhao completed the following:
	- User Profile page with Calendar integration for courses and events.
	- Began writing Selenium tests for click-through testing.
	- Pages for assignment creation, uploading, and submission.

Next Steps
- Finalize Selenium UI tests and integrate with CI/CD pipeline.
- Unify visual styles of pages, as well as usage of CSS/JS files.
- Populate Google Calendar integration with Backend.

## Backend Progress

Key Updates:
- Brandon, Nikita, Saniya, Tian, and Mason completed the following:
	- Refactored Backend code to organize functions and controllers into using a container object to inject dependencies.
	- Implemented a cookie-based system for tracking user sessions.
	- Connected login logic to designed HTML pages.

Next Steps:
- Complete API connections to frontend.
- Finalize server routes for serving all frontend pages.
- Finish Stand Up Tool implementation, as well as Course creation and registration systems.

## Infrastructure Progress

Key Updates:
- Jai, Dennis, and Jiesen completed the following:
	- Implemented integration testing within the CI/CD pipeline, along with unit test templates for teams.
	- Improved ESLint style and practice detection.
	- Created docker container for serving frontend.

Next Steps:
- Collaborate with Frontend and Backend teams to implement tests into pipeline.
- Integrate frontend docker container with backend container.

## Key Deliverables

- Completed HTML pages for the course registration and user profiles.
- Server providing login HTML pages with simple login flow.
- Integration testing with unit test templates in CI/CD pipeline.
