# Task Management Application

A full-stack task management application with Express.js backend, Prisma ORM, JWT authentication, and React + Tailwind CSS frontend. This application supports user authentication, task list management, task operations, and collaborative sharing with granular permissions.

## Features

✅ **User Authentication**

- User registration and login with JWT tokens
- Secure password hashing with bcrypt
- Protected routes with authentication middleware

✅ **Task Lists**

- Create, read, update, and delete task lists
- Users can view their owned and shared task lists
- Owner-only operations for sensitive actions

✅ **Tasks**

- Full CRUD operations on tasks
- Task properties: title, description, status (pending/in_progress/completed)
- Permission-based access control

✅ **Sharing & Collaboration**

- Share task lists with other users by email
- Two permission levels: **view** (read-only) and **edit** (full access to tasks)
- Owner can manage shares and update permissions
- Users must be registered to receive shares

## Tech Stack

### Backend

- **Node.js** & **Express.js** - Backend framework
- **Prisma** - Modern ORM for database operations
- **SQLite/PostgreSQL** - Database (configurable)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Request validation

### Frontend

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Context** - State management

## Project Structure

```
express-test/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── context/           # Auth context
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service
│   │   └── App.jsx
│   └── package.json
├── prisma/
│   └── schema.prisma          # Database schema
├── src/                       # Express backend
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   └── server.js
├── package.json
└── README.md
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup Steps

1. **Clone the repository** (or navigate to project folder)

```bash
cd /home/muhammadmaaz/Projects/nodejs/express-test
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
# For SQLite (Development)
DATABASE_URL="file:./dev.db"

# For PostgreSQL (Production)
# DATABASE_URL="postgresql://username:password@localhost:5432/taskmanagement?schema=public"

JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
```

4. **Initialize database**

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. **Start the server**

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be running at `http://localhost:3000`

## API Documentation

### Authentication

#### Register a new user

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2026-02-01T..."
  },
  "token": "jwt-token"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2026-02-01T..."
  },
  "token": "jwt-token"
}
```

### Task Lists

**Note:** All task list endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

#### Get all task lists

```http
GET /api/tasklists
```

**Response:**

```json
{
  "owned": [...],
  "shared": [...],
  "all": [...]
}
```

#### Get a specific task list

```http
GET /api/tasklists/:id
```

#### Create a task list

```http
POST /api/tasklists
Content-Type: application/json

{
  "title": "My Project Tasks"
}
```

#### Update a task list (owner only)

```http
PUT /api/tasklists/:id
Content-Type: application/json

{
  "title": "Updated Title"
}
```

#### Delete a task list (owner only)

```http
DELETE /api/tasklists/:id
```

### Tasks

#### Get all tasks in a task list

```http
GET /api/tasks/:taskListId
```

#### Create a task (requires edit permission)

```http
POST /api/tasks/:taskListId
Content-Type: application/json

{
  "title": "Complete documentation",
  "description": "Write comprehensive API docs",
  "status": "pending"
}
```

**Note:**

- `description` is optional
- `status` can be: `pending`, `in_progress`, or `completed` (defaults to `pending`)

#### Update a task (requires edit permission)

```http
PUT /api/tasks/:taskListId/:taskId
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_progress"
}
```

#### Update task status only (requires edit permission)

```http
PATCH /api/tasks/:taskListId/:taskId/status
Content-Type: application/json

{
  "status": "completed"
}
```

#### Delete a task (requires edit permission)

```http
DELETE /api/tasks/:taskListId/:taskId
```

### Sharing

#### Share a task list (owner only)

```http
POST /api/shares/:taskListId
Content-Type: application/json

{
  "email": "colleague@example.com",
  "permission": "edit"
}
```

**Permissions:**

- `view` - Can only view the task list and tasks
- `edit` - Can view, add, edit, and delete tasks (but cannot delete the task list or manage sharing)

**Error Response if user not found:**

```json
{
  "error": "User with this email is not registered in the system"
}
```

#### Get all users a task list is shared with (owner only)

```http
GET /api/shares/:taskListId
```

#### Update permission level (owner only)

```http
PUT /api/shares/:taskListId/:shareId
Content-Type: application/json

{
  "permission": "view"
}
```

#### Remove user access (owner only)

```http
DELETE /api/shares/:taskListId/:shareId
```

## Permission Matrix

| Action           | Owner | Edit Permission | View Permission |
| ---------------- | ----- | --------------- | --------------- |
| View task list   | ✅    | ✅              | ✅              |
| View tasks       | ✅    | ✅              | ✅              |
| Create tasks     | ✅    | ✅              | ❌              |
| Edit tasks       | ✅    | ✅              | ❌              |
| Delete tasks     | ✅    | ✅              | ❌              |
| Update task list | ✅    | ❌              | ❌              |
| Delete task list | ✅    | ❌              | ❌              |
| Share task list  | ✅    | ❌              | ❌              |
| Manage shares    | ✅    | ❌              | ❌              |

## Database Schema

### User

- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password` (String, Hashed)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### TaskList

- `id` (UUID, Primary Key)
- `title` (String)
- `ownerId` (UUID, Foreign Key → User)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Task

- `id` (UUID, Primary Key)
- `title` (String)
- `description` (String, Optional)
- `status` (Enum: pending | in_progress | completed)
- `taskListId` (UUID, Foreign Key → TaskList)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### TaskListShare

- `id` (UUID, Primary Key)
- `taskListId` (UUID, Foreign Key → TaskList)
- `userId` (UUID, Foreign Key → User)
- `permission` (Enum: view | edit)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- Unique constraint on (taskListId, userId)

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

Error response format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Validation errors format:

```json
{
  "errors": [
    {
      "msg": "Validation error message",
      "param": "fieldName",
      "location": "body"
    }
  ]
}
```

## Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# Open Prisma Studio (Database GUI)
npm run prisma:studio
```

## Project Structure

```
express-test/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── tasklists.js       # Task list routes
│   │   ├── tasks.js           # Task routes
│   │   └── shares.js          # Sharing routes
│   ├── utils/
│   │   ├── jwt.js             # JWT utilities
│   │   ├── password.js        # Password hashing utilities
│   │   └── prisma.js          # Prisma client instance
│   └── server.js              # Main application file
├── .env                       # Environment variables (create from .env.example)
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Security Considerations

- Passwords are hashed using bcryptjs before storage
- JWT tokens are used for authentication
- All sensitive routes are protected with authentication middleware
- Permission checks are enforced at the route level
- Email validation and sanitization on registration
- Database queries use Prisma's parameterized queries to prevent SQL injection

## Development Tips

1. Use Prisma Studio to visualize and manage your database:

   ```bash
   npm run prisma:studio
   ```

2. When making schema changes, create a new migration:

   ```bash
   npx prisma migrate dev --name describe_your_change
   ```

3. Test API endpoints using tools like:
   - Postman
   - Insomnia
   - curl
   - Thunder Client (VS Code extension)

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
