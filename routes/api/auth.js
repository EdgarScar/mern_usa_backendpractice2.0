const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');

//Import Schemas 
const User = require('../../models/User')

//@route   POST api/auth
//@desc    Authenticate user and get token 
//@access  Private
router.post(
    '/', 
    [check('email', 'Enter a valid email address').isEmail(),
     check('password', 'Password is required ').exists()
    ],
    async (req, res) => {
    //Check for validation errors 
    const errors = validationResult(req);
    //If errors kill and send response with errors array 
    if(!errors.isEmpty()){
        //500 bad request 
        return res.status(500).json({ msg: errors.array() });
    }
    //Deconstruct the request body 
    const { email, password } = req.body; 

    //All database calls to be wrapped in try/catch blocks 
    try {
        //Check if user exists in the database 
        //DB call use await 
        let user = await User.findOne({email});
        //If no user exists, respond with an error 
        if(!user) {
            //400 bad request 
            return res
                .status(400)
                .json({msg: "Invalid credentials"})
        }
        //If a user exists, verify the email and password 
        //Use bcrypt.compare to verify password string with bcrypted password in db
        //bcrypted password is available through user object that was retrieved from db 
        // .compare returns a promise 
        const isMatch = await bcrypt.compare(password, user.password);
        //If the passwords do not match
        if(!isMatch) {
            //400 bad request
            return res
                .status(400)
                .json({msg: "Invalid Credentials"});
        }

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

    } catch (error) {
        console.error(error.message);
        //500 internal server error 
        res.status(500).send('Server error')
    }
});

module.exports = router; 