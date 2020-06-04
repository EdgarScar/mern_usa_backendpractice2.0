//Requires for User Routes 
const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');

//Import Schemas
const User = require('../../models/User');

//@route   POST api/users
//@desc    Register a user
//@access  Public

//Define async route for connecting to DB 
router.post('/', [
    check('name', 'Name is required')
    .not().isEmpty(),
    check('email', 'Email is required')
    .isEmail(),
    check('password', 'Password must be at least 6 characters')
    .isLength({ minLength: 6 })],
    async (req, res) => {
    //Check for validation errors 
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    //Destructure the request object 
    const {
        name,
        email,
        password,
    } = req.body;
    //All calls to DB are contained in a try/catch block 
    try {

        //Check to see user exists in the database 
        //  Any requests to the database use 'await' 
        let user = await User.findOne({email: email});
        //If user exists, kill and return error 
        if(user){
            //400 bad request 
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
            });
        //Bcrypt the password before storing it in the database 
            //Generate the bcryption salt 
            const salt = await bcrypt.genSalt(10)
            //Bcrypt the password
            user.password = await bcrypt.hash(password, salt);
        //Save user instance to database using await within the try/catch block 
            await user.save()

        //JSON Web Token 
            //Create the payload to load into the JWT
            const payload = {
                user: {
                    id: user.id,
                }
            }
            //Sign the token with a unique string 
            jwt.sign(
                //pass in the payload 
                payload, 
                //pass in the secret
                config.get('jwtToken'),
                //set expiration duration 
                {expiresIn: 36000},
                //define callback function to catch/throw an error or return the token to CS
                (err, token) => {
                    if (err) throw err;
                //send response of jwt token 
                    res.json(token);
                });

    //Catch block for database server connection errors 
    } catch (error) {
        console.error(error.message);
        //500 internal server error 
        return res.status(500).json("server error")
    }
})

//Export router to be used for all api/user routes 
module.exports = router; 