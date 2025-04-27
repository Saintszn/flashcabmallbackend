// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController =require ('../controllers/adminController');



router.put('/upload-profile',  adminController.uploadProfileImage);

router.get('/profileImage',  adminController .getProfileImage);

router.get('/profileDetails',  adminController.getProfileDetails);

router.post('/profileDetails', adminController .createProfileDetails);



module.exports = router;


