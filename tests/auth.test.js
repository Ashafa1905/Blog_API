const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Auth endpoints', () => {
  it('should sign up a user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        first_name: 'Basheer',
        last_name: 'Ashafa',
        email: 'basheer@example.com',
        password: 'Password123'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('basheer@example.com');
  });

  it('should sign in a user', async () => {
    const user = new User({
      first_name: 'Basheer',
      last_name: 'Ashafa',
      email: 'login@example.com',
      password: 'Password123'
    });
    await user.save();

    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'login@example.com', password: 'Password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@example.com');
  });
});
