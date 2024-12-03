require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Debug log to check environment variables
// console.log('Cloudinary Config:', {
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET?.substring(0, 5) + '...' // Only log first 5 chars of secret
// });

// Initialize Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = {
    uploadToCloud: async (filePath, folder) => {
        try {
            console.log('Uploading to Cloudinary:', { filePath, folder });
            const result = await cloudinary.uploader.upload(filePath, {
                resource_type: 'video',
                folder: folder,
                use_filename: true,
                unique_filename: true
            });
            console.log('Upload successful:', result.secure_url);
            
            return {
                url: result.secure_url,
                public_id: result.public_id
            };
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw error;
        }
    },

    deleteFromCloud: async (public_id) => {
        try {
            const result = await cloudinary.uploader.destroy(public_id, {
                resource_type: 'video'
            });
            
            return result.result === 'ok';
        } catch (error) {
            console.error('Error deleting from Cloudinary:', error);
            throw error;
        }
    }
};
