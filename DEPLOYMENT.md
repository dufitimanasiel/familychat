# FaceChatFamily Deployment Guide

## Overview
FaceChatFamily is a full-stack social media and chat application with AI-powered security monitoring. This guide provides step-by-step instructions for deploying the application to production.

## System Requirements

### Minimum Requirements
- **Node.js**: 18.x or higher
- **MySQL**: 8.0 or higher
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB minimum
- **OS**: Linux (Ubuntu 20.04+), Windows Server 2019+, or macOS

### Recommended Production Setup
- **CPU**: 4+ cores
- **RAM**: 16GB+
- **Storage**: 100GB+ SSD
- **Load Balancer**: Nginx or Apache
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx

## Quick Start (Development)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd facechat
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API configuration
npm run dev
```

### 4. Database Setup
```bash
mysql -u root -p < database/schema.sql
```

## Production Deployment

### 1. Server Preparation

#### Install Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Windows
# Download and install from https://nodejs.org
```

#### Install MySQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# Create database
mysql -u root -p
CREATE DATABASE facechat;
CREATE USER 'facechat'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON facechat.* TO 'facechat'@'localhost';
FLUSH PRIVILEGES;
```

#### Install PM2 (Process Manager)
```bash
npm install -g pm2
```

#### Install Nginx (Reverse Proxy)
```bash
# Ubuntu/Debian
sudo apt install nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Backend Deployment

#### Configure Environment
```bash
cd /path/to/facechat/backend
cp .env.example .env
```

Edit `.env` file:
```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=facechat
DB_PASSWORD=your_strong_password
DB_NAME=facechat
JWT_SECRET=your_super_secret_jwt_key_here
UPLOAD_DIR=/var/www/facechat/uploads
MAX_FILE_SIZE=10485760
```

#### Install Dependencies
```bash
npm install --production
```

#### Setup Uploads Directory
```bash
sudo mkdir -p /var/www/facechat/uploads
sudo chown -R $USER:$USER /var/www/facechat/uploads
chmod 755 /var/www/facechat/uploads
```

#### Import Database Schema
```bash
mysql -u facechat -p facechat < database/schema.sql
```

#### Start with PM2
```bash
pm2 start server.js --name "facechat-backend"
pm2 save
pm2 startup
```

### 3. Frontend Deployment

#### Configure Environment
```bash
cd /path/to/facechat/frontend
cp .env.example .env
```

Edit `.env` file:
```env
VITE_API_BASE_URL=https://yourdomain.com/api
VITE_SOCKET_URL=https://yourdomain.com
VITE_APP_NAME=FaceChatFamily
VITE_APP_VERSION=1.0.0
```

#### Build for Production
```bash
npm run build
```

#### Serve with Nginx
```bash
# Copy build files to Nginx directory
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
```

### 4. Nginx Configuration

Create Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/facechat
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Frontend
    location / {
        root /var/www/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # File uploads
    location /uploads {
        alias /var/www/facechat/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/facechat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate (Let's Encrypt)

#### Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

#### Obtain SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### Auto-renewal
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 6. Security Configuration

#### Firewall Setup
```bash
# Ubuntu UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# CentOS firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

#### Security Headers
Add to Nginx configuration:
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### 7. Monitoring and Logging

#### PM2 Monitoring
```bash
pm2 monit
pm2 logs facechat-backend
```

#### Log Rotation
Create logrotate config:
```bash
sudo nano /etc/logrotate.d/facechat
```

Add:
```
/var/log/facechat/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload facechat-backend
    endscript
}
```

### 8. Backup Strategy

#### Database Backup
Create backup script:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/facechat"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u facechat -p'password' facechat > $BACKUP_DIR/db_backup_$DATE.sql

# File backup
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/facechat/uploads

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

Add to crontab:
```bash
# Daily at 2 AM
0 2 * * * /path/to/backup_script.sh
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=facechat
DB_PASSWORD=your_password
DB_NAME=facechat
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
UPLOAD_DIR=/var/www/facechat/uploads
MAX_FILE_SIZE=10485760
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
LOG_LEVEL=info
AI_MONITORING_ENABLED=true
```

### Frontend (.env)
```env
VITE_API_BASE_URL=https://yourdomain.com/api
VITE_SOCKET_URL=https://yourdomain.com
VITE_APP_NAME=FaceChatFamily
VITE_APP_VERSION=1.0.0
VITE_MAX_FILE_SIZE=10485760
VITE_ENABLE_AI_MONITORING=true
```

## Default Credentials

- **Admin Username**: `admin`
- **Admin Password**: `facechat@!`

⚠️ **Important**: Change the default admin password immediately after first login!

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
- Check MySQL service: `sudo systemctl status mysql`
- Verify credentials in `.env` file
- Check database exists: `mysql -u facechat -p -e "SHOW DATABASES;"`

#### 2. Port Already in Use
- Find process: `sudo lsof -i :5000`
- Kill process: `sudo kill -9 <PID>`

#### 3. File Upload Issues
- Check permissions: `ls -la /var/www/facechat/uploads`
- Fix permissions: `sudo chown -R www-data:www-data /var/www/facechat/uploads`

#### 4. Socket.io Connection Issues
- Check Nginx configuration for `/socket.io` location
- Verify CORS settings in backend

### Performance Optimization

#### 1. Enable Gzip Compression
Add to Nginx config:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

#### 2. Enable Caching
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### 3. Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_posts_created_user ON posts(created_at, user_id);
CREATE INDEX idx_messages_created_sender ON messages(created_at, sender_id);
```

## Scaling Considerations

### Horizontal Scaling
- Use load balancer with multiple backend instances
- Implement Redis for session storage
- Use CDN for static assets

### Database Scaling
- Implement read replicas
- Consider database sharding for large datasets
- Use connection pooling

### Monitoring
- Implement application monitoring (New Relic, DataDog)
- Set up alerting for critical errors
- Monitor database performance

## Support

For deployment issues:
1. Check application logs: `pm2 logs facechat-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check system logs: `sudo journalctl -xe`

## Security Best Practices

1. **Regular Updates**: Keep Node.js, Nginx, and MySQL updated
2. **Strong Passwords**: Use strong, unique passwords for all services
3. **Firewall**: Configure firewall to allow only necessary ports
4. **SSL**: Always use HTTPS in production
5. **Backups**: Implement regular backup strategy
6. **Monitoring**: Monitor for suspicious activities
7. **Access Control**: Limit SSH access to specific IPs
8. **Regular Security Audits**: Periodically review and update security measures

---

**Note**: This deployment guide covers a standard production setup. Adjust configurations based on your specific requirements and infrastructure.
