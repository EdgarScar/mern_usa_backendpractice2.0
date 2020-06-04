//Require express 
const express = require('express');
//Require connectDB function 
const connectDB = require('./config/db');

//Initialize an instance of express 
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

//Define port as production or test 
const port = process.env.port || 4000; 
 
//Listen to incoming requests from the front end on port 
app.listen(port, () => console.log(`Server running on port ${port}`));