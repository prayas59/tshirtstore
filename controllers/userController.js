const User = require('../models/user');
const BigPromise = require('../middlewares/bigPromise');
const CustomError = require('../utils/customError');
const cookieToken = require('../utils/cookieToken');
const cloudinary = require('cloudinary');
const mailHelper = require('../utils/emailHelper');
const crypto = require('crypto');

exports.signup = BigPromise(async (req, res, next) => {
    
    if(!req.files){
        return next(new CustomError("photo is required for signup", 400));
    };

    const  {name, email, password} = req.body;
    if(!email || !name || !password){
        return next(new CustomError('Name, Email, Password are Required', 400));
    }
    let file = req.files.photo;
    const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
        folder: "users",
        width: 150,
        crop: "scale"
    });

    const user = await User.create({
        name,
        email,
        password,
        photo: {
            id: result.public_id,
            secure_url: result.secure_url
        }
    });

    cookieToken(user, res);
});

exports.login = BigPromise(async(req, res, next) => {
    const{email, password} = req.body;
    // check presence of email and password 
    if(!email || !password){
        return next(new CustomError('Please Provide Email & Password', 400));
    }
    // Getting user from Database
   const user = await User.findOne({email}).select("+password");
   // if user not found in Database
   if(!user)
   {
    return next(new CustomError('Email or Password is Incorrect', 400));
   }

   // Match the Password
   const isPasswordCorrect = await user.isValidatedPassword(password);
   // If Password doesn't Match
   if(!isPasswordCorrect)
   {
    return next(new CustomError('Email or Password is Incorrect', 400));
   }
   // If all good and we send the token
   cookieToken(user, res);
});


exports.logout = BigPromise(async(req, res, next) => {

   res.cookie('token',null,{

    expires: new Date(Date.now()),
    httpOnly: true,

   });
   res.status(200).json({
    success: true,
    message: "Logout Success",
   })
});

exports.forgotPassword = BigPromise(async(req, res, next) => {
    const {email} = req.body;

    const user = await User.findOne({email});

    if(!user)
   {
    return next(new CustomError('Email or Password is Incorrect', 400));
   }

    const forgotToken = user.getForgotPasswordToken();

    await user.save({validateBeforeSave: false});

    const myURL = `${req.protocol}://${req.get("host")}/password/reset/${forgotToken}` 

    const message = `Copy paste this link in your URL and hit enter \n\n ${myURL}`

    try {
        await mailHelper({
            email: user.email,
            subject: "Password Reset Email ",
            message,
        })
        res.status(200).json({
            success: true,
            message: "Email Sent",
           })
    } catch (error) {
        user.forgotPasswordToken = undefined
        user.forgotPasswordExpiry = undefined
        await user.save({validateBeforeSave: false});

        return next(new CustomError(error.message, 500));
    }
 });


exports.passwordReset = BigPromise(async(req, res, next) => {
    const token = req.params.token;

    const encryToken =crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        encryToken,
        forgotPasswordExpiry: {$gt: Date.now()}
    })

    if(!user)
    {
     return next(new CustomError('Token is Invalid or Expired', 400));
    }

    if(req.body.password != req.body.confirmPassword){
     return next(new CustomError('Password and Confirm Password Do not match', 400));
    }

    user.password = req.body.password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save();

    // Send json response or send token
   cookieToken(user, res);

 });


exports.getLoggedInUserDetails = BigPromise(async(req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success:true,
        user,
    })
 });


exports.changePassword = BigPromise(async(req, res, next) => {

    const userId = req.user.id;

    const user = await User.findById(userId).select("+password");

    const isCorrectOldPassword = await user.isValidatedPassword(req.body.oldPassword);
    
    if (!isCorrectOldPassword) {
        return next(new CustomError("Old Password Is Incorrect", 400));
    }
   
    if(req.body.password != req.body.confirmPassword){
        return next(new CustomError('Password and Confirm Password Do not match', 400));
       }
   
       user.password = req.body.password;

       await user.save();

       // Send json response or send token
       cookieToken(user, res);
 });


exports.updateUserDetails = BigPromise(async(req, res, next) => {
    const newData = {
        name: req.body.name,
        email: req.body.email,

    };
    if(req.files){
        const user = await User.findById(req.user.id);

        const imageId = user.photo.id;

        //delete photo on cloudinary
        const resp = await cloudinary.v2.uploader.destroy(imageId);

        // upload new photo
        const result = await cloudinary.v2.uploader.upload(req.files.photo.tempFilePath, {
            folder: "users",
            width: 150,
            crop: "scale"
        });

        newData.photo ={
            id: result.public_id,
            secure_url: result.secure_url,
        }

    }
    const user = await User.findByIdAndUpdate(req.user.id, newData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,

    });
    
    res.status(200).json({
        success: true,
        user,
    })

    
 });

exports.adminAllUser = BigPromise(async(req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success:true,
        users,
    })
 });

exports.admingetOneUser = BigPromise(async(req, res, next) => {
    const user = await User.findById(req.params.id);
    if(!user)
   {
     next(new CustomError('user not found', 400));
   }
    res.status(200).json({
        success:true,
        user,
    });
 });


 exports.adminUpdateOneUserDetails = BigPromise(async(req, res, next) => {
    const newData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    };
  
    const user = await User.findByIdAndUpdate(req.params.id, newData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,

    });
    
    res.status(200).json({
        success: true,
        user,
    })

    
 });

 exports.adminDeleteOneUser = BigPromise(async(req, res, next) => {

    const user =  await User.findById(req.params.id);

    if(!user)
   {
     
    return next(new CustomError('user not found', 401));
   }

   const imageId = user.photo.id;
   await cloudinary.v2.uploader.destroy(imageId);

   await user.remove();

   res.status(200).json({
    success: true,
   })
 });


exports.managerAllUser = BigPromise(async(req, res, next) => {
    const users = await User.find({role: 'user'});
    res.status(200).json({
        success:true,
        users,
    })
 });