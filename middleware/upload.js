const multer = require('multer');
const storage = require('../config/storage');

const upload = multer({ storage });

module.exports = upload;
