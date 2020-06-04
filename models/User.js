//Require mongoose to create a Schema 
const mongoose = require('mongoose');

//Define Schema using mongoose 
const UserSchema = new mongoose.Schema ({
    //Define each property and its parameters 
  name: {
      type: String,
      required: true,
  }, 
  email: {
      type: String,
      required: true,
      unique: true,
  },
  password: {
      type: String,
      required: true,
  },
  avatar: {
      type: String,
  },
  date: {
      type: Date,
      default: Date.now
  }
});

//Export Schema using this format 
module.exports = User = mongoose.model('User', UserSchema)