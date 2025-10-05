const Blog = require('../models/Blog');
const User = require('../models/User');
const { readingTimeFromText } = require('../utils/readingTime');
const mongoose = require('mongoose');

// create blog (owner)
exports.createBlog = async (req, res, next) => {
  try {
    const { title, description, tags = [], body } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'title and body are required' });

    const reading_time = readingTimeFromText(body);
    const blog = new Blog({
      title,
      description,
      author: req.user._id,
      tags,
      body,
      reading_time,
      state: 'draft'
    });
    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Title must be unique' });
    next(err);
  }
};

// list published blogs (public) — supports pagination, filters, search, sort
exports.listBlogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, tags, title, author, sortBy = 'timestamp', order = 'desc', state } = req.query;
    const skip = (Math.max(1, page) - 1) * limit;

    // Build base query: by default only published
    let query = { state: 'published' };

    // If requester is authenticated and wants to filter by state for their own blogs, allow it via /users/me/blogs instead.
    // But we will allow `state` query only if it's 'published' for public endpoint.
    if (state && state !== 'published') {
      // ignore or return empty if not published
      return res.status(403).json({ message: 'Cannot filter by this state on public endpoint' });
    }

    if (title) query.title = new RegExp(title, 'i');

    if (tags) {
      const tagsArray = tags.split(',').map(t => t.trim());
      query.tags = { $in: tagsArray };
    }

    if (author) {
      // search users by name or email
      const users = await User.find({
        $or: [
          { first_name: new RegExp(author, 'i') },
          { last_name: new RegExp(author, 'i') },
          { email: new RegExp(author, 'i') }
        ]
      }).select('_id');
      const ids = users.map(u => u._id);
      query.author = { $in: ids.length ? ids : [] };
    }

    // Sorting
    const sortField = (sortBy === 'read_count' || sortBy === 'reading_time' || sortBy === 'timestamp') ? sortBy : 'timestamp';
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = {};
    sortObj[sortField] = sortOrder;

    const [items, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'first_name last_name email')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit)),
      Blog.countDocuments(query)
    ]);

    res.json({
      page: Number(page),
      perPage: Number(limit),
      total,
      items
    });
  } catch (err) {
    next(err);
  }
};

// get a single blog — increment read_count by 1 atomically and return populated author
exports.getBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    const blog = await Blog.findByIdAndUpdate(
      id,
      { $inc: { read_count: 1 } },
      { new: true }
    ).populate('author', 'first_name last_name email');

    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    // If blog is draft and requester is not the owner -> forbid
    if (blog.state === 'draft') {
      if (!req.user || String(blog.author._id) !== String(req.user._id)) {
        return res.status(403).json({ message: 'This blog is not published' });
      }
    }

    res.json(blog);
  } catch (err) {
    next(err);
  }
};

// update blog (owner can update in draft or published)
exports.updateBlog = async (req, res, next) => {
  try {
    console.log("You reach here at all")
    const { id } = req.params;
    const update = req.body;
    const blog = await Blog.findById(id);
    console.log( "I TRY OO")
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    if (String(blog.author) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' });

    // If body changed, update reading_time
    if (update.body) {
      update.reading_time = require('../utils/readingTime').readingTimeFromText(update.body);
    }

    Object.assign(blog, update);
    await blog.save();
    res.json(blog);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Title must be unique' });
    next(err);
  }
};

// publish blog (owner)
exports.publishBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    if (String(blog.author) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' });

    blog.state = 'published';
    blog.reading_time = require('../utils/readingTime').readingTimeFromText(blog.body);
    await blog.save();
    res.json(blog);
  } catch (err) {
    next(err);
  }
};

exports.deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    if (String(blog.author) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' });

    //await blog.remove();
    await blog.deleteOne()
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

// list owner blogs
exports.listMyBlogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, state, sortBy = 'timestamp', order = 'desc' } = req.query;
    const skip = (Math.max(1, page) - 1) * limit;

    const query = { author: req.user._id };
    if (state) query.state = state;

    const sortField = (sortBy === 'read_count' || sortBy === 'reading_time' || sortBy === 'timestamp') ? sortBy : 'timestamp';
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = {};
    sortObj[sortField] = sortOrder;

    const [items, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'first_name last_name email')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit)),
      Blog.countDocuments(query)
    ]);

    res.json({
      page: Number(page),
      perPage: Number(limit),
      total,
      items
    });
  } catch (err) {
    next(err);
  }
};
