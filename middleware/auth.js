const jwt = require('jsonwebtoken');
const config = require('config')

//Define and export Middleware function for json authentication   
module.exports = function (req, res, next) {
    //Extract the token from the defined header that has been passed through from the CS 
    const token = req.header('x-auth-token');

    //Check if there is no token in the header 
    if(!token) {
        //401 not authorized 
        return res.status(401).json({msg: "No token, authorization denied"})
    }

    //Verify the token received in the header when unsigned is the same token 
    try {
        //Decode the token using .verify('token from header', 'secret string')
        // and define a variable to hold the payload object 
        const decoded = jwt.verify(token, config.get('jwtToken'));
        
        //If the token is not valid, an error will be caught

        //If token is valid, the payload of the user ID is assigned to a property of req.'property'
        //This will then be available for use in any protected route 
        req.user = decoded.user;
        //Call next at end of every middleware
        next();

    } catch (error) {
        //401 not authorized 
        res.status(401).json({msg: "Token not verified, authorization denied"})
    }

}