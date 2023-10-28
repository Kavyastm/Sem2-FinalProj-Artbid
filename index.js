// Import required modules and configure the server
const express = require('express'); // Import the Express.js framework
const path = require('path'); // Import the 'path' module for working with file paths
const mongoose = require('mongoose'); // Import Mongoose for MongoDB interactions
const { check, validationResult } = require('express-validator'); // Import validation utilities from Express
// const fileUpload = require('express-fileupload'); // Import middleware for handling file uploads
const session = require('express-session') 
const multer  = require('multer')
const myApp = express(); // Create an Express application instance
// const upload = multer({ dest: 'uploads/' });
var moment = require('moment-timezone');
// const bodyParser = require('body-parser');
// myApp.use(bodyParser.json());
const flash = require('connect-flash'); 
const nodemailer = require("nodemailer");
let mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "artbid2k23@gmail.com", // Art@Bid#123
    pass: "nyzr waoi zsoz atis",
  }
});

var cron = require('node-cron');


var fs = require("fs");
const ObjectId = mongoose.Types.ObjectId;
myApp.use(flash()); 
const upload = require('./upload');
// myApp.use(fileUpload()); // Use the fileUpload middleware to handle file uploads
myApp.use(express.urlencoded({ extended: false })); // Parse URL-encoded request bodies
myApp.use(express.json()); // Parse JSON request bodies
myApp.set('views', path.join(__dirname, 'views')); // Set the views directory for EJS templates
myApp.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory
myApp.set('view engine', 'ejs'); // Set the view engine to EJS for rendering templates
mongoose.connect('mongodb://127.0.0.1:27017/artbid'); // Connect to the MongoDB database at the specified URI

// Define a MongoDB model for user registration
const userSchema = new mongoose.Schema({
  name: String,
  userName: String,
  dob: Date,
  email: String,
  password: String,
  securityQuestion: String,
  securityAnswer: String,
  profile_image: String,
  about: String,
});

