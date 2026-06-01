# FaceChat Backend

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env` file:
```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=facechat
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

3. Import the database schema:
```bash
mysql -u root -p < database/schema.sql
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Default Admin Account

- Username: `admin`
- Password: `facechat@!`

## API Endpoints

### Authentication
- POST /api/auth/register - Create user (Admin only)
- POST /api/auth/login - Login
- GET /api/auth/me - Get current user
- POST /api/auth/logout - Logout
- PUT /api/auth/update-password - Update password

### Users
- GET /api/users - Get all users (Admin)
- GET /api/users/:id - Get user
- PUT /api/users/:id - Update user (Admin)
- DELETE /api/users/:id - Delete user (Admin)
- PUT /api/users/profile - Update own profile
- PUT /api/users/profile-picture - Update profile picture
- GET /api/users/suggested - Get suggested users
- GET /api/users/online - Get online users
- POST /api/users/:id/block - Block user
- DELETE /api/users/:id/block - Unblock user

### Messages
- POST /api/messages - Send message
- GET /api/messages/unread - Get unread count
- GET /api/messages/conversation/:userId - Get conversation
- GET /api/messages/group/:groupId - Get group messages
- PUT /api/messages/:id - Update message
- DELETE /api/messages/:id - Delete message

### Chats
- GET /api/chats - Get user chats
- PUT /api/chats/:id/archive - Archive chat
- PUT /api/chats/:id/unarchive - Unarchive chat
- PUT /api/chats/:id/pin - Pin chat
- PUT /api/chats/:id/unpin - Unpin chat
- PUT /api/chats/:id/mute - Mute chat
- PUT /api/chats/:id/unmute - Unmute chat
- DELETE /api/chats/:id - Delete chat

### Posts
- GET /api/posts - Get posts (Feed)
- POST /api/posts - Create post
- GET /api/posts/:id - Get post
- PUT /api/posts/:id - Update post
- DELETE /api/posts/:id - Delete post
- POST /api/posts/:id/like - Like/unlike post
- GET /api/posts/:id/comments - Get post comments
- POST /api/posts/:id/comments - Add comment
- POST /api/posts/:id/share - Share post

### Groups
- GET /api/groups - Get groups
- POST /api/groups - Create group
- GET /api/groups/my - Get user groups
- GET /api/groups/:id - Get group
- PUT /api/groups/:id - Update group
- DELETE /api/groups/:id - Delete group
- POST /api/groups/:id/members - Add member
- DELETE /api/groups/:id/members/:userId - Remove member

### Friends
- POST /api/friends/request - Send friend request
- GET /api/friends/requests - Get friend requests
- PUT /api/friends/requests/:id/accept - Accept request
- PUT /api/friends/requests/:id/decline - Decline request
- DELETE /api/friends/requests/:id - Cancel request
- GET /api/friends - Get friends
- DELETE /api/friends/:id - Remove friend

### Notifications
- GET /api/notifications - Get notifications
- GET /api/notifications/unread - Get unread count
- PUT /api/notifications/:id/read - Mark as read
- PUT /api/notifications/read-all - Mark all as read
- DELETE /api/notifications/:id - Delete notification
- DELETE /api/notifications - Delete all notifications

### Admin
- GET /api/admin/stats - Get dashboard stats
- GET /api/admin/audit-logs - Get audit logs
- GET /api/admin/reports - Get reports
- PUT /api/admin/reports/:id - Update report
- GET /api/admin/settings - Get settings
- PUT /api/admin/settings - Update settings
- POST /api/admin/users/:id/reset-password - Reset user password

## Socket.io Events

### Client -> Server
- `user:join` - User joins with ID
- `chat:join` - Join chat room
- `chat:leave` - Leave chat room
- `group:join` - Join group room
- `group:leave` - Leave group room
- `message:send` - Send message
- `typing:start` - Start typing
- `typing:stop` - Stop typing
- `messages:seen` - Mark messages as seen

### Server -> Client
- `message:receive` - Receive message
- `message:sent` - Message sent confirmation
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `messages:seen` - Messages seen confirmation
- `user:online` - User came online
- `user:offline` - User went offline
