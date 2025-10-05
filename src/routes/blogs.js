const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const auth = require('../middleware/auth');

// public
router.get('/', blogController.listBlogs);
router.get('/:id', blogController.getBlog);

// protected
router.post('/', auth, blogController.createBlog);
router.put('/:id', auth, blogController.updateBlog);
router.patch('/:id/publish', auth, blogController.publishBlog);
router.delete('/:id', auth, blogController.deleteBlog);
router.get('/users/me', auth, blogController.listMyBlogs); // note: endpoint path tweaked to /users/me? But easier: use /users/me/blogs below

module.exports = router;
