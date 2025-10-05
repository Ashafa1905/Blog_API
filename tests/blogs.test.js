const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Blog = require('../src/models/Blog');

let token;
let userId;

beforeEach(async () => {
  // create user & login
  const signup = await request(app).post('/api/auth/signup').send({
    first_name: 'Test',
    last_name: 'User',
    email: 'testuser@example.com',
    password: 'Password123'
  });
  token = signup.body.token;
  userId = signup.body.user._id;
});

describe('Blogs', () => {
  it('should create a draft blog when logged in', async () => {
    const res = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'My First Blog',
        description: 'desc',
        tags: ['node', 'express'],
        body: 'This is the body with some words to calculate reading time.'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.state).toBe('draft');
    expect(res.body.reading_time).toBeGreaterThanOrEqual(1);
  });

  it('should publish blog and allow public listing and single fetch increments read_count', async () => {
    // create draft
    const create = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Publish Blog',
        body: 'word '.repeat(400)
      });
    const id = create.body._id;

    // publish
    const pub = await request(app)
      .patch(`/api/blogs/${id}/publish`)
      .set('Authorization', `Bearer ${token}`);
    expect(pub.statusCode).toBe(200);
    expect(pub.body.state).toBe('published');

    // list public
    const list = await request(app).get('/api/blogs');
    expect(list.statusCode).toBe(200);
    expect(list.body.total).toBeGreaterThanOrEqual(1);

    // fetch single increments read_count
    const first = await request(app).get(`/api/blogs/${id}`);
    expect(first.statusCode).toBe(200);
    expect(first.body.read_count).toBe(1);

    const second = await request(app).get(`/api/blogs/${id}`);
    expect(second.body.read_count).toBe(2);
  });

  it('owner should be able to update and delete', async () => {
    const create = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'To Be Edited',
        body: 'content here'
      });
    const id = create.body._id;

    const edit = await request(app)
      .put(`/api/blogs/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'new body with many words '.repeat(50) });

    expect(edit.statusCode).toBe(200);
    expect(edit.body.reading_time).toBeGreaterThanOrEqual(1);

    const del = await request(app)
      .delete(`/api/blogs/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.statusCode).toBe(200);
  });

  it('search by tag, title and author works', async () => {
    // create and publish multiple blogs
    await request(app).post('/api/blogs').set('Authorization', `Bearer ${token}`).send({ title: 'TagTest 1', body: 'a'.repeat(500), tags: ['tech'] });
    await request(app).post('/api/blogs').set('Authorization', `Bearer ${token}`).send({ title: 'TagTest 2', body: 'a'.repeat(500), tags: ['food'] });

    // publish both
    const allDrafts = await Blog.find({ author: userId });
    for (const b of allDrafts) {
      await request(app).patch(`/api/blogs/${b._id}/publish`).set('Authorization', `Bearer ${token}`);
    }

    const res = await request(app).get('/api/blogs?tags=tech');
    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });
});
