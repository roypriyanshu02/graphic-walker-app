const express = require('express');
const authService = require('../services/authService');
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    logger.info('Registration request received', { email, name });

    const result = await authService.register({ email, password, name });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    logger.error('Registration failed', { error: error.message });
    
    res.status(400).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    logger.info('Login request received', { email });

    const result = await authService.login({ email, password });

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    logger.error('Login failed', { error: error.message });
    
    res.status(401).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
});

// Get user profile (protected route)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    logger.debug('Profile request received', { userId: req.user.id });

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    logger.error('Profile retrieval failed', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Profile retrieval failed',
      message: error.message
    });
  }
});

// Verify token (protected route)
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    logger.debug('Token verification request', { userId: req.user.id });

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user,
        valid: true
      }
    });
  } catch (error) {
    logger.error('Token verification failed', { error: error.message });
    
    res.status(401).json({
      success: false,
      error: 'Token verification failed',
      message: error.message
    });
  }
});

// Logout (client-side token removal, but we can log it)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    logger.info('Logout request received', { userId: req.user.id });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout failed', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: error.message
    });
  }
});

module.exports = router;
