const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'team-player-pics',
        allowed_formats: ['jpg', 'jpeg', 'png'],
    },
});

module.exports = storage;
