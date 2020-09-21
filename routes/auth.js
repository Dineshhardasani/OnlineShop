const path = require('path');

const express = require('express');
const { check,body }=require('express-validator/check');

const authController=require('../controllers/auth');

const router = express.Router();

const User=require('../models/user');

const bcrypt=require('bcryptjs');

router.get('/login',authController.getLogin);

router.post(
  '/login',
  [
    body('email').custom((value,{req})=>{
      return User.findOne({email:value})
        .then(user=>{
          console.log(user);
          if(!user){
            return Promise.reject('Email or password is not correct!');
          }
          return bcrypt.compare(req.body.password,user.password)
            .then(doMatch=>{
              if(!doMatch){
                return Promise.reject('Email or password is not correct!');
              }
            });
        })
      }),
  ],
  authController.postLogin);

router.get('/logout',authController.getLogout);

router.get('/signup',authController.getSignup);

router.post(
  '/signup',
  [
    check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .normalizeEmail(),
    body('password','please enter valid password! if problem persist contact to admin dineshhardasani2000@gamil.com!')
        .isLength({min:5})
        .isAlphanumeric()
        .trim(),
    body('confirmPassword')
      .trim()
      .custom((value,{req})=>{
      if(value !== req.body.password){
        throw new Error('Passwords are not match');
      }
      return true;
    }),
  ],
  authController.postSignup);

router.get('/reset',authController.getReset);

router.post('/reset',authController.postReset);

router.get('/reset/:token',authController.getNewPassword);

router.post('/newPassword',authController.postNewPassword);

module.exports=router;
