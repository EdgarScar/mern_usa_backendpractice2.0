//Require mongoose to connect to Atlas 
const mongoose = require('mongoose');
//Require config package 
const config = require('config');

//Import URI for Atlas connection 
const db = config.get('mongoURI')

//Define async function with arrow syntax to connect mongoose to Atlas using the 
//  URI and passing in necessary deprecated parameters 
const connectDB = async () => {
    try {
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false}) 
        console.log("MongoDB Connected...")
    } catch (error) {
        console.log(error.message)
        process.exit(1)
    }
}

//Export connection function 
module.exports = connectDB;