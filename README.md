 # Project Title: URL Shortener

This project is a URL shortener service built with Node.js, Express, and MongoDB. It allows users to shorten long URLs for easier sharing and management. The application also includes user authentication and session management.

## Features

- User Authentication: Users can sign up, log in, and log out. Passwords are hashed using bcrypt for security.
- URL Shortening: Users can create short URLs from long URLs. They can also provide a custom alias for the short URL.
- URL Management: Users can view, edit, and delete their short URLs. Each short URL is associated with the user who created it.
- Click Tracking: The application tracks the number of clicks each short URL receives.
- Error Handling: The application handles errors gracefully and provides meaningful error messages.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js
- MongoDB

### Installation

1. Clone the repository to your local machine.
2. Run `npm install` to install all the dependencies.
3. Create a `.env` file in the root directory and set the following environment variables:
    - `MONGO_URL`: Your MongoDB connection string.
    - `SECRET_KEY`: A secret key for session management.
    - `PORT`: The port on which the server will run. If not provided, the server will run on port 5000.
4. Run `node server.js` to start the server.

## Usage

Visit `http://localhost:5000` (or your configured port) in your browser. You can now sign up for an account and start creating short URLs.

