const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const blogRoutes = require('./blogs');

router.use('/auth', authRoutes);
router.use('/blogs', blogRoutes);

// Owner blogs endpoint alternate path:
const blogController = require('../controllers/blogController');
const auth = require('../middleware/auth');
router.get('/users/me/blogs', auth, blogController.listMyBlogs);

module.exports = router;
