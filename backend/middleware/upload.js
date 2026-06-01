const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory if it doesn't exist
const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(path.join(uploadDir, 'profiles'), { recursive: true });
  fs.mkdirSync(path.join(uploadDir, 'posts'), { recursive: true });
  fs.mkdirSync(path.join(uploadDir, 'messages'), { recursive: true });
  fs.mkdirSync(path.join(uploadDir, 'stories'), { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'others';
    
    console.log('Upload middleware - originalUrl:', req.originalUrl);
    console.log('Upload middleware - uploadType:', req.body.uploadType);
    console.log('Upload middleware - file:', file.originalname);
    
    // Determine subfolder based on route or uploadType
    if (req.originalUrl && req.originalUrl.includes('/posts')) {
      subfolder = 'posts';
    } else if (req.originalUrl && req.originalUrl.includes('/messages')) {
      subfolder = 'messages';
    } else if (req.originalUrl && req.originalUrl.includes('/users/upload-profile-picture')) {
      subfolder = 'profiles';
    } else if (req.body.uploadType === 'profile') {
      subfolder = 'profiles';
    } else if (req.body.uploadType === 'post') {
      subfolder = 'posts';
    } else if (req.body.uploadType === 'message') {
      subfolder = 'messages';
    } else if (req.body.uploadType === 'story') {
      subfolder = 'stories';
    }
    
    console.log('Upload middleware - subfolder:', subfolder);
    
    const folder = path.join(uploadDir, subfolder);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp3',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, audio, and documents are allowed.'), false);
  }
};

// Multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 // 50MB default
  }
});

module.exports = upload;
