const crypto=require('crypto');
const User=require('../models/user');
const bcrypt=require('bcryptjs');
const nodemailer=require('nodemailer');
const sendgridTransport=require('nodemailer-sendgrid-transport');
const {validationResult}=require('express-validator/check');

const transport=nodemailer.createTransport(sendgridTransport({
  auth:{
    api_key:"api_key"
  }
}));

exports.getLogin = (req, res, next) => {
  let message=req.flash('error');
  if(message.length>0){
    message=message[0];
  }
  else{
    message=null;
  }
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/auth/login',
    errorMessage:message,
    oldInput:{email:"",password:""}
  });
};

exports.postLogin = (req, res, next) => {
  const email=req.body.email;
  const password=req.body.password;
  const errors=validationResult(req);
  if(!errors.isEmpty()){
    return res.status(422).render('auth/login', {
      pageTitle: 'Login',
      path: '/auth/login',
      errorMessage:errors.array()[0].msg,
      oldInput:{email:email,password:password}
    });
  }
  User.findOne({email:email})
    .then(user=>{
            req.session.user=user;
            req.session.isLoggedIn=true;
            return req.session.save((err)=>{
              res.redirect('/');
            })
    })
    .catch(err=>{
        res.redirect('/login');
    });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    pageTitle: 'Sign up',
    path: '/auth/signup',
    errorMessage:null,
    oldInput:{
      email:"",
      password:"",
      confirmPassword:""
    }
  });
};

exports.postSignup=(req,res,next)=>{
  const email=req.body.email;
  const password=req.body.password;
  const confirmPassword=req.body.confirmPassword;
  const errors=validationResult(req);
  console.log(errors.array());
  if(!errors.isEmpty()){
    return res.status(422).render('auth/signup', {
      pageTitle: 'Sign up',
      path: '/auth/signup',
      errorMessage:errors.array()[0].msg,
      oldInput:{email:email,password:password,confirmPassword:req.body.confirmPassword}
    });
  }
  User
    .findOne({email:email})
    .then(userDoc=>{
      if(userDoc){
        return res.redirect('/signup');
      }
        return bcrypt
          .hash(password,12)
          .then(hashedPassword=>{
            const user=new User({
              email:email,
              password:hashedPassword,
              cart:{items:[]}
            })
            return user.save();
          })
          .then(result=>{
            res.redirect('/login');
            transport.sendMail({
              to:email,
              from:'dineshhardasani2000@gmail.com',
              subject:'Signup Successded',
              html:'<h1>You successfully signed up!</h1>'
            });
          })
          .catch(err=>{
            console.log(err);
          })
      })
    .catch(err=>{
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err=>{
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset=(req,res,next)=>{
  let message=req.flash('error');
  if(message.length>0){
    message=message[0];
  }
  else{
    message=null;
  }
  res.render('auth/reset',{
    path:'/reset',
    pageTitle:'Reset Password',
    errorMessage:message
  });
};

exports.postReset=(req,res,next)=>{
  crypto.randomBytes(32,(err,buffer)=>{
    if(err){
      return res.redirect('/reset');
    }
    const token=buffer.toString('hex');
    User.findOne({email:req.body.email})
        .then(user=>{
          if(!user){
            req.flash('error','No account with that email found');
            return res.redirect('/reset');
          }
          user.resetToken=token;
          user.resetTokenExpiration=Date.now()+3600000;
          return user.save();
        })
        .then(result=>{
          res.redirect('/');
          return transport.sendMail({
            to:req.body.email,
            from:'dineshhardasani2000@gmail.com',
            subject:'Reset Password',
            html:`
              <p>You requested a password reset</p>
              <p>Click this <a href="http://localhost:3000/reset/${token}">link</a>to set a new password</p>
            `
          });
        })
        .catch(err=>{
          console.log(err);
        })
  })
};

exports.getNewPassword=(req,res,next)=>{
  const token=req.params.token;
  User.findOne({resetToken:token,resetTokenExpiration:{$gt:Date.now()}})
    .then(user=>{
      let message=req.flash('error');
      if(message.length>0){
        message=message[0];
      }
      else{
        message=null;
      }
      res.render('auth/new-password',{
        path:'/new-password',
        pageTitle:'New Password',
        errorMessage:message,
        userId:user._id.toString(),
        token:token
      });
    })
    .catch(err=>{
      console.log(err);
    });
};

exports.postNewPassword=(req,res,next)=>{
  let resetUser;
  User.findOne({resetToken:req.body.token,resetTokenExpiration:{$gt:Date.now()},_id:req.body.userId})
      .then(user=>{
         if(!user){
           return res.redirect('/');
         }
         user.resetToken=undefined;
         user.resetTokenExpiration=undefined;
         resetUser=user;
         hashedPassword=bcrypt.hash(req.body.password,12);
         return hashedPassword;
      })
      .then(hashedPassword=>{
        resetUser.password=hashedPassword;
        return resetUser.save();
      })
      .then(result=>{
        return res.redirect('/login');
      })
      .catch(err=>{
        console.log(err);
      });
};
