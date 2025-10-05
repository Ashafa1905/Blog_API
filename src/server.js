//const express = require('express');
require('dotenv').config();
console.log("DEBUG ENV:", process.env.MONGO_URI);
const app = require('./app');
const connectDB = require('./config/db');
//console.log(app)
//let app = express();
//app.use(express.json());

let PORT = process.env.PORT || 30000;
let MONGO_URI = process.env.MONGO_URI;

//app.use(express.json());

// Root route to send response
// app.get('/', (req, res) => {
//   res.status(200).send('Welcome Baby');
// });

async function start() {
  try {
    await connectDB(MONGO_URI);
    app.listen(PORT, () =>{
        console.log(`Server running on port ${PORT}: http://localhost:${PORT}`)
    });
  } catch (err) {
    console.error('Server failed to start', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { start, app };
