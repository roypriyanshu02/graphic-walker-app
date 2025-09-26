const authService = require('../services/authService');
const logger = require('../utils/logger');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Validate token and get user
    const user = await authService.validateTokenAndGetUser(token);
    
    // Add user to request object
    req.user = user;
    
    next();
  } catch (error) {
    logger.error('Authentication failed', { error: error.message });
    
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (token) {
      try {
        const user = await authService.validateTokenAndGetUser(token);
        req.user = user;
      } catch (error) {
        // Token is invalid but we don't fail the request
        logger.debug('Optional auth failed', { error: error.message });
      }
    }
    
    next();
  } catch (error) {
    // Don't fail the request for optional auth
    logger.debug('Optional authentication error', { error: error.message });
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
