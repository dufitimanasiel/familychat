const express = require('express');
const router = express.Router();
const { protect, authorize, isSuperAdmin } = require('../middleware/auth');
const {
  getAllAdmins,
  createSubAdmin,
  deleteSubAdmin,
  getStats,
  getAuditLogs,
  getReports,
  updateReport,
  getSettings,
  updateSettings,
  resetPassword
} = require('../controllers/adminController');

// Sub-admin management routes (Super Admin only)
router.route('/admins')
  .get(protect, authorize('admin'), isSuperAdmin, getAllAdmins)
  .post(protect, authorize('admin'), isSuperAdmin, createSubAdmin);

router.route('/admins/:id')
  .delete(protect, authorize('admin'), isSuperAdmin, deleteSubAdmin);

router.route('/stats')
  .get(protect, authorize('admin'), getStats);

router.route('/audit-logs')
  .get(protect, authorize('admin'), getAuditLogs);

router.route('/reports')
  .get(protect, authorize('admin'), getReports);

router.route('/reports/:id')
  .put(protect, authorize('admin'), updateReport);

router.route('/settings')
  .get(protect, authorize('admin'), getSettings)
  .put(protect, authorize('admin'), updateSettings);

router.route('/users/:id/reset-password')
  .post(protect, authorize('admin'), resetPassword);

module.exports = router;
