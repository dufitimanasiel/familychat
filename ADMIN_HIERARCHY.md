# Admin Hierarchy System

## Overview

The FaceChat application now supports an admin hierarchy system where:

1. **Super Admin**: There is only one super admin who has full control over the system
2. **Sub-Admins**: The super admin can create and manage sub-admins
3. **Regular Users**: Regular users with no administrative privileges

## Database Schema

### Users Table Updates

The `users` table has been updated with the following columns:

- `is_super_admin` (BOOLEAN): Indicates if the user is a super admin
- `parent_admin_id` (INT NULL): References the super admin who created this sub-admin

## Backend Implementation

### New API Endpoints

#### Get All Admins
- **Endpoint**: `GET /api/admin/admins`
- **Access**: Super Admin only
- **Description**: Retrieves list of all admins (super admin and sub-admins)

#### Create Sub-Admin
- **Endpoint**: `POST /api/admin/admins`
- **Access**: Super Admin only
- **Body**:
  ```json
  {
    "username": "subadmin1",
    "email": "subadmin1@example.com",
    "password": "password123",
    "full_name": "Sub Admin One"
  }
  ```
- **Description**: Creates a new sub-admin account

#### Delete Sub-Admin
- **Endpoint**: `DELETE /api/admin/admins/:id`
- **Access**: Super Admin only
- **Description**: Deletes a sub-admin (cannot delete super admin or yourself)

### Middleware

- `isSuperAdmin`: New middleware to verify the user is a super admin
- Applied to all sub-admin management routes

### Security Rules

1. Only super admin can access `/api/admin/admins` endpoints
2. Super admin cannot delete themselves
3. Super admin cannot delete other super admins
4. Sub-admins can only be deleted by the super admin who created them

## Frontend Implementation

### New Pages

#### Admin Management Page
- **Route**: `/admin/admins`
- **Access**: Super Admin only
- **Features**:
  - View all admins (super admin and sub-admins)
  - Create new sub-admins
  - Delete sub-admins
  - Visual distinction between super admin and sub-admins

### Navigation

The "Admin Management" link in the admin sidebar is only visible to super admins.

## Default Super Admin

The default admin account (username: `admin`) has been automatically upgraded to super admin status during the migration.

## Usage

### Creating a Sub-Admin

1. Login as super admin
2. Navigate to Admin Panel > Admin Management
3. Click "Create Sub-Admin"
4. Fill in the required fields (username, email, password, full name)
5. Click "Create Sub-Admin"

### Deleting a Sub-Admin

1. Login as super admin
2. Navigate to Admin Panel > Admin Management
3. Find the sub-admin you want to delete
4. Click the "Delete" button
5. Confirm the deletion

### Sub-Admin Capabilities

Sub-admins have the same permissions as regular admins:
- Access to admin dashboard
- User management
- View audit logs
- Manage reports
- System settings

However, sub-admins CANNOT:
- Create other sub-admins
- Delete sub-admins
- Access the Admin Management page

## Audit Logging

All sub-admin creation and deletion actions are logged in the `audit_logs` table with:
- Action type: `create_sub_admin` or `delete_sub_admin`
- Entity type: `user`
- Details: JSON object containing relevant information

## Testing

### Test Super Admin Access

1. Login with the super admin account (username: `admin`, password: `facechat@!`)
2. Navigate to `/admin/admins`
3. You should see the Admin Management page with all admins listed

### Test Sub-Admin Restrictions

1. Create a sub-admin
2. Login with the sub-admin account
3. Try to access `/admin/admins`
4. You should see an "Access Denied" message

### Test Deletion Rules

1. Try to delete the super admin (should fail)
2. Try to delete yourself (should fail)
3. Try to delete a sub-admin created by another super admin (should fail)
4. Delete a sub-admin you created (should succeed)

## Security Considerations

1. The super admin role is the highest privilege level
2. JWT tokens include `is_super_admin` claim for server-side validation
3. All sub-admin management actions require super admin verification
4. Parent-child relationship is tracked via `parent_admin_id`
5. Audit trail is maintained for all admin management actions
