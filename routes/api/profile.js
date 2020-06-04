const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');


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

//@route   GET api/profile
//@desc    Show all profiles  
//@access  Public
router.get('/', async (req, res) => {
    //All db queries are wrapped in a try/catch block 
    try {
        //Retrieve all profiles from the db 
        let profiles = await Profile.find().populate('user', ['name', 'avatar']);
        //If no profiles are found 
        if(!profiles) {
            return res
            //500 bad request 
                .status(500)
                .json({msg: "No profiles found"})
        }
        return res.json(profiles)
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error')
    }
})

//@route   GET api/profile/user/:user_id
//@desc    Get profile by user ID
//@access  Public
router.get('/user/:user_id', async (req, res) => {
    //All db queries are wrapped in a try/catch block 
    try {
        //Retrieve profile by user ID  
        let profile = await Profile.findOne({ user: req.params.user_id }).populate('user',
         ['name', 'avatar']);

        //If no profile exists for that ID, kill and send response 
        if(!profile) {
            return res
            //500 bad request 
                .status(500)
                .json({msg: "Profile Not Found"})
        }
        res.json(profile)
    } catch (error) {
        console.error(error.message);
        if(error.kind === 'ObjectId') {
            return res
            //500 bad request 
                .status(500)
                .json({msg: "Profile Not Found"})
            }
        res.status(500).send('Server Error')
        }   
});

//@route   POST api/profile
//@desc    Create profile for current user  
//@access  Private
router.post(
    '/', 
    [check('status', 'Status is required')
        .not()
        .isEmpty(),
    check('skills', 'Skills are required')
        .not()
        .isEmpty()
    ], 
    auth, 
    async (req, res) => {
        //Check for validation errors 
        const errors = validationResult(req);
        //If errors, kill and respond with errors array 
        if(!errors.isEmpty()){
            //400 bad request 
            return res
                .status(400)
                .json({ msn: errors.array() })
        }
        //Destructure req body 
        const {
            company, 
            website, 
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body;

        //Build profile object before creating new Profile instance and passing it in as properties
            //Define empty profile object 
            const profileFields = {};
            //Attach each Profile property if it has been posted 
                //User id comes from the Auth JWT token 
                profileFields.user = req.user.id;
                if(company) profileFields.company = company;
                if(website) profileFields.website = website;
                if(location) profileFields.location = location;
                if(bio) profileFields.bio = bio;
                if(status) profileFields.status = status;
                if(githubusername) profileFields.githubusername = githubusername;
                if(skills) {
                  profileFields.skills = skills.split(",").map(skill => skill.trim());
                } 
                //Build social object within profile 
                profileFields.social = {};
                if(youtube) profileFields.social.youtube = youtube;
                if(twitter) profileFields.social.twitter = twitter;
                if(facebook) profileFields.social.facebook = facebook;
                if(linkedin) profileFields.social.linkedin = linkedin;
                if(instagram) profileFields.social.instagram = instagram;
        
            //All calls to the db are wrapped in a try/catch block 
            try {
                //Check to see if profile already exists 
                let profile = await Profile.findOne({user: req.user.id});
                
                //If a profile already exists, update the profile 
                if(profile) {
                    //Update profile 
                    profile = await Profile.findOneAndUpdate(
                        { user: req.user.id },
                        { $set: profileFields },
                        { new: true }
                    );
                    //Send response with updated Profile object for current user 
                    return res.json(profile)
                }
                    //Create profile 
                    profile = new Profile(profileFields);

                    //Save the Profile instance to the db 
                    await profile.save();
                    //Send response with created Profile object 
                    res.json(profile)
            } catch (error) {
                console.error(error.message)
                res.status(500).send('Server error')
            }
    }
);


module.exports = router; 