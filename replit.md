# Overview

Gunbattle.io is a multiplayer battle royale web game featuring real-time combat, user authentication, and an in-game economy. The project implements a full-stack architecture with a Node.js backend serving a browser-based game client, complete with user accounts, virtual currency, and a rotating shop system for cosmetic items and weapons.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with vanilla JavaScript and HTML5 Canvas for game rendering. The architecture follows a modular class-based approach with separate managers for different game systems:

- **MenuManager**: Handles screen navigation and UI state management
- **AuthManager**: Manages user login, registration, and authentication flows
- **ShopManager**: Controls the in-game store interface and item purchasing
- **Game Engine**: Canvas-based rendering system for real-time gameplay

The frontend uses a screen-based navigation system where different game states (menu, login, shop, game) are managed as separate screens with show/hide functionality.

## Backend Architecture
The server uses Express.js as the web framework with a RESTful API design pattern. Key architectural decisions include:

- **SQLite Database**: Chosen for simplicity and portability, using better-sqlite3 for synchronous operations
- **JWT Authentication**: Stateless authentication using JSON Web Tokens for scalability
- **Static File Serving**: Express serves the frontend assets directly, eliminating the need for separate hosting

The backend implements a single-server architecture where the Express app handles both API endpoints and static file delivery.

## Data Storage Solutions
The application uses SQLite as the primary database with a simple relational schema:

- **users**: Stores player accounts, virtual currency (coins), owned items, and equipped cosmetics
- **shop_items**: Contains purchasable items with rarity systems and pricing
- **shop_rotations**: Manages time-limited shop rotations for dynamic content

This approach provides ACID compliance and easy deployment while maintaining good performance for the expected user scale.

## Authentication and Authorization
The system implements JWT-based authentication with bcrypt password hashing:

- **Registration**: Passwords are hashed using bcryptjs before database storage
- **Login**: Credentials are verified against hashed passwords, with JWT tokens issued on success
- **Session Management**: Client-side token storage with automatic authentication checking
- **API Protection**: Protected endpoints verify JWT tokens before processing requests

This stateless approach enables horizontal scaling while maintaining security best practices.

# External Dependencies

## Core Runtime Dependencies
- **Express.js (^5.1.0)**: Web application framework for the backend server
- **better-sqlite3 (^12.2.0)**: High-performance SQLite3 database driver with synchronous API
- **bcryptjs (^3.0.2)**: Password hashing library for secure user authentication
- **jsonwebtoken (^9.0.2)**: JWT token generation and verification for stateless auth
- **uuid (^13.0.0)**: Unique identifier generation for database records

## Supporting Libraries
- **cors (^2.8.5)**: Cross-origin resource sharing middleware for API access
- **body-parser (^2.2.0)**: HTTP request body parsing middleware
- **sqlite3 (^5.1.7)**: Alternative SQLite driver (backup dependency)

## Development Tools
The project uses standard Node.js tooling with npm scripts for development and production deployment. No external build tools or bundlers are required due to the vanilla JavaScript frontend approach.

## External Services
Currently, the application is designed to be self-contained without external API dependencies. Future integrations may include:
- WebSocket servers for real-time multiplayer functionality
- CDN services for static asset delivery
- Analytics platforms for user behavior tracking