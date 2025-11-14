# Projekt: Manager Terminów Pracowniczych (MTP)

## 1. Project Goal

The objective is to create a **BACKEND ONLY** REST server application. The server will manage leave/vacation requests within a company.

## 2. Core Technology & Constraints

- **Technology:** TypeScript (Node.js)
- **Scope:** Backend REST API only.
- **Environment:** Local server.
- **Testing:** Endpoints must be testable using Postman.

## 3. System Topic & Users

The system is designed to handle employee vacation requests.

It has two defined user roles:

1.  **User (Employee)**

    - Must be able to register and log in (with validation).
    - Submits leave requests (which must be validated).
    - A request must contain: personal data, the term (dates) of the leave, and a reason.

2.  **Administrator (Boss)**
    - Decides whether to accept or reject the user's request.

## 4. Implementation Requirements

The implementation must cover the following points:

- **Base Server:** A base server implementation with basic security and configuration.
- **Database:**
  - A database schema design is required (as a diagram for documentation).
- **Endpoints:** The API must include endpoints for:
  - Adding data to the database (must include data validation and exception handling).
  - Updating data in the database.
  - Fetching data from the database.
  - Deleting data from the database.
- **External API:** One endpoint that connects to and utilizes an external API.
- **Design Pattern:** Correct implementation of a chosen design pattern, along with a justification for its use.
- **Unit Tests:** Implementation of unit tests.
- **Code Quality:** Code must adhere to best programming practices and maintain high aesthetic quality.

## 5. Required Documentation (To be delivered as a PDF)

- A description of the application.
- A complete list of **User Stories** describing all functionalities.
- Identification of the (at least) two system users (audiences).
- A discussion of the potential benefits the solution provides to its users.
- A database schema diagram.
