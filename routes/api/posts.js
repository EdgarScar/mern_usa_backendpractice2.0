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

//@route   GET api/posts
//@desc    Get all posts  
//@access  private 
router.get('/', auth, async (req, res) => {
    //All db queries wrapped in try/catch block 
    try {
        //Retrieve all posts from the db
        //  use .sort with date: -1 to order posts from newest to oldest 
        let posts = await Post.find().sort({ date: -1 });
        //If no posts are found 
        if(!posts){
            //404 no found 
            return res.status(404).json({msg: "No posts"})
        }
        //Send response with all posts 
        res.json(posts)
    } catch (error) {
        console.error(error.message);
        //500 internal server error 
        res.status(500).json("Server error")
    }
})

//@route   GET api/posts/:id
//@desc    Get post by ID
//@access  private 
router.get('/:id', auth, async (req, res) => {
    //All db queries wrapped in try/catch block 
    try {
        //Retrieve post using ID from the db
        let post = await Post.findById(req.params.id)
        //If no post found with that id
        if(!post){
            //404 no found 
            return res.status(404).json({msg: "No post found"})
        }
        //Send response with post
        res.json(post)
    } catch (error) {
        console.error(error.message);
        //If the format of the id is invalid, return error of no post 
        if(error.kind === 'ObjectId'){
            return res.status(404).json({msg: "No post found"})}
        //500 internal server error 
        res.status(500).json("Server error")
    }
})

//@route   DELETE api/posts/:id
//@desc    Delete post by ID
//@access  private 
router.delete('/:id', auth, async (req, res) => {
    //All db queries wrapped in try/catch block 
    try {
        //Retrieve and delete post from the db using ID
        let post = await Post.findById(req.params.id);
        //If post does not exist, kill and send response 
        if(!post){
            return res.status(404).json({msg: "No post found"})}
        //Check if current user owns the post 
        if(post.user.toString() !== req.user.id){
            //If user does not own post, kill and send unauthorized status 
            //401 not authorized
            return res.status(401).json({msg: "User not authorized"})
        }
        //Remove post if owned the current user
        await post.remove()
        //Send response message 
        res.send({msg: "Post removed"})
    } catch (error) {
        console.error(error.message);
         //If the format of the id is invalid, return error of no post 
         if(error.kind === 'ObjectId'){
            return res.status(404).json({msg: "No post found"})}
        //500 internal server error 
        res.status(500).json("Server error")
    }
})

//@route   PUT api/posts/like/:id
//@desc    Like a post 
//@access  Private 
router.put('/like/:id', auth, async (req, res) => {
    //All queries to the db are wrapped in a try/catch block 
    try {
        //Retrieve the post on which to add the like  
        const post = await Post.findById(req.params.id);
        //Check if the post is already liked by the current user 
        //Each post has a likes array, filtered to only include likes by attached user, to see if like exists 
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0){
            //If post already liked (array is greater than 0), kill and send response 
            //400 bad request 
            return res.status(400).json({ msg: "Post already liked" })
        }
        //If post is not already liked, unshift to add user ID to beginning of likes array
        post.likes.unshift({ user: req.user.id });
        //Save post with updated like to db 
        await post.save();
        //Send response with the liked post 
        res.json(post);
    } catch (error) {
        console.error(error.message);
        //500 internal server error 
        res.status(500).send("server error")
    }
})

//@route   PUT api/posts/unlike/:id
//@desc    Unlike a post 
//@access  Private 
router.put('/unlike/:id', auth, async (req, res) => {
    //All queries to the db are wrapped in a try/catch block 
    try {
        //Retrieve the post on which to remove like  
        const post = await Post.findById(req.params.id);
        //Check if the post is already liked by the current user 
        //Each post has a likes array, filtered to only include likes by attached user, to see if like exists 
        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0){
            //If post already liked (array is greater than 0), kill and send response 
            //400 bad request 
            return res.status(400).json({ msg: "Post not yet liked" })
        }
        //If post is liked, splice to remove user ID like in likes array
        //Get remove index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
        //Remove like using removeIndex
        post.likes.splice(removeIndex, 1);

        //Save post with updated unlike to db 
        await post.save();
        //Send response with the liked post 
        res.json(post);
    } catch (error) {
        console.error(error.message);
        //500 internal server error 
        res.status(500).send("server error")
    }
})

//@route   POST api/posts/comment/:id
//@desc    Comment on a post  
//@access  Private
router.post(
    '/comment/:id', 
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

            //Find and retrieve post on which to comment from db
            const post = await Post.findById(req.params.id);
            //If no post by ID, kill and send response 
            if(!post){
            return res.status(404).json({msg: "No post found"})}

            //Create a new comment object
            // it only attaches to the post, so is not saved directly to the db 
            const newComment = {
                text: req.body.text, //user input
                name: user.name,     //db 
                avatar: user.avatar, //db
                user: req.user.id    //jwt 
            };
            //Add the comment in to the comments array in the post object 
            // .unshift() adds the comment to the beginning of the array 
            post.comments.unshift(newComment)
            //Save post with added comment into the db 
            await post.save()
            //Send response of post comments 
            res.json(post.comments);
        } catch (error) {
            console.error(error.message);
            //If the format of the id is invalid, return error of no post 
            if(error.kind === 'ObjectId'){
                return res.status(404).json({msg: "No post found"})}
            //500 internal server error 
            res.status(500).json("server error")
        }
})


//@route   DELETE api/posts/comment/:id/:comment_id
//@desc    Delete comment by ID from post
//@access  private 
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    //All db queries wrapped in try/catch block 
    try {
        //Retrieve post from the db using ID
        let post = await Post.findById(req.params.id);
        //If post does not exist, kill and send response 
        if(!post){
            return res.status(404).json({msg: "No post found"})}
        //Find comment to delete 
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);
        //If comment does not exist
        if(!comment){
            //If user does not own post, kill and send unauthorized status 
            //404 content not found
            return res.status(404).json({msg: "Comment does not exist"})
        }
        //Check user owns the comment 
        if(comment.user.toString() !== req.user.id){
            //401 not authorised 
            return res.status(401).json({msg: "User not authorized"})
        }
        //Find the index of the comment remove from the comments array in the post 
        //Get remove index
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
        //Remove comment using removeIndex
        post.comments.splice(removeIndex, 1);

        //Save post with removed comment 
        await post.save()
        //Send response message 
        res.send({msg: "Comment removed"})
    } catch (error) {
        console.error(error.message);
         //If the format of the id is invalid, return error of no post 
         if(error.kind === 'ObjectId'){
            return res.status(404).json({msg: "No post found"})}
        //500 internal server error 
        res.status(500).json("Server error")
    }
})

module.exports = router; 