const express = require('express');
const connectDB = require('./config/db');

const app = express();

//Connect to MongoDB
connectDB();

//Use middlewear 
app.use(express.json());

//Routes
app.use('/api/users', require('./routes/api/users'))
app.use('/api/auth', require('./routes/api/auth'))
app.use('/api/posts', require('./routes/api/posts'))
app.use('/api/profile', require('./routes/api/profile'))

const port = process.env.port || 4000; 
 
app.listen(port, () => console.log(`Server running on port ${port}`));