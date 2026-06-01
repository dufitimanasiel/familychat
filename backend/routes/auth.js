const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin, validateSignup } = require('../middleware/validator');
const {
  register,
  signup,
  login,
  getMe,
  logout,
  updatePassword
} = require('../controllers/authController');

router.post('/signup', validateSignup, signup);
router.post('/register', protect, validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/update-password', protect, updatePassword);

module.exports = router;