const advertisementSchema = new mongoose.Schema({
  title: String,
  image: String,
  user_id : {
		type: mongoose.Schema.Types.ObjectId, 
		required : true, 
		ref: 'users',
	},
});
const artSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  min_bid: String,
  start_date: String,
  end_date: String,
  last_bid: String,

  user_id : {
		type: mongoose.Schema.Types.ObjectId, 
		required : true, 
		ref: 'users',
	},
  last_bidder_id : {
		type: mongoose.Schema.Types.ObjectId, 
		required : false, 
		ref: 'users',
	},
  buyer_id: String,
  start_time :{
		type: String, 
		default:'00:00'
	},
	end_time :{
		type: String, 
		default:'00:00'
	},
  status: {
		type: String,
		enum: ["active","completed","expired","deleted","inprogress"],
		default: "active"
	},

  is_payment_done: {
		type: String,
		enum: ["yes","no"],
		default: "no"
	},
});
const commentSchema = new mongoose.Schema({
  comment: String,
  user_id : {
		type: mongoose.Schema.Types.ObjectId, 
		required : true, 
		ref: 'users',
	},
  art_id : {
		type: mongoose.Schema.Types.ObjectId, 
		required : true, 
		ref: 'arts',
	},
},
{timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

const bidHistorySchema = new mongoose.Schema({
  bid_amount: String,
  user_id : {
		type: mongoose.Schema.Types.ObjectId, 
		required : true, 
		ref: 'users',
	},
  art_id : {
		type: mongoose.Schema.Types.ObjectId, 
		required : true, 
		ref: 'arts',
	},
},
{timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

const cartSchema = new mongoose.Schema({
  user_id : {
		type: mongoose.Schema.Types.ObjectId, 
		required : true, 
		ref: 'users',
	},
  art_id : {
		type: mongoose.Schema.Types.ObjectId, 
		required : true, 
		ref: 'arts',
	},
  status: {
		type: String,
		enum: ["active","completed"],
		default: "active"
	},
},
{timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});
const User = mongoose.model('User', userSchema);
const Art = mongoose.model('Art', artSchema);
const Comment = mongoose.model('Comment', commentSchema);
const BiddingHistory = mongoose.model('BiddingHistory', bidHistorySchema);
const Cart = mongoose.model('Cart', cartSchema);
const Advertisement = mongoose.model('Advertisement', advertisementSchema);


myApp.use(session({ 
  
  // It holds the secret key for session 
  secret: 'Your_Secret_Key', 

  // Forces the session to be saved 
  // back to the session store 
  resave: true, 

  // Forces a session that is "uninitialized" 
  // to be saved to the store 
  saveUninitialized: true
})) 
myApp.get('/', (req, res) => {
  if(req.session.user_id){
    return res.redirect('/welcome');

  }else{
    res.render('login', { errors: [] });
  }
});




myApp.post('/get-all-comments', async (req, res) => {
  var where = [{art_id: new mongoose.Types.ObjectId(req.body.id)}];
  const aggregatorOptsCom = [
    {
      $match : { $and : where }
    },
    {
      $lookup:
        {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData'
        }
    },
]

  var comment = await Comment.aggregate(aggregatorOptsCom).exec();

  console.log('comment',comment,req.session.user_id);
  
//   var where = [
//     {status:{$in:['active','completed','inprogress']}},
//     {user_id: new mongoose.Types.ObjectId(req.session.user_id)},
// ]
//   const aggregatorOpts = [
//     {
//       $match : { $and : where }
//     },
//     {
//       $lookup:
//         {
//           from: 'users',
//           localField: 'user_id',
//           foreignField: '_id',
//           as: 'userData'
//         }
//     }
// ]

//   var art = await Art.aggregate(aggregatorOpts).exec();
  if(req.session.user_id){

    var response = res.render('comment', { errors:[],success: [],comment: [{comment: comment}] });
    res.json(response)
    // return res.render('comment', { errors:[],success: [],comment: [{comment: comment}] });


  }else{
    return res.redirect('/login');
  }
});
myApp.get('/welcome', async (req, res) => {
  // req.session.user_id = req.session.user_id;
  // req.session.userName = 'ss';
  var where = [
    // {status:'inprogress'},
    {status:{$nin:['deleted','completed']}},
    {start_date:{$lte: moment(new Date()).format('YYYY-MM-DD')}},
    {end_date:{$gte: moment(new Date()).format('YYYY-MM-DD')}},
    // {start_time:{$lte: moment(new Date()).format('HH:mm:00')}},
    // {end_time:{$gte: moment(new Date()).format('HH:mm:59')}},
]
  const aggregatorOpts = [
    {
      $match : { $and : where }
    },
    {
      $lookup:
        {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData'
        }
    },
    // {
    //   $lookup:
    //     {
    //       from: 'comments',
    //       localField: '_id',
    //       foreignField: 'art_id',
    //       as: 'commentData'
    //     },
        
    //     pipeline: [
    //       [{
    //         $lookup:
    //           {
    //             from: 'users',
    //             localField: 'user_id',
    //             foreignField: '_id',
    //             as: 'commentUserData'
    //           },
              
    //       }],
    //       { $unwind: "$users" },
    //     ],
        
    // }
]

  var art = await Art.aggregate(aggregatorOpts).exec();

  // console.log('art',art,req.session.user_id);
  
  if(req.session.user_id){
    return res.render('home', { errors:[],success: [],art: [{art: art}],comment: [],moment: moment });

  }else{
    return res.redirect('/login');
  }
});

myApp.get('/art-detail/:art_id', async (req, res) => {
  // req.session.user_id = req.session.user_id;
  // req.session.userName = 'ss';
  var where = [
    {_id : new mongoose.Types.ObjectId(req.params.art_id)},
    
]

var where1 = [
  {art_id : new mongoose.Types.ObjectId(req.params.art_id)},
  
]

var where3 = [
  {user_id : new mongoose.Types.ObjectId(req.session.user_id)},
  {art_id : new mongoose.Types.ObjectId(req.params.art_id)},
  {status:"active"}

  
]


  const aggregatorOpts = [
    {
      $match : { $and : where }
    },
    {
      $lookup:
        {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData'
        }
    }
]

const aggregatorOpts1 = [
  {
    $match : { $and : where1 }
  },
  {
    $lookup:
      {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'userData'
      }
      
  },
  {
    $lookup:
      {
        from: 'arts',
        localField: 'art_id',
        foreignField: '_id',
        as: 'artData'
      },
      
  }
]

const aggregatorOpts2 = [
  {
    $match : { $and : where3 }
  },
  {
    $lookup:
      {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'userData'
      }
      
  },
  {
    $lookup:
      {
        from: 'arts',
        localField: 'art_id',
        foreignField: '_id',
        as: 'artData'
      },
      
  }
]

  var art = await Art.aggregate(aggregatorOpts).exec();


  var biddingHistory = await BiddingHistory.aggregate(aggregatorOpts1).exec();

  var cart = await Cart.aggregate(aggregatorOpts2).sort({ _id: -1 }).limit(1).exec();

  // console.log(cart);
  
  if(req.session.user_id){
    return res.render('art-detail', { errors:req.flash('error_message'),success: req.flash('success_message'),logged_in_id:req.session.user_id,cart:cart ,art: [{art: art}],biddingHistory: [{biddingHistory: biddingHistory}] });

  }else{
    return res.redirect('/login');
  }
});
myApp.post('/post-comment', async (req, res) => {
  // console.log(req.body)
  const user = await User.findOne({ _id: req.session.user_id}).exec();
  if (!user) {
    return res.redirect('/login');
    // return res.render('profile', { errors: [{ msg: 'User not found.' }],success: [],user: [{user: user}] });
  }
  if (!req.body.comment) {
    // return next(msg);
    return res.render('profile', { errors: [{ msg: 'Comment is reqired.' }],success: [],user: [{user: user}] });
  }else{
    const newComment = new Comment({
      comment: req.body.comment,
      art_id: req.body.id,
      user_id: req.session.user_id,
    });
    // console.log(newComment,req.body,'dgf')
    newComment.save().then(() => {
      return res.redirect('/welcome');
    }).catch((err) => {
      console.error('Error saving user:', err);
      return res.redirect('/welcome');
    });
  }
  
});

myApp.post('/submit-bid', async (req, res) => {
  // console.log(req.body)
  const user = await User.findOne({ _id: req.session.user_id}).exec();
  if (!user) {
    return res.redirect('/login');
    // return res.render('profile', { errors: [{ msg: 'User not found.' }],success: [],user: [{user: user}] });
  }
    const newComment = new BiddingHistory({
      bid_amount: req.body.bid_amount,
      art_id: req.body.id,
      user_id: req.session.user_id,
    });

    newComment.save().then(async () => {
      const art = await Art.findOne({ _id: new mongoose.Types.ObjectId(req.body.id)}).exec();


      art.last_bid = req.body.bid_amount;
      art.last_bidder_id = req.session.user_id;

      await art.save().then(async () => {
      const artistData = await User.findOne({ _id: new mongoose.Types.ObjectId(art.user_id)}).exec();

        let mailDetails = {
          // from: 'n23goswami+1@gmail.com',
          // to: 'n23goswami+2@gmail.com',
          to: artistData.email,
          subject: 'Latest Bid',

          
 
    	// '<style type="text/css">@media only screen and (max-device-width: 768px) {.responsive_table { background-color:#e6e6fa; height:100%; width:100%;}}@media only screen and (min-device-width: 769px) {.responsive_table { background-color:#e6e6fa; height:100%; width:50%;}}</style><!--[if (gte mso 9)|(IE)]><table width="400" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><tr><td><tr><td><p><p><![endif]-->	<table align="center" border="0" cellpadding="5" cellspacing="0" class="responsive_table"><tbody><tr><td width="350" style="background-color:#ffffff; text-align:center; vertical-align:middle;"><hr /></td></tr><tr><td style="background-color:#ffffff; text-align:center"><h1 style="text-align:left"><strong><strong>Hi ' + artistData.userName + ',</strong></strong></h1><p style="text-align:left"><strong>:</strong>  Latest bid for your art <b>'+ req.body.art_title + '</b> is <b>$'+ req.body.bid_amount + '</b> by <b>' + req.session.userName + '</b></p><p style="text-align:left">&nbsp;</p><p style="text-align:left">Thank you.</p><p style="text-align:left">Cheers,<br />EL Connect&nbsp;Team</p><hr /></td></tr></tbody></table></p> </p></tr></table>'
  
          html: '<style type="text/css">@media only screen and (max-device-width: 768px) {.responsive_table { background-color:#e6e6fa; height:100%; width:100%;}}@media only screen and (min-device-width: 769px) {.responsive_table { background-color:#e6e6fa; height:100%; width:50%;}}</style><!--[if (gte mso 9)|(IE)]><table width="400" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><tr><td><tr><td><p><p><![endif]-->	<table align="center" border="0" cellpadding="5" cellspacing="0" class="responsive_table"><tbody><tr><td width="350" style="background-color:#ffffff; text-align:center; vertical-align:middle;"><hr /></td></tr><tr><td style="background-color:#ffffff; text-align:center"><h1 style="text-align:left"><strong><strong>Hi ' + artistData.userName + ',</strong></strong></h1><p style="text-align:left"><strong></strong>  Latest bid for your art <b>'+ req.body.art_title + '</b> is <b>$'+ req.body.bid_amount + '</b> by <b>' + req.session.userName + '</b></p><p style="text-align:left">&nbsp;</p><p style="text-align:left">Thank you.</p><p style="text-align:left">Cheers,<br />Art Bid&nbsp;Team</p><hr /></td></tr></tbody></table></p> </p></tr></table>'

        };
        if(artistData.email){
          mailTransporter.sendMail(mailDetails, function(err, data) {
            if(err) {
                console.log('Error Occurs',err);
            } else {
                console.log('Email sent successfully',artistData.email);
            }
          });
        }
        req.flash('success_message', 'Bid submitted successfully.'); 
        return res.redirect('/art-detail/'+req.body.id);
      })
      
    }).catch((err) => {
      // console.error('Error saving user:', err);
      req.flash('error_message', 'Error saving bid.'); 
      return res.redirect('/art-detail/'+req.body.id);
    });
});
myApp.get('/login', (req, res) => {
  if(req.session.user_id){
   return res.redirect('/welcome');
  }else{
    res.render('login', { errors: [] });
  }
});

myApp.get('/cart', async (req, res) => {

  var where = [
    
    {user_id: new mongoose.Types.ObjectId(req.session.user_id)},
    {status:"active"}
    // {start_date:{$lte: moment(new Date()).format('YYYY-MM-DD')}},
    // {end_date:{$gte: moment(new Date()).format('YYYY-MM-DD')}},
    // {start_time:{$lte: moment(new Date()).format('HH:mm:00')}},
    // {end_time:{$gte: moment(new Date()).format('HH:mm:59')}},
]
  const aggregatorOpts = [
    {
      $match : { $and : where }
    },
    {
      $lookup:
        {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData'
        }
        
    },
    {
      $lookup:
        {
          from: 'arts',
          localField: 'art_id',
          foreignField: '_id',
          as: 'artData'
        },
        
    }
]

  var cart = await Cart.aggregate(aggregatorOpts).exec();

  var cartItemsCount = cart.length
  var total = 0;

  cart.forEach(product => {
    total = parseInt(total) + parseInt(product.artData[0].last_bid);
  })
  if(req.session.user_id){
    res.render('cart', { success: req.flash('success_message'),errors: req.flash('error_message') ,cart: [{cart: cart}], cartLength : cartItemsCount, total : total });
  }else{
    return res.redirect('/login');
  }
});

myApp.get('/history/:art_id', async (req, res) => {

  var where = [
    
    {art_id: new mongoose.Types.ObjectId(req.params.art_id)},
    // {start_date:{$lte: moment(new Date()).format('YYYY-MM-DD')}},
    // {end_date:{$gte: moment(new Date()).format('YYYY-MM-DD')}},
    // {start_time:{$lte: moment(new Date()).format('HH:mm:00')}},
    // {end_time:{$gte: moment(new Date()).format('HH:mm:59')}},
]
  const aggregatorOpts = [
    {
      $match : { $and : where }
    },
    {
      $lookup:
        {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData'
        }
        
    },
    {
      $lookup:
        {
          from: 'arts',
          localField: 'art_id',
          foreignField: '_id',
          as: 'artData'
        },
        
    }
]

  var BiddingHistory = await BiddingHistory.aggregate(aggregatorOpts).exec();

  
  if(req.session.user_id){
    res.render('biddingHistory', { errors: [] ,BiddingHistory: [{BiddingHistory: BiddingHistory}] });
  }else{
    return res.redirect('/login');
  }
});

const bcrypt = require('bcrypt');
const e = require('express');

myApp.post('/login', [
  check('userName').notEmpty().withMessage('Username is required.'),
  check('password').notEmpty().withMessage('Password is required.'),
], async (req, res) => {
  // console.log("dd",req.body)
  const errors = validationResult(req).array();

  if (errors.length > 0) {
    return res.render('login', { errors });
  }

  const { userName, password } = req.body;

  // Query the database to find a user with the given email
  async function loginUser() {
    try {
      const user = await User.findOne({ userName: userName }).exec();

      if (!user) {
        return res.render('login', { errors: [{ msg: 'User not found. Please register.' }] });
      }

      // Use bcrypt.compare to compare the entered password with the hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.render('login', { errors: [{ msg: 'Incorrect password. Please try again.' }] });
      }
      req.session.user_id = user._id;
      req.session.userName = user.userName;
      req.session.email = user.email;

      // console.log(user);

      // User exists and password matches, you can consider the user authenticated
      return res.redirect('/welcome');
    } catch (err) {
      console.error('Error querying the database:', err);
      return res.render('login', { errors: [{ msg: 'An error occurred. Please try again later.' }] });
    }
  }

  loginUser();
});


myApp.get('/register', (req, res) => {
  return res.render('register', { errors: [], submitted: false });
});

//const bcrypt = require('bcrypt');

myApp.post('/register', [
  check('userName'),
  check('securityQuestion'),
  check('securityAnswer'),
  check('email'),
  check('confirmemail')
    .custom((value, { req }) => {
      if (value !== req.body.email) {
        throw new Error('Confirm Email must match the Email field');
      }
      return true;
    }),
  check('password'),
  check('confirmpassword').notEmpty().withMessage('.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Confirm Password must match the Password field');
      }
      return true;
    }),
], async (req, res) => {
  const { userName,securityQuestion,securityAnswer, email, password, confirmpassword } = req.body;
  const errors = validationResult(req).array();

  if (errors.length === 0) {
    try {
      
      if (password !== confirmpassword) {
        // Password and confirm password do not match
        return res.render('register', { errors: [{ msg: 'Password and Confirm Password do not match.' }], submitted: true });
      }
      // Hash the password before saving it
      const hashedPassword = await bcrypt.hash(password, 10);
      User.findOne({userName: userName}).then(function(result){
        if(result!=null){
          return res.render('register', { errors: [{ msg: 'Username already exist.' }], submitted: true });
        }
        User.findOne({email: email}).then(function(resultEmail){
          if(resultEmail!=null){
            return res.render('register', { errors: [{ msg: 'Email already exist.' }], submitted: true });
          }
        // Create a new user
          const newUser = new User({
            userName: userName,
            securityQuestion: securityQuestion,
            securityAnswer: securityAnswer,
            // lastName: lname,
            // dob: new Date(dob),
            email: email,
            password: hashedPassword,
          });

            newUser.save().then(() => {
              return res.redirect('/registration-success');
          }).catch((err) => {
            console.error('Error saving user:', err);
            return res.render('register', { commonError: 'User registration failed' }); // Pass commonError here
          });
        });
      });
    } catch (err) {
      console.error('Error hashing password:', err);
      return res.render('register', { commonError: 'User registration failed' }); // Pass commonError here
    }
  } else {
    return res.render('register', { errors, submitted: true, commonError: 'Please fill in all the details' });
  }
});



