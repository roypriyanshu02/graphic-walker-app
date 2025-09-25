const logger = require('../utils/logger');
const { ValidationError } = require('../utils/validation');
const multer = require('multer');

const errorHandler = (error, req, res, next) => {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Validation errors
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      field: error.field
    });
  }

  // Multer errors (file upload)
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File Too Large',
        message: 'File size exceeds the maximum allowed limit'
      });
    }
    return res.status(400).json({
      error: 'Upload Error',
      message: error.message
    });
  }

  // File system errors
  if (error.code === 'ENOENT') {
    return res.status(404).json({
      error: 'File Not Found',
      message: 'The requested file could not be found'
    });
  }

  if (error.code === 'EACCES') {
    return res.status(403).json({
      error: 'Access Denied',
      message: 'Permission denied to access the requested resource'
    });
  }

  // JSON parsing errors
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON'
    });
  }

  // Default server error
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message
  });
};

module.exports = errorHandler;
