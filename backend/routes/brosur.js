const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const BrosurController = require('../controllers/brosurController');
const { authenticate } = require('../middleware/auth');

// Configure multer for brosur image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/brosur/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'brosur-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files per upload
  }
});

// Routes
router.post('/:packageId/upload', 
  authenticate,
  upload.array('images', 10),
  BrosurController.uploadImages
);

router.get('/:packageId',
  authenticate,
  BrosurController.getByPackageId
);

router.get('/:packageId/package',
  authenticate,
  BrosurController.getPackageWithBrosur
);

router.put('/image/:imageId',
  authenticate,
  BrosurController.updateImage
);

router.put('/:packageId/primary/:imageId',
  authenticate,
  BrosurController.setPrimaryImage
);

router.put('/:packageId/reorder',
  authenticate,
  BrosurController.reorderImages
);

router.delete('/image/:imageId',
  authenticate,
  BrosurController.deleteImage
);

router.get('/statistics',
  authenticate,
  BrosurController.getStatistics
);

router.get('/packages/with-images',
  authenticate,
  BrosurController.getPackagesWithPrimaryImages
);

module.exports = router;