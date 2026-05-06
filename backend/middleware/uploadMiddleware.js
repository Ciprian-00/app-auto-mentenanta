const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Doar imagini sunt permise'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = upload;
