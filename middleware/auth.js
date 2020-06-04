const jwt = require('jsonwebtoken');
const config = require('config')

//Define auth function and export together  
module.exports = function (req, res, next) {
    //Extract the token from the defined header that has been passed through from the CS 
    const token = req.header('x-auth-token');

    //Check if there is no token in the header 
    if(!token) {
        //401 not authorized 
        return res.status(401).json({msg: "No token, authorization denied"})
    }



}