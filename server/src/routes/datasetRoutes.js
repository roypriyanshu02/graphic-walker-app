const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const config = require('../config');
const datasetController = require('../controllers/datasetController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.upload.uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow CSV files
    const allowedMimes = [
      'text/csv',
      'application/csv',
      'text/plain'
    ];
    
    // Check file extension as fallback
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || config.upload.allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Only ${config.upload.allowedTypes.join(', ')} files are allowed`), false);
    }
  }
});

/**
 * @route GET /Dataset
 * @desc Get all datasets
 * @access Public
 */
router.get('/', datasetController.getDatasets);

/**
 * @route POST /Dataset
 * @desc Save/create a dataset
 * @access Public
 */
router.post('/', datasetController.saveDataset);

/**
 * @route POST /Dataset/upload
 * @desc Upload a dataset file
 * @access Public
 */
router.post('/upload', upload.single('file'), datasetController.uploadDataset);

/**
 * @route GET /Dataset/:name
 * @desc Get dataset by name
 * @access Public
 */
router.get('/:name', datasetController.getDatasetByName);

/**
 * @route GET /Dataset/:name/data
 * @desc Get dataset data (supports pagination with ?page=1&limit=100)
 * @access Public
 */
router.get('/:name/data', datasetController.getDatasetData);

/**
 * @route GET /Dataset/:name/info
 * @desc Get dataset file information
 * @access Public
 */
router.get('/:name/info', datasetController.getDatasetInfo);

/**
 * @route DELETE /Dataset/:name
 * @desc Delete dataset by name
 * @access Public
 */
router.delete('/:name', datasetController.deleteDataset);

module.exports = router;
