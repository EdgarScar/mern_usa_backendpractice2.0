const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

//Import Schemas 
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route   GET api/profile
//@desc     Get current user's profile 
//@access  Private
router.get('/me', auth, async (req, res) => {
    //All db queries are wrapped in a try/catch block 
    try {
        //Check if profile for current user already exists 
        // await got db check
        // find one profile by the user id stored from auth header 
        // .populate grants access to another model's properties 
        let profile = await Profile.findOne({user: req.user.id}).populate('user', 
        ['name', 'avatar']);

        //If no profile is found 
        if(!profile) {
            return res
            //500 bad request 
                .status(500)
                .json({msg: "No profile found"})
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error')
    }

})

module.exports = router; 