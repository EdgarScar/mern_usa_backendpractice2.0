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
        //Send response with profile object of current user 
        res.json(profile);
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
    [[check('status', 'Status is required')
        .not()
        .isEmpty(),
    check('skills', 'Skills are required')
        .not()
        .isEmpty()
    ], 
    auth], 
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

//@route   DELETE api/profile
//@desc    Delete profile, user & posts  
//@access  Private 
router.delete('/', auth, async (req, res) => {
    //All db queries are wrapped in a try/catch block 
    try {
        //Find and remove profile from current user ID 
        await Profile.findOneAndRemove({ user: req.user.id });
        
        //Find and remove current user 
        await User.findOneAndRemove({ _id: req.user.id });
    
        //Send response that user has been deleted 
        return res.json({msg: "user deleted"})
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error')
    }
})

//@route   PUT api/profile/experience 
//@desc    Update experience in profile  
//@access  Private 

router.put(
    '/experience',
    [check('title', 'Title is required')
        .not()
        .isEmpty(),
    check('company', 'Title is required')
        .not()
        .isEmpty(),
    check('from', 'From date is required')
        .not()
        .isEmpty(),
    ], 
    auth, 
    async (req, res) => {
        //Check for validation errors 
        const errors = validationResult(req);
        //If errors, kill and send response with errors array 
        if(!errors.isEmpty()){
            return res
                .status(400)
                .json({ msg: errors.array() })
        }

        //Destructure req body 
        const {
            title, 
            company, 
            location,
            from,
            to,
            current,
            description
        } = req.body; 
        //Define an object and define it with experience properties from req body 
        const newExp = {
            title, 
            company, 
            location,
            from,
            to,
            current,
            description
        };

        //All calls to db are wrapped in try/catch block 
        try {
            //Find profile by current user id that experience will be added to 
            // current user id is taken from auth middleware 
            const profile = await Profile.findOne({ user: req.user.id })
            
            //Add experience to profile.experience array using unshift to add it to beginning 
            profile.experience.unshift(newExp);
            //Save the updated instance of the profile with experience 
            await profile.save()
            //Send response of updated profile 
            res.json(profile)
        } catch (error) {
            console.error(error.message);
            //500 internal server error 
            res.status(500).send("server error")
        }

})

//@route   DELETE api/profile/experience/:exp_id
//@desc    Delete experience from profile
//@access  Private 
router.delete('/experience/:exp_id', auth, async (req, res) => {
    //All db queries are wrapped in a try/catch block 
    try {
        //Find profile from current user ID 
        const profile = await Profile.findOne({ user: req.user.id });
        //Get index of experience to remove from experience array 
        // map over experience array to create array experince ids, then find index of params id to be removed 
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        //Remove index experience from array 
        profile.experience.splice(removeIndex, 1);        
        //Save updated profile instance to db 
        await profile.save()
        //Send response that user has been deleted 
        return res.json(profile)
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error')
    }
})

module.exports = router; 