myApp.get('/registration-success', (req, res) => {
  return res.render('registration-success');
});

myApp.get('/forgotpassword', (req, res) => {
  return res.render('forgotpassword', { errors: [],successCheck:[] });
});
myApp.post('/forgotpassword-check', [
  // Validation rules for each field
  check('userName').notEmpty().withMessage('userName is required.'),
  // check('dob').notEmpty().withMessage('Date of Birth is required.'),
  check('securityQuestion').notEmpty().withMessage('Security Question is required.'),
  check('securityAnswer').notEmpty().withMessage('Security Answer is required.'),
], async (req, res) => {
  const errors = validationResult(req).array();

  const { userName, securityQuestion, securityAnswer } = req.body;

  if (errors.length === 0) {
    try {
      // Query the database to find a user with the given email and DOB
      const user = await User.findOne({ userName: userName, securityQuestion: securityQuestion, securityAnswer:securityAnswer}).exec();

      if (!user) {
        return res.render('forgotpassword', { errors: [{ msg: 'User not found. Please check your username and security question/answer.' }],successCheck:[] });
      }
      
      return res.render('forgotpassword', { successCheck: [{ msg: 'user found.',userName: userName, securityQuestion: securityQuestion,securityAnswer: securityAnswer }],errors:[] });
    } catch (err) {
      console.error('Error resetting password:', err);
      return res.render('forgotpassword', { errors: [{ msg: 'An error occurred. Please try again later.' }],successCheck:[] });
    }
  } else {
    // Display the common error message if any of the fields are empty
    return res.render('forgotpassword', { errors: [{ msg: 'Please fill in all the details' }],successCheck:[] });
  }
});
myApp.post('/forgotpassword', [
  // Validation rules for each field
  check('userName').notEmpty().withMessage('userName is required.'),
  // check('dob').notEmpty().withMessage('Date of Birth is required.'),
  check('securityQuestion').notEmpty().withMessage('Security Question is required.'),
  check('securityAnswer').notEmpty().withMessage('Security Answer is required.'),
  check('password').notEmpty().withMessage('New Password is required.'),
  check('confirmpassword').notEmpty().withMessage('Confirm New Password is required.'),
], async (req, res) => {
  const errors = validationResult(req).array();

  const { userName, securityQuestion, securityAnswer, password, confirmpassword } = req.body;

  if (errors.length === 0) {
    try {
      // Query the database to find a user with the given email and DOB
      const user = await User.findOne({ userName: userName, securityQuestion: securityQuestion, securityAnswer:securityAnswer }).exec();

      if (!user) {
        return res.render('forgotpassword', { errors: [{ msg: 'User not found. Please check your username and security question/answer.' }],successCheck: [{ msg: 'user not found.',userName: userName, securityQuestion: securityQuestion,securityAnswer: securityAnswer }], });
      }

      // Check if the password and confirm password match
      if (password !== confirmpassword) {
        return res.render('forgotpassword', { errors: [{ msg: 'New Password and Confirm New Password do not match.' }],successCheck: [{ msg: 'user not found.',userName: userName, securityQuestion: securityQuestion,securityAnswer: securityAnswer }], });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update the user's password in the database with the hashed password
      user.password = hashedPassword;
      await user.save();

      // Password reset successful, redirect to the password-reset-success page
      return res.redirect('/password-reset-success');
    } catch (err) {
      console.error('Error resetting password:', err);
      return res.render('forgotpassword', { errors: [{ msg: 'An error occurred. Please try again later.' }],successCheck: [{ msg: 'user found.',userName: userName, securityQuestion: securityQuestion,securityAnswer: securityAnswer }], });
    }
  } else {
    // Display the common error message if any of the fields are empty
    return res.render('forgotpassword', { errors: [{ msg: 'Please fill in all the details' }],successCheck: [{ msg: 'user found.',userName: userName, securityQuestion: securityQuestion,securityAnswer: securityAnswer }], });
  }
});


myApp.get('/password-reset-success', (req, res) => {
  return res.render('password-reset-success');
});


myApp.get('/profile', async (req, res) => {
  // req.session.user_id = '652e8eea63799921917f0a0f';
  // req.session.userName = 'ss';

  const user = await User.findOne({ _id: req.session.user_id}).exec();
  // console.log(user,'user',req.session.user_id,req.session)
    if (!user) {
      return res.redirect('/login');
    }else{
      return res.render('profile', { errors:req.flash('error_message'),success: req.flash('success_message'),user: [{user: user}] });
    }
});

myApp.get('/edit-art/:art_id', async (req, res) => {
  // req.session.user_id = '652e8eea63799921917f0a0f';
  // req.session.userName = 'ss';

  // console.log(req.params.art_id,req.session.user_id)

  const art = await Art.findOne({ _id: req.params.art_id}).exec();
    if (req.session.user_id) {
          return res.render('edit-art', { errors:req.flash('error_message'),success: req.flash('success_message'),art: [{art: art}] });
    }else{
      return res.redirect('/login');
    }
});
myApp.get('/advertisement-list', async (req, res) => {
  if(!req.session.user_id){
    return res.redirect('/login');
  }else{
      var where = [
        {user_id: new mongoose.Types.ObjectId(req.session.user_id)},
      ]
      const aggregatorOpts = [
        {
          $match : { $and : where }
        },
        {
          $lookup:
            {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'userData'
            }
        }
    ]

    var advertisement = await Advertisement.aggregate(aggregatorOpts).exec();
    // const advertisement = await Art.find({ user_id: req.session.user_id}).exec();
    return res.render('advertisements', { errors:req.flash('error_message'),success: req.flash('success_message'),advertisements: [{advertisements: advertisement}] });
  }
  
});
myApp.get('/create-advertisement', async (req, res) => {

  const user = await User.findOne({ _id: req.session.user_id}).exec();
  if (!user) {
    return res.redirect('/login');
  }else{
    return res.render('createAdvertisement', { errors:req.flash('error_message'),success: req.flash('success_message')});

    // return res.render('createAdvertisement' , { errors:[],success: [] });
  }
});
myApp.post('/store-advertisement',upload.single('advertisement_image'),async (req, res, next) =>{
    const user = await User.findOne({ _id: req.session.user_id}).exec();
    if (!user) {
      return res.redirect('/login');
    }
    const newAdvertisement = new Advertisement({
      title: req.body.title,
      image:  req.file ? 'uploads/'+req.file.filename : '',
      user_id: req.session.user_id,
    });
    // console.log(newAdvertisement,req.body)
    newAdvertisement.save().then(() => {
      req.flash('success_message', 'Advertisement Added successfully.'); 
    return res.redirect('/advertisement-list');
    }).catch((err) => {
      console.error('Error saving user:', err);
      req.flash('success_message', 'Advertisement adding failed.'); 
    return res.redirect('/createAdvertisement');

      // return res.render('createAdvertisement' , { errors:[{msg:'Advertisement adding failed'}],success: [] });
    });
  
});
myApp.get('/uploadart', async (req, res) => {

  const user = await User.findOne({ _id: req.session.user_id}).exec();
  if (!user) {
    return res.redirect('/login');
    // return res.render('profile', { errors: [{ msg: 'User not found.' }],success: [],user: [{user: user}] });
  }
  // req.session.user_id = '652e8eea63799921917f0a0f';
  // req.session.userName = 'ss';

  // const user = await User.findOne({ _id: req.session.user_id}).exec();
  // console.log(user,'user',req.session.user_id,req.session)
    // if (!user) {
    //   return res.redirect('/login');
    // }else{
    return res.render('uploadArt', { errors:req.flash('error_message'),success: req.flash('success_message') });

      // return res.render('uploadArt' , { errors:[],success: [] });
    // }
});

myApp.post('/update-profile',upload.single('profile_image'),async (req, res, next) =>{
  // console.log(req.body,req.file.filename)
  const user = await User.findOne({ _id: req.session.user_id}).exec();
  if (!user) {
    return res.redirect('/login');
    // return res.render('profile', { errors: [{ msg: 'User not found.' }],success: [],user: [{user: user}] });
  }
  User.findOne({email: req.body.email}).then(async function(resultEmail){
    if(resultEmail != null){
      if(new mongoose.Types.ObjectId(resultEmail._id) != req.session.user_id){
        req.flash('error_message', 'Email already exist.');
        return res.render('profile',{ errors:req.flash('error_message'),success: req.flash('success_message'),user: [{user: user}] });
        // return res.render('profile', { errors: [{ msg: 'Email already exist.' }],success: [],user: [{user: user}] });
      }
    }
    // if (!req.body.email || !req.body.about || !req.body.name || (!user.profile_image && !req.file)) {
    //   var msg = !req.body.email ? 'Email' : !req.body.about ? 'About' : !req.body.name ? 'Name' : (!user.profile_image && !req.file) ? 'Profile Image' : '';
    
    // else{
      var email = req.body.email.trim();
      var name = req.body.name.trim();
      var about = req.body.about.trim();
      user.email = email;
      user.profile_image = req.file ? 'uploads/'+req.file.filename : user.profile_image;
      user.about = about;
      user.name = name;
      await user.save();
      req.flash('success_message', 'Profile updated successfully.'); 
      // return res.render('profile', { success: [{ msg: 'Profile updated successfully.' }],errors: [],user: [{user: user}] });
      return res.render('profile',{ errors:req.flash('error_message'),success: req.flash('success_message'),user: [{user: user}] });
    // }
  })
});
myApp.get('/art-list', async (req, res) => {

  var where = [
    {status:{$in:['active','completed','inprogress']}},
    {user_id: new mongoose.Types.ObjectId(req.session.user_id)},
    // {start_date:{$lte: moment(new Date()).format('YYYY-MM-DD')}},
    // {end_date:{$gte: moment(new Date()).format('YYYY-MM-DD')}},
    // {start_time:{$lte: moment(new Date()).format('HH:mm:00')}},
    // {end_time:{$gte: moment(new Date()).format('HH:mm:59')}},
]
  const aggregatorOpts = [
    {
      $match : { $and : where }
    },
    {
      $lookup:
        {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData'
        }
    }
]

  var art = await Art.aggregate(aggregatorOpts).exec();
  // const art = await Art.find({ user_id: req.session.user_id}).exec();

  if(req.session.user_id){
    // res.send(req.flash('message')); 
    return res.render('arts', { errors:req.flash('error_message'),success: req.flash('success_message'),art: [{art: art}],moment: moment });
  }else{
    return res.redirect('/login');
  }
});
myApp.post('/add-art',upload.single('profile_image'),async (req, res, next) =>{
  const user = await User.findOne({ _id: req.session.user_id}).exec();
  if (!user) {
    return res.redirect('/login');
    // return res.render('profile', { errors: [{ msg: 'User not found.' }],success: [],user: [{user: user}] });
  }
  // const user = await User.findOne({ _id: req.session.user_id}).exec();
  // if (!req.body.title || !req.body.description || !req.body.min_bid || !req.body.start_date || !req.body.end_date || !req.body.start_time || !req.body.end_time || (!user.profile_image && !req.file)) {
  //   var msg = !req.body.title ? 'Title' : !req.body.description ? 'description' : !req.body.min_bid ? 'Min Bid' : !req.body.start_date ? 'Start Date' : !req.body.end_date ? 'End Date' : !req.body.start_time ? 'Start Time' : !req.body.end_time ? 'End Time' : (!user.profile_image && !req.file) ? 'Art Image' : ''
  //   return res.render('uploadart', { errors: [{ msg: msg+' is reqired.' }],success: [] });
  // console.log(req.body.start_date,req.body.start_time,req.body.end_date + " " + req.body.end_time,req.body.start_date + " " + req.body.start_time <= req.body.end_date + " " + req.body.end_time)
  
  if(req.body.start_date + " " + req.body.start_time >= req.body.end_date + " " + req.body.end_time){
    req.flash('error_message', 'End date & time should be always greater than start date & time.'); 
    return res.render('uploadart', { errors: req.flash('error_message'),success: [] });
    // return res.render('uploadart', { errors: [{ msg: 'End date & time should be always greater than start date & time' }],success: [] });
  }else if(req.body.start_date + " " + req.body.start_time <= moment(new Date()).format('YYYY-MM-DD HH:mm')){
    req.flash('error_message', 'Start date & time should be always greater than current date & time.'); 
    return res.render('uploadart', { errors: req.flash('error_message'),success: [] });
  }else if(req.body.end_date + " " + req.body.end_time <= moment(new Date()).format('YYYY-MM-DD HH:mm')){
    req.flash('error_message', 'End date & time should be always greater than current date & time.'); 
    return res.render('uploadart', { errors: req.flash('error_message'),success: [] });
  }else{
    // User.findOne({id:req.body.id}, function (err, user) {
        // if (!user) {
        //   return res.redirect('/login');
        //   // return res.render('profile', { errors: [{ msg: 'User not found.' }],success: [],user: [{user: user}] });
        // }
      const newArt = new Art({
        title: req.body.title,
        description: req.body.description,
        image:  req.file ? 'uploads/'+req.file.filename : '',
        min_bid: req.body.min_bid,
        last_bid: req.body.min_bid,

        user_id: req.session.user_id,
        // start_date: '2023-10-18',
        // end_date: '2023-10-19',
        // start_time: '10:00',
        // end_time: '23:05',
        start_date: moment(new Date(req.body.start_date)).format('YYYY-MM-DD'),
        end_date: moment(new Date(req.body.end_date)).format('YYYY-MM-DD'),
        start_time: req.body.start_time,
        end_time: req.body.end_time,
        status: 'active',
        
      });
      // console.log(newArt,req.body)
      newArt.save().then(() => {
        req.flash('success_message', 'Art Added successfully.'); 
        return res.redirect('/art-list');
        // return res.render('uploadart', { success: [{ msg: 'Art Added successfully.' }],errors: [] });
      }).catch((err) => {
        console.error('Error saving user:', err);
        req.flash('error_message', 'Art adding failed.'); 
        return res.render('uploadart', { errors: req.flash('error_message'),success: req.flash('success_message') });
        // return res.render('uploadart', { commonError: 'Art adding failed' }); // Pass commonError here
      });
  }
});

myApp.post('/update-art',upload.single('profile_image'),async (req, res, next) =>{
  //  req.session.user_id = '652e8eea63799921917f0a0f';
  // req.session.userName = 'ss';
  const user = await User.findOne({ _id: req.session.user_id}).exec();
  if (!user) {
    return res.redirect('/login');
    // return res.render('profile', { errors: [{ msg: 'User not found.' }],success: [],user: [{user: user}] });
  }
  const art = await Art.findOne({ _id: req.body.art_id}).exec();

  // const user = await User.findOne({ _id: req.session.user_id}).exec();
  // if (!req.body.title || !req.body.description || !req.body.min_bid || !req.body.start_date || !req.body.end_date || !req.body.start_time || !req.body.end_time) {
  //   var msg = !req.body.title ? 'Title' : !req.body.description ? 'description' : !req.body.min_bid ? 'Min Bid' : !req.body.start_date ? 'Start Date' : !req.body.end_date ? 'End Date' : !req.body.start_time ? 'Start Time' : !req.body.end_time ? 'End Time' : ''
  //   return res.render('edit-art', { errors: [{ msg: msg+' is reqired.' }],success: [] });
  if(req.body.start_date + " " + req.body.start_time >= req.body.end_date + " " + req.body.end_time){
    req.flash('error_message', 'End date & time should be always greater than start date & time.'); 
    return res.render('edit-art', { errors: req.flash('error_message'),success: [],art: [{art: art}] });
  }else if(req.body.start_date + " " + req.body.start_time <= moment(new Date()).format('YYYY-MM-DD HH:mm')){
    req.flash('error_message', 'Start date & time should be always greater than current date & time.');  
    return res.render('edit-art', { errors: req.flash('error_message'),success: [],art: [{art: art}] });
  }else if(req.body.end_date + " " + req.body.end_time <= moment(new Date()).format('YYYY-MM-DD HH:mm')){
    req.flash('error_message', 'End date & time should be always greater than current date & time'); 
    return res.render('edit-art', { errors: req.flash('error_message'),success: [],art: [{art: art}] });
  }else{
    const user = await Art.findOne({ _id: req.body.art_id}).exec();
    var title = req.body.title.trim();
    var description = req.body.description.trim();
    var min_bid = req.body.min_bid.trim();
    user.title = title;
    user.image = req.file ? 'uploads/'+req.file.filename : user.image;
    user.description = description;
    user.min_bid = min_bid;
    user.start_time = req.body.start_time;
    user.end_time = req.body.end_time;
    user.start_date = moment(new Date(req.body.start_date)).format('YYYY-MM-DD');
    user.end_date = moment(new Date(req.body.end_date)).format('YYYY-MM-DD');

    

    await user.save().then(async () => {

      var where = [
        {status:'active'},
        {user_id: new mongoose.Types.ObjectId(req.session.user_id)},
        // {start_date:{$lte: moment(new Date()).format('YYYY-MM-DD')}},
        // {end_date:{$gte: moment(new Date()).format('YYYY-MM-DD')}},
        // {start_time:{$lte: moment(new Date()).format('HH:mm:00')}},
        // {end_time:{$gte: moment(new Date()).format('HH:mm:59')}},
    ]
      const aggregatorOpts = [
        {
          $match : { $and : where }
        },
        {
          $lookup:
            {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'userData'
            }
        }
    ]
        var art = await Art.aggregate(aggregatorOpts).exec();
          req.flash('success_message', 'Art Updated successfully.'); 
          res.redirect('/art-list');
          // return res.redirect('/art-list');
          // return res.render('arts', { success: [{ msg: 'Art Updated successfully.' }],errors: [],art: [{art: art}],moment: moment });
        }).catch((err) => {
          console.error('Error saving user:', err);
          req.flash('error_message', 'Art updating failed'); 
          return res.render('edit-art', { errors: req.flash('error_message'),success: [],art: [{art: art}] });
          // return res.render('arts', { commonError: 'Art adding failed',art: [{art: art}],moment: moment }); // Pass commonError here
        });

      }
      
  // });
});

myApp.get('/delete-art/:art_id',upload.single('profile_image'),async (req, res, next) =>{
  const user = await User.findOne({ _id: req.session.user_id}).exec();
  if (!user) {
    return res.redirect('/login');
    // return res.render('profile', { errors: [{ msg: 'User not found.' }],success: [],user: [{user: user}] });
  }
  // const user = await User.findOne({ _id: req.session.user_id}).exec();
  console.log(req.params.art_id);

    const art = await Art.findOne({ _id: req.params.art_id}).exec();

   
    art.status = 'deleted';
    

    await art.save().then(() => {
      req.flash('success_message', 'Art Deleted successfully.'); 
      return res.redirect('/art-list');
    }).catch((err) => {
          console.error('Error saving user:', err);
        req.flash('error_message', 'Art Deletion failed.'); 
        return res.redirect('/art-list');
          // return res.render('art-list', { commonError: 'Art adding failed' }); // Pass commonError here
        });

      
      
  // });
});

myApp.get('/remove-cart/:art_id',upload.single('profile_image'),async (req, res, next) =>{
  const user = await User.findOne({ _id: req.session.user_id}).exec();
  if (!user) {
    return res.redirect('/login');
    // return res.render('profile', { errors: [{ msg: 'User not found.' }],success: [],user: [{user: user}] });
  }
  // const user = await User.findOne({ _id: req.session.user_id}).exec();

    const art = await Cart.deleteOne({ art_id: req.params.art_id , user_id:req.session.user_id}).then(() => {
      return res.redirect('/cart');
    }).catch((err) => {
          console.error('Error saving user:', err);
          return res.render('art-list', { commonError: 'Art adding failed' }); // Pass commonError here
        });

      
      
  // });
});

myApp.post('/purchase',async (req, res, next) =>{
  const user = await User.findOne({ _id: req.session.user_id}).exec();
  if (!user) {
    return res.redirect('/login');
    // return res.render('profile', { errors: [{ msg: 'User not found.' }],success: [],user: [{user: user}] });
  }
  // const user = await User.findOne({ _id: req.session.user_id}).exec();

  var where = [
    
    {user_id: new mongoose.Types.ObjectId(req.session.user_id)},
    {status:"active"}
    // {start_date:{$lte: moment(new Date()).format('YYYY-MM-DD')}},
    // {end_date:{$gte: moment(new Date()).format('YYYY-MM-DD')}},
    // {start_time:{$lte: moment(new Date()).format('HH:mm:00')}},
    // {end_time:{$gte: moment(new Date()).format('HH:mm:59')}},
]
  const aggregatorOpts = [
    {
      $match : { $and : where }
    },
    {
      $lookup:
        {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData'
        }
        
    },
    {
      $lookup:
        {
          from: 'arts',
          localField: 'art_id',
          foreignField: '_id',
          as: 'artData'
        },
        
    }
]

const aggregatorOpts1 = [
  {
    $match : { $and : where }
  },
  {
    $lookup:
      {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'userData'
      }
      
  }
]

  var cart = await Cart.aggregate(aggregatorOpts).exec();

  var cartItemsCount = cart.length
  var total = 0;

  cart.forEach(async (product) => {


    const art = await Cart.findOne({ _id: product._id}).exec();
    const art1 = await Art.findOne({ _id: product.art_id}).exec();
    const artistData = await User.findOne({ _id: art1.user_id}).exec();


   
    art.status = 'completed';
    art1.is_payment_done = 'yes';

    

    await art.save()
    await art1.save()
    let mailDetails = {
      // from: 'n23goswami+1@gmail.com',
      // to: 'sakshukla8574@gmail.com',
      to: artistData.email,
      subject: 'Art Sold',
      html: '<style type="text/css">@media only screen and (max-device-width: 768px) {.responsive_table { background-color:#e6e6fa; height:100%; width:100%;}}@media only screen and (min-device-width: 769px) {.responsive_table { background-color:#e6e6fa; height:100%; width:50%;}}</style><!--[if (gte mso 9)|(IE)]><table width="400" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><tr><td><tr><td><p><p><![endif]-->	<table align="center" border="0" cellpadding="5" cellspacing="0" class="responsive_table"><tbody><tr><td width="350" style="background-color:#ffffff; text-align:center; vertical-align:middle;"><hr /></td></tr><tr><td style="background-color:#ffffff; text-align:center"><h1 style="text-align:left"><strong><strong>Hi ' + artistData.userName + ',</strong></strong></h1><p style="text-align:left"><strong></strong>  Your art <b>'+art1.title+'</b> has been bought by <b>'+ req.session.userName + '</b></p><p style="text-align:left">&nbsp;</p><p style="text-align:left">Thank you.</p><p style="text-align:left">Cheers,<br />Art Bid&nbsp;Team</p><hr /></td></tr></tbody></table></p> </p></tr></table>'

      // html: '<p>Hi <b>'+artistData.userName+'</b>, Your art <b>'+art1.title+'</b> has been bought by <b>'+ req.session.userName + '</b></p>'
    };
      mailTransporter.sendMail(mailDetails, function(err, data) {
        if(err) {
            console.log('Error Occurs',err);
        } else {
            console.log('Email sent successfully',artistData.email);
        }
      });

    
  })
  let mailDetails = {
    // from: 'n23goswami+1@gmail.com',
    // to: 'sakshukla8574@gmail.com',
    to: req.session.email,
    subject: 'Purchase Completed',
    html: '<style type="text/css">@media only screen and (max-device-width: 768px) {.responsive_table { background-color:#e6e6fa; height:100%; width:100%;}}@media only screen and (min-device-width: 769px) {.responsive_table { background-color:#e6e6fa; height:100%; width:50%;}}</style><!--[if (gte mso 9)|(IE)]><table width="400" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><tr><td><tr><td><p><p><![endif]-->	<table align="center" border="0" cellpadding="5" cellspacing="0" class="responsive_table"><tbody><tr><td width="350" style="background-color:#ffffff; text-align:center; vertical-align:middle;"><hr /></td></tr><tr><td style="background-color:#ffffff; text-align:center"><h1 style="text-align:left"><strong><strong>Hi ' + req.session.userName + ',</strong></strong></h1><p style="text-align:left"><strong></strong>  your order has been placed</p><p style="text-align:left">&nbsp;</p><p style="text-align:left">Thank you.</p><p style="text-align:left">Cheers,<br />Art Bid&nbsp;Team</p><hr /></td></tr></tbody></table></p> </p></tr></table>'

    // html: '<p>Hi <b>'+req.session.userName+'</b>, your order has been placed.</p>'
  };
    mailTransporter.sendMail(mailDetails, function(err, data) {
      if(err) {
          console.log('Error Occurs',err);
      } else {
          console.log('Email sent successfully',artistData.email);
          // return res.redirect('/thankyou-page');
      }
    });

  return res.redirect('/thankyou-page');
  
    
  // });
});
myApp.get('/thankyou-page', (req, res) => {
  if(req.session.user_id){
    res.render('thankyou');
  }else{
    return res.redirect('/login');
  }
});

myApp.get('/logout', async (req, res) => {
  req.session.destroy(function(error){ 
    console.log("Session Destroyed");
    return res.redirect('/login');
  })  
});

myApp.get('/past-auction', async (req, res) => {
  // req.session.user_id = req.session.user_id;
  // req.session.userName = 'ss';
  var where = [
    {status:'completed'},
    // {end_date:{$lte: moment(new Date()).format('YYYY-MM-DD')}},
    
]
  const aggregatorOpts = [
    {
      $match : { $and : where }
    },
    {
      $lookup:
        {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData'
        }
    }
]

  var art = await Art.aggregate(aggregatorOpts).exec();

  // console.log('art',art,req.session.user_id);
  
  if(req.session.user_id){
    return res.render('pastAuction', { errors:[],success: [],art: [{art: art}],moment: moment });

  }else{
    return res.redirect('/login');
  }
});
myApp.post('/add-cart',async (req, res, next) =>{
  const user = await User.findOne({ _id: req.session.user_id}).exec();
  if (!user) {
    return res.redirect('/login');
    // return res.render('profile', { errors: [{ msg: 'User not found.' }],success: [],user: [{user: user}] });
  }
  // const user = await User.findOne({ _id: req.session.user_id}).exec();
  
    // User.findOne({id:req.body.id}, function (err, user) {
        // if (!user) {
        //   return res.redirect('/login');
        //   // return res.render('profile', { errors: [{ msg: 'User not found.' }],success: [],user: [{user: user}] });
        // }
        var where = [
    
          {user_id: new mongoose.Types.ObjectId(req.session.user_id)},
          // {start_date:{$lte: moment(new Date()).format('YYYY-MM-DD')}},
          // {end_date:{$gte: moment(new Date()).format('YYYY-MM-DD')}},
          // {start_time:{$lte: moment(new Date()).format('HH:mm:00')}},
          // {end_time:{$gte: moment(new Date()).format('HH:mm:59')}},
      ]
        const aggregatorOpts = [
          {
            $match : { $and : where }
          },
          {
            $lookup:
              {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'userData'
              }
              
          },
          {
            $lookup:
              {
                from: 'arts',
                localField: 'art_id',
                foreignField: '_id',
                as: 'artData'
              },
              
          }
      ]
      
        var cart = await Cart.aggregate(aggregatorOpts).exec();
      
        var cartItemsCount = cart.length
        var total = 0;
      
        cart.forEach(product => {
          total = parseInt(total) + parseInt(product.artData[0].last_bid);
        })

        const cart1 = new Cart({
          user_id: req.session.user_id,
          art_id: req.body.art_id
        });
        // console.log(newArt,req.body)
        cart1.save().then(() => {
          req.flash('success_message', 'Art Added to cart');
    return res.redirect('/cart');

          // return res.render('cart', { success: req.flash('success_message'),errors: req.flash('error_message'),cart: [{cart: cart}], cartLength : cartItemsCount, total : total });
        }).catch((err) => {
          console.error('Error saving user:', err);
          req.flash('error_message', 'Error saving art to cart.');
    return res.redirect('/cart');
          
          return res.render('cart', { success: req.flash('success_message'),errors: req.flash('error_message'),cart: [{cart: cart}], cartLength : cartItemsCount, total : total });
          // return res.render('uploadart', { commonError: 'Art adding failed' }); // Pass commonError here
        });
      
  // });
});

cron.schedule('* * * * *', async () => {

  var where = [
    {status:"inprogress"},
    // {_id: new mongoose.Types.ObjectId('653131a126e2b9cf90709dac')},
    // {start_time:{$lte: moment(new Date()).format('HH:mm:00')}},
    // {end_time:{$gte: moment(new Date()).format('HH:mm:59')}},
]
  const aggregatorOpts = [
    {
      $match : { $and : where }
    },
    {
      $lookup:
        {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData'
        }
    }
]



  var art = await Art.aggregate(aggregatorOpts).exec();
// console.log(art)
  art.forEach(async(element) => {

    if((element.end_date + " " + element.end_time) <= moment(new Date()).format('YYYY-MM-DD HH:mm') ){

      console.log('running a task every minute status completed', moment(new Date()).format('YYYY-MM-DD HH:mm:ss'), element._id);
      var artistMsg = '<p>Hi <b>'+element.userData[0].userName+'</b>, Bidding for your art <b>'+ element.title + '</b> has been completed.</p>'
      if(element.last_bidder_id){
        const bidderData = await User.findOne({ _id: element.last_bidder_id }).exec();
        artistMsg = artistMsg + '<p> <b>'+bidderData.userName+'</b> won bid with highest bidding amount of <b>$' +element.last_bid+ '</b></p>' 
        let mailDetailsBidder = {
          // from: 'n23goswami+1@gmail.com',
          // to: 'n23goswami+2@gmail.com',
          to: bidderData.email,
          subject: 'Won Bid',
          html: '<style type="text/css">@media only screen and (max-device-width: 768px) {.responsive_table { background-color:#e6e6fa; height:100%; width:100%;}}@media only screen and (min-device-width: 769px) {.responsive_table { background-color:#e6e6fa; height:100%; width:50%;}}</style><!--[if (gte mso 9)|(IE)]><table width="400" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><tr><td><tr><td><p><p><![endif]-->	<table align="center" border="0" cellpadding="5" cellspacing="0" class="responsive_table"><tbody><tr><td width="350" style="background-color:#ffffff; text-align:center; vertical-align:middle;"><hr /></td></tr><tr><td style="background-color:#ffffff; text-align:center"><h1 style="text-align:left"><strong><strong>Hi ' + bidderData.userName + ',</strong></strong></h1><p style="text-align:left"><strong></strong>  You have won bid for art <b>'+ element.title + '</b> with highest bidding amount of <b>$'+ element.last_bid+ '</b></p><p style="text-align:left">&nbsp;</p><p style="text-align:left">Thank you.</p><p style="text-align:left">Cheers,<br />Art Bid&nbsp;Team</p><hr /></td></tr></tbody></table></p> </p></tr></table>'

          // html: '<p>Hi <b>'+bidderData.userName+'</b>, You have won bid for art <b>'+ element.title + '</b> with highest bidding amount of <b>$'+ element.last_bid+ '</b></p>'
        };
          mailTransporter.sendMail(mailDetailsBidder, function(err, data) {
            if(err) {
                console.log('Error Occurs',err);
            } else {
                console.log('Email sent successfully',bidderData.email);
            }
          });
      }
      let mailDetails = {
        // from: 'n23goswami+1@gmail.com',
        // to: 'n23goswami+2@gmail.com',
        to: element.userData[0].email,
        subject: 'Bid Completed',
        html: artistMsg
      };
        mailTransporter.sendMail(mailDetails, function(err, data) {
          if(err) {
              console.log('Error Occurs',err);
          } else {
              console.log('Email sent successfully',element.userData[0].email);
          }
        });
      
      const art =  await Art.findOne({ _id: element._id}).exec();
      art.status = 'completed';
      await art.save();
    }
  
  });
});

cron.schedule('* * * * *', async () => {

  var where = [
    {status:"active"},
    // {start_time:{$lte: moment(new Date()).format('HH:mm:00')}},
    // {end_time:{$gte: moment(new Date()).format('HH:mm:59')}},
]
  const aggregatorOpts = [
    {
      $match : { $and : where }
    },
    {
      $lookup:
        {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData'
        }
    }
]



  var art = await Art.aggregate(aggregatorOpts).exec();

  art.forEach(async(element) => {
    if((element.start_date + " " + element.start_time) <= moment(new Date()).format('YYYY-MM-DD HH:mm') && (element.end_date + " " + element.end_time) > moment(new Date()).format('YYYY-MM-DD HH:mm')){

      console.log('running a task every minute status inprogress', moment(new Date()).format('YYYY-MM-DD HH:mm:ss'), element._id);

      const art =  await Art.findOne({ _id: element._id}).exec();
      art.status = 'inprogress';
      await art.save();
    }
  
  });
});

myApp.get('/winning-bid', async (req, res) => {
  // req.session.user_id = req.session.user_id;
  // req.session.userName = 'ss';
  var where = [
    {last_bidder_id: new mongoose.Types.ObjectId(req.session.user_id)},
    {status : "completed"}
    // {end_date:{$lte: moment(new Date()).format('YYYY-MM-DD')}},
    
]
  const aggregatorOpts = [
    {
      $match : { $and : where }
    },
    {
      $lookup:
        {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData'
        }
    }
]

  var art = await Art.aggregate(aggregatorOpts).exec();

  // console.log('art',art,req.session.user_id);
  
  if(req.session.user_id){
    return res.render('winningBid', { errors:[],success: [],art: [{art: art}],moment: moment });

  }else{
    return res.redirect('/login');
  }
});

myApp.get('/checkout', async (req, res) => {

  var where = [
    
    {user_id: new mongoose.Types.ObjectId(req.session.user_id)},
    {status:"active"}
    // {start_date:{$lte: moment(new Date()).format('YYYY-MM-DD')}},
    // {end_date:{$gte: moment(new Date()).format('YYYY-MM-DD')}},
    // {start_time:{$lte: moment(new Date()).format('HH:mm:00')}},
    // {end_time:{$gte: moment(new Date()).format('HH:mm:59')}},
]
  const aggregatorOpts = [
    {
      $match : { $and : where }
    },
    {
      $lookup:
        {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData'
        }
        
    },
    {
      $lookup:
        {
          from: 'arts',
          localField: 'art_id',
          foreignField: '_id',
          as: 'artData'
        },
        
    }
]

  var cart = await Cart.aggregate(aggregatorOpts).exec();

  var cartItemsCount = cart.length
  var total = 0;

  cart.forEach(product => {
    total = parseInt(total) + parseInt(product.artData[0].last_bid);
  })
  if(req.session.user_id){
    res.render('checkout', { errors: [] ,cart: [{cart: cart}], cartLength : cartItemsCount, total : total });
  }else{
    return res.redirect('/login');
  }
});

myApp.listen(8081, () => {
  console.log('Application is running on port 8081');
});
