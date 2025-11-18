# Conductor — Sprint 2 Review 11/14/2025

Date: 14 November 2025  
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

This sprint focused on connecting the seperate elements we built for Conductor in sprint 1. Specifically, we were interested in implementing API calls from the backend to support the frontend HTML pages we had designed. Furthermore, we were interested in completing a CI/CD pipeline with linting, style checks, and tests for merging to main and our EC2 instance.

## Frontend Progress

Key Updates:	
- Lisa, Zheng, and Chenhao completed the following:
	- Dashboard, login page, and course page layouts.
	- Attendance pages integrated from Nikita’s attendance feature.
	- Drafted backend API calls with backend team.

Next Steps
- Finalize API specifications with backend.
- Begin Selenium click-through tests for UI interaction covering in CI/CD pipeline.
- Add profile page with calendar and customization for editing a user's details.

## Backend Progress

Key Updates:
- Brandon, Nikita, Saniya, Tian, and Mason completed the following:
	- Designed login API endpoints for Google OAUTH.
	- Completed Hexagonal Architecture, along with core Data-Transfer-Objects.
	- Implemented a testing pipeline with simple tests.
	- Designed SQL queries for each of the API calls avaliable to the frontend.
	- Nikita completed the attendance feature, with pin, QR code, and manual instructor control for attendance keeping.

Next Steps:
- Modfiy server to start serving frontend pages.
- Continue collaborating with frontend on desired API calls.

## Infrastructure Progress

Key Updates:
- Jai, Dennis, and Jiesen completed the following:
	- Design CI/CD pipeline, with linting, style checks, and the ability to add tests.
	- Launched and configured EC2 instance.
	- Improved container conflicts.

Next Steps:
- Configure CI/CD pipeline to automatically push changes to EC2 whenever successful merges to main are performed.
- Finalize schema application to Postgres database in docker.
- Collborate with other teams on implementing unit tests in CI/CD pipeline.

## Key Deliverables

- Completed HTML pages for the Instructor and Student users.
- Diagram, and Markdown documentation for CI/CD pipeline.
- Reogranized main directory structure for Ports & Adapters, and Javascript functions for API calls.