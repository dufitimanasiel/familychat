# FaceChat - Modern Social Media & Chat Application

A full-featured social media and chat web application built with React.js, Node.js, Express.js, MySQL, and Socket.io.

## Features

### Core Features
- **Authentication System**: Secure login with JWT, password hashing with bcrypt
- **Role-based Access Control**: Admin and user roles with different permissions
- **Real-time Communication**: Socket.io for instant messaging
- **Social Feed**: News feed style home page with posts, likes, comments
- **Friend System**: Send, accept, decline friend requests
- **Private Messaging**: One-on-one real-time chat
- **Group Chats**: Create and manage group conversations
- **User Profiles**: Profile pictures, bio, about section
- **Notifications**: Real-time notifications for messages, likes, friend requests
- **File Uploads**: Share images, videos, files, documents
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on mobile, tablet, and desktop

### Admin Features
- **User Management**: Create, edit, delete user accounts
- **User Blocking/Unblocking**: Block or unblock users
- **Password Reset**: Reset user passwords
- **Dashboard Analytics**: View users online, messages sent, active users
- **Audit Logs**: Track system activity
- **System Settings**: Configure site-wide settings
- **Reports Management**: View and handle user reports

### Security Features
- SQL injection protection
- XSS protection
- CSRF protection
- Rate limiting
- Input validation
- Secure password encryption
- Secure file upload checks
- Token expiration handling

## Tech Stack

### Frontend
- React.js 18
- Vite
- TailwindCSS
- Socket.io Client
- Zustand (State Management)
- Axios
- Lucide React (Icons)
- React Hot Toast

### Backend
- Node.js
- Express.js
- Socket.io
- MySQL
- JWT
- bcryptjs
- Multer (File Uploads)
- Express Validator

## Project Structure

```
facechat/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── messageController.js
│   │   ├── chatController.js
│   │   ├── postController.js
│   │   ├── groupController.js
│   │   ├── friendController.js
│   │   ├── notificationController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── validator.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Message.js
│   │   ├── Chat.js
│   │   ├── Post.js
│   │   ├── Group.js
│   │   ├── Friend.js
│   │   ├── Like.js
│   │   ├── Comment.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── messages.js
│   │   ├── chats.js
│   │   ├── posts.js
│   │   ├── groups.js
│   │   ├── friends.js
│   │   ├── notifications.js
│   │   └── admin.js
│   ├── uploads/
│   │   ├── profiles/
│   │   ├── posts/
│   │   ├── messages/
│   │   └── stories/
│   ├── .env
│   ├── package.json
│   ├── server.js
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Textarea.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   └── Avatar.jsx
│   │   │   └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Feed.jsx
│   │   │   ├── Messages.jsx
│   │   │   ├── Friends.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── Users.jsx
│   │   │       └── Settings.jsx
│   │   ├── store/
│   │   │   ├── authStore.js
│   │   │   └── chatStore.js
│   │   ├── utils/
│   │   │   ├── axios.js
│   │   │   ├── socket.js
│   │   │   └── cn.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── README.md
├── database/
│   └── schema.sql
└── README.md
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE facechat;
```

2. Import the schema:
```bash
mysql -u root -p facechat < database/schema.sql
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=facechat
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

4. Start the backend server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Default Admin Account

- **Username**: `admin`
- **Password**: `facechat@!`

**Important**: Change the admin password after first login for security.

## Usage

### For Admin

1. Login with admin credentials
2. Navigate to Admin Dashboard
3. Use "Manage Users" to create new user accounts
4. Configure system settings in Admin Settings
5. Monitor activity in Audit Logs

### For Users

1. Login with credentials provided by admin
2. Update your profile in Settings
3. Create posts on the Feed
4. Send friend requests to connect with others
5. Chat with friends in real-time
6. Share photos, videos, and files

## API Documentation

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (Admin)
- `POST /api/auth/register` - Create user (Admin)
- `PUT /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversation/:userId` - Get conversation
- `GET /api/messages/group/:groupId` - Get group messages

### Posts
- `GET /api/posts` - Get feed
- `POST /api/posts` - Create post
- `POST /api/posts/:id/like` - Like/unlike post

### Friends
- `POST /api/friends/request` - Send friend request
- `GET /api/friends` - Get friends
- `PUT /api/friends/requests/:id/accept` - Accept request

See `backend/README.md` for complete API documentation.

## Socket.io Events

### Client → Server
- `user:join` - Join with user ID
- `chat:join` - Join chat room
- `message:send` - Send message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `messages:seen` - Mark messages as seen

### Server → Client
- `message:receive` - Receive message
- `message:sent` - Message sent confirmation
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `user:online` - User came online
- `user:offline` - User went offline

## Security Notes

1. **Change Default Password**: Always change the default admin password
2. **Environment Variables**: Never commit `.env` files to version control
3. **JWT Secret**: Use a strong, random JWT secret in production
4. **Database Credentials**: Use strong database passwords
5. **HTTPS**: Use HTTPS in production
6. **Rate Limiting**: Configure appropriate rate limits
7. **File Uploads**: Validate all uploaded files
8. **SQL Injection**: Use parameterized queries (already implemented)

## License

This project is for educational purposes.

## Support

For issues or questions, please refer to the documentation in the respective README files:
- Backend: `backend/README.md`
- Frontend: `frontend/README.md`
