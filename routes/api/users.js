//Requires for User Routes 
const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');

//Import Schemas
const User = require('../../models/User');

//@route   POST api/users
//@desc    Register a user
//@access  Public

//Define async route for connecting to DB 
router.post('/', async (req, res) => {
//All calls to DB are contained in a try/catch block 
    try {
        //Destructure the request object 
        const {
            name,
            email,
            password,
        } = req.body;

        //Check to see user exists in the database 
        //  Any requests to the database use 'await' 
        let user = await User.findOne({email: email});
        //If user exists, kill and return error 
        if(user){
            return res.status(400).json({errors: ({msg: 'User already exists' })})
        }

        //If no user, construct the avatar User property 
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        });

        //Define a new User using the mongoose Schema and pass in destructured and defined properties 
            user = new User({
                name,
                email,
                password,
                avatar,
            })
        //Save user instance to database using await within the try/catch block 
            await user.save()
        //Send a response to the client side 
            res.send(user) 
    //Catch block for database connection errors 
    } catch (error) {
        console.error(error.message);
        return res.status(500).json("server error")
    }
})

//Export router to be used for all api/user routes 
module.exports = router; 