const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');

//Import Schemas
const User = require('../../models/User');

//@route   POST api/users
//@desc    Register a user
//@access  Public
router.post('/', async (req, res) => {
    try {
        const {
            name,
            email,
            password,
        } = req.body;
        let user = await User.findOne({email: email});
        if(user){
            return res.status(400).json({errors: ({msg: 'User already exists' })})
        }

        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        });

            user = new User({
                name,
                email,
                password,
                avatar,
            })
            await user.save()
            res.send(user) 
        
        ;
    } catch (error) {
        console.error(error.message);
        return res.status(500).json("server error")
    }
})

module.exports = router; 