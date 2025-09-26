const express = require('express');
const sqliteService = require('../services/sqliteService');
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Get all user settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    logger.debug('Fetching user settings', { userId });

    const settings = await sqliteService.getUserSettings(userId);

    res.json({
      success: true,
      message: 'Settings retrieved successfully',
      data: { settings }
    });
  } catch (error) {
    logger.error('Failed to fetch user settings', { userId: req.user?.id, error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
      message: error.message
    });
  }
});

// Get specific user setting
router.get('/:key', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const settingKey = req.params.key;
    
    logger.debug('Fetching user setting', { userId, settingKey });

    const setting = await sqliteService.getUserSetting(userId, settingKey);

    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found',
        message: `Setting '${settingKey}' not found for user`
      });
    }

    res.json({
      success: true,
      message: 'Setting retrieved successfully',
      data: { setting: { [settingKey]: setting } }
    });
  } catch (error) {
    logger.error('Failed to fetch user setting', { 
      userId: req.user?.id, 
      settingKey: req.params.key, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch setting',
      message: error.message
    });
  }
});

// Save single user setting
router.put('/:key', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const settingKey = req.params.key;
    const { value, type = 'string', isGlobal = false } = req.body;
    
    logger.info('Saving user setting', { userId, settingKey, type });

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Setting value is required'
      });
    }

    const result = await sqliteService.saveUserSetting(userId, settingKey, value, type, isGlobal);

    res.json({
      success: true,
      message: 'Setting saved successfully',
      data: { setting: result }
    });
  } catch (error) {
    logger.error('Failed to save user setting', { 
      userId: req.user?.id, 
      settingKey: req.params.key, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to save setting',
      message: error.message
    });
  }
});

// Save multiple user settings
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { settings } = req.body;
    
    logger.info('Saving multiple user settings', { userId, settingsCount: Object.keys(settings || {}).length });

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Settings object is required'
      });
    }

    const results = await sqliteService.saveUserSettings(userId, settings);

    res.json({
      success: true,
      message: 'Settings saved successfully',
      data: { settings: results }
    });
  } catch (error) {
    logger.error('Failed to save multiple user settings', { 
      userId: req.user?.id, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to save settings',
      message: error.message
    });
  }
});

// Delete user setting
router.delete('/:key', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const settingKey = req.params.key;
    
    logger.info('Deleting user setting', { userId, settingKey });

    const deleted = await sqliteService.deleteUserSetting(userId, settingKey);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found',
        message: `Setting '${settingKey}' not found for user`
      });
    }

    res.json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete user setting', { 
      userId: req.user?.id, 
      settingKey: req.params.key, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete setting',
      message: error.message
    });
  }
});

// User Groups Routes

// Get user groups
router.get('/groups/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    logger.debug('Fetching user groups', { userId });

    const groups = await sqliteService.getUserGroups(userId);

    res.json({
      success: true,
      message: 'User groups retrieved successfully',
      data: { groups }
    });
  } catch (error) {
    logger.error('Failed to fetch user groups', { userId: req.user?.id, error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user groups',
      message: error.message
    });
  }
});

// Create user group
router.post('/groups', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupName, description } = req.body;
    
    logger.info('Creating user group', { userId, groupName });

    if (!groupName) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Group name is required'
      });
    }

    const group = await sqliteService.createUserGroup({ groupName, description }, userId);

    res.status(201).json({
      success: true,
      message: 'User group created successfully',
      data: { group }
    });
  } catch (error) {
    logger.error('Failed to create user group', { 
      userId: req.user?.id, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to create user group',
      message: error.message
    });
  }
});

// Get group settings
router.get('/groups/:groupId/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.groupId;
    
    logger.debug('Fetching group settings', { userId, groupId });

    // TODO: Add authorization check to ensure user is member of group
    const settings = await sqliteService.getGroupSettings(groupId);

    res.json({
      success: true,
      message: 'Group settings retrieved successfully',
      data: { settings }
    });
  } catch (error) {
    logger.error('Failed to fetch group settings', { 
      userId: req.user?.id, 
      groupId: req.params.groupId, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch group settings',
      message: error.message
    });
  }
});

// Save group setting
router.put('/groups/:groupId/settings/:key', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.groupId;
    const settingKey = req.params.key;
    const { value, type = 'string' } = req.body;
    
    logger.info('Saving group setting', { userId, groupId, settingKey, type });

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Setting value is required'
      });
    }

    // TODO: Add authorization check to ensure user has admin role in group
    const result = await sqliteService.saveGroupSetting(groupId, settingKey, value, type);

    res.json({
      success: true,
      message: 'Group setting saved successfully',
      data: { setting: result }
    });
  } catch (error) {
    logger.error('Failed to save group setting', { 
      userId: req.user?.id, 
      groupId: req.params.groupId,
      settingKey: req.params.key, 
      error: error.message 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to save group setting',
      message: error.message
    });
  }
});

module.exports = router;
