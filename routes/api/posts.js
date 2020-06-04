const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth')

//Import Schemas 
const Post = require('../../models/Posts');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route   POST api/posts
//@desc    Create a post 
//@access  Private
router.post(
    '/', 
    [auth, 
    [check('text', 'Text is required')
        .not()
        .isEmpty(),
    ]
    ], async (req, res) => {
        //Check for validation errors 
        const errors = validationResult(req);
        //If errors, kill and send response of errors array 
        if(!errors.isEmpty()) {
            //400 bad request
            return res
                .status(400)
                .json({ errors: errors.array() });
        }
        //All db queries should be wrapped in try/catch block 
        try {
            //Retrieve the current user object from the db without retrieving their password 
            const user = await (await User.findById(req.user.id)).isSelected("-password");

            //Define an instance of the Post model and its properties 
            // some properties come from user input, others from the database 
            const newPost = new Post({
                text: req.body.text, //user input
                name: user.name,     //db 
                avatar: user.avatar, //db
                user: req.user.id    //jwt 
            });
            
            //Save post to the database 
            const post = await newPost.save();
            //Send response of new post 
            res.json(post);

        } catch (error) {
            console.error(error.message);
            //500 internal server error 
            res.status(500).json("server error")
        }
})

module.exports = router; 