// Import required modules and configure the server
const express = require('express'); // Import the Express.js framework
const path = require('path'); // Import the 'path' module for working with file paths
const mongoose = require('mongoose'); // Import Mongoose for MongoDB interactions
const { check, validationResult } = require('express-validator'); // Import validation utilities from Express
const fileUpload = require('express-fileupload'); // Import middleware for handling file uploads

const myApp = express(); // Create an Express application instance
myApp.use(fileUpload()); // Use the fileUpload middleware to handle file uploads
myApp.use(express.urlencoded({ extended: false })); // Parse URL-encoded request bodies
myApp.use(express.json()); // Parse JSON request bodies
myApp.set('views', path.join(__dirname, 'views')); // Set the views directory for EJS templates
myApp.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory
myApp.set('view engine', 'ejs'); // Set the view engine to EJS for rendering templates
mongoose.connect('mongodb://127.0.0.1:27017/artbid'); // Connect to the MongoDB database at the specified URI

// Define a MongoDB model for user registration
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  userName: String,
  dob: Date,
  email: String,
  password: String,
  securityQuestion: String,
  securityAnswer: String,
});
const User = mongoose.model('User', userSchema);

myApp.get('/', (req, res) => {
  res.render('login', { errors: [] });
});

myApp.get('/login', (req, res) => {
  res.render('login', { errors: [] });
});

const bcrypt = require('bcrypt');

myApp.post('/login', [
  check('userName').notEmpty().withMessage('Username is required.'),
  check('password').notEmpty().withMessage('Password is required.'),
], async (req, res) => {
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


myApp.get('/welcome', (req, res) => {
  return res.render('welcome');
});

myApp.listen(8080, () => {
  console.log('Application is running on port 8080');
});
