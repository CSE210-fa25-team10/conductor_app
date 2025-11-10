# Conductor — Sprint Review 11/07/2025

Date: 07 November 2025  
Meeting Type: Sprint Review (via Zoom)  
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

This sprint focused on setting up the foundation for the Conductor application, including backend architecture, database schema design, front-end login flow, and Docker integration. The team also discussed initial feature implementations (attendance and stand-up tool) and the plan for a live demo next week.

## Frontend Progress

Key Updates:	
- Registration and login page designs completed.
	- Clarified role-based access: professors and admins are created by administrators; students self-register using join codes.
	- Team agreed on one unified login page — backend determines user role and permissions.
- Class pages to be templated; frontend queries backend for course attributes and populates dynamically.

Next Steps:
- Create a flowchart for login logic (Collaborating with Backend team).
- Add user role attribute handling in UI.
- Finalize basic site wireframe for demo.

## Backend Progress

Key Updates:
- Brandon implemented account creation via Google OAUTH.
- Saniya finalized ER diagram and database schema creation, proposed moving course_id attribute to activities table to resolve duplication issue.
- Nikita implemented a attendance tracking system involving 6-digit code registration, and ability to manually edit attendance.
- Mason presented a Ports & Adapters (Hexagonal) architecture for backend modularity.
	- Queries from frontend are parsed and sent to PostgreSQL through an abstraction layer.
	- Results returned as JSON objects (count + data array).
	- Allows database changes without breaking frontend calls.

Next Steps:
- Integrate implemented logic with wireframe HTML pages from Frontend team
- Rearrange repository to support a more organized router flow, and abstraction layers
- Collaborate with infrastructure team to integrate NodeJS, Express, and PostgresSQL into a Docker container

## Infrastructure Progress

Key Updates:
- Docker & PostgreSQL Integration:
	- Jiesen coordinating setup with Tian, Saniya, and Mason to integrate NodeJS and SQL for Docker environment.
	- Internal meeting scheduled over the weekend for environment configuration and testing.

Next Steps:
- Configure and launch EC2 instance, unifying all deliverables into a running instance.
- Collaborate with other teams to determine necessary configurations and load levels for EC2.

## Feature Discussion & Clarification

Furthermore, our team tentatively discussed the following features:
- Stand Up Tool (In our next upcoming sprint)
	- Allowed integrations (Git, Links, etc)
	- Stored data types (text, date)
	- Sentiment tracking (Configurable 1-5 scale for questions on sprint performance)

## Key Deliverables

- Unite all seperate components into a functional, running prototype by Thursday (November 13).