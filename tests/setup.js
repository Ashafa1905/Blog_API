const mongoose = require('mongoose');

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/blog_test'); // use a test DB
});

afterAll(async () => {
  await mongoose.connection.dropDatabase(); // clean up
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let c of collections) {
    await c.deleteMany({});
  }
});
