require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
const port = process.env.PORT || 8000;
const cors = require("cors");

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const jwt = require("jsonwebtoken");


// process.env.MONGO_URL
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("connected to database");
}).catch((err) => {
    console.log(err);
});

app.listen(port, () => {
    console.log("Server is running on port 8000")
});

// Import models

const User = require("./models/user");
const Order = require("./models/order");
const { hashPassword, hashCpassword, comparePassword } = require("./helper/authHelper");
const { env } = require("process");

// function to send verification email to user.
const sendVerificationEmail = async (email, verificationToken, fname) => {
    //crete a nodemailer transport
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "deepak.tawkto@gmail.com",
            pass: "zqucijtvzjasxhoh"
        }
    });
    // compose the email message
    const mailOptions = {
        from: "deepak.tawkto@gmail.com",
        to: email,
        subject: "Verify your email - One Window CAN ICL",
        html: `<h3>Hello ${fname},</h3><br>
        <strong>Welcome to One Window CAN ICL!</strong>
        <p>To finalize your registration please verify your email by clicking on the link below:</p>
        <p><a href="http://localhost:8000/verify/${verificationToken}">Verify Account</a></p><br><br>
        <p>If you received this email without signing up, please click here and we will delete your email from our records</p>
        <p>Thank you,<br>One Window CAN ICL Team</p>`
        // text: `Click the following email to verify your email : http://localhost:8000/verify/${verificationToken}`
    };
    // send the email
    try {
        await transporter.sendMail(mailOptions)
            .then((info) => {
                console.log('Email sent:', info.response);
            })
            .catch((error) => {
                console.error('Error occurred:', error);
            });

    } catch (error) {
        console.log(error);

    }
}

const sendResetEmail = async (email, otp, fname) => {
    //crete a nodemailer transport
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "deepak.tawkto@gmail.com",
            pass: "zqucijtvzjasxhoh"
        }
    });
    // compose the email message
    const mailOptions = {
        from: "deepak.tawkto@gmail.com",
        to: email,
        subject: "Reset password - One Window CAN ICL",
        html: `<h3>Hello ${fname},</h3><br>
        <p>You are receiving this because you have requested to reset your password for your account on One Window CAN ICL.</p>
        <p>Please enter the following verification code when prompted. If you don’t want to create an account, you can ignore this message.</p>
        <p style="text-align:center"><strong>Verification code</strong</p>
        <h2 style="text-align:center">${otp}</h2>
        <p style="text-align:center">This code is valid for 30 minutes</p>
        <p>If you did not request a password reset, you can ignore this email. Only a person with access to your email account, can reset your account password.</p>
        <p>Thank you,<br>One Window CAN ICL Team</p>`
        // text: `Click the following email to verify your email : http://localhost:8000/verify/${verificationToken}`
    };
    // send the email
    try {
        await transporter.sendMail(mailOptions)
            .then((info) => {
                console.log('Email sent:', info.response);
            })
            .catch((error) => {
                console.error('Error occurred:', error);
            });

    } catch (error) {
        console.log(error);

    }
}

// endpoint to register in the app

app.post("/register", async (req, res) => {
    try {
        const { fname, lname, email, password, cpassword, selectedUserType, detailStatus } = req.body;

        // check if email is already registered.
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                message: "Email is already registered"
            });
        }
        // create a new user
        const hashedPassword = await hashPassword(password)
        const hashedCpassword = await hashPassword(cpassword)
        const newUser = new User({
            fname,
            lname,
            email,
            password: hashedPassword,
            cpassword: hashedCpassword,
            selectedUserType,
            detailStatus
        });
        if (password !== cpassword) {
            return res.status(400).json({
                message: "Password and confirm password should be same"
            });
        }
        // generate and store the verification toke
        newUser.verificationToken = crypto.randomBytes(20).toString("hex");

        // save the user to the database
        const savedUser = await newUser.save();

        // If the user is successfully saved
        if (savedUser) {
            sendVerificationEmail(newUser.email, newUser.verificationToken, newUser.fname)
            res.status(200).json({
                success: true,
                message: "Sign up successful! Please check your email for a verification link.",

            });
            // Generate a success response
            const response = {
                success: true,
                message: "User saved successfully",
                user: savedUser // Optionally, include the saved user data in the response
            };

            // You can return or use this response as needed
            console.log(response);
            return response;
        } else {
            // If the user is not saved (unlikely scenario)
            const response = {
                success: false,
                message: "Failed to save user"
            };

            // You can return or use this response as needed
            console.log(response);
            return response;
        }

        // send the verification token to the user



    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Registration Failed", error })
    }
});

// endpoint to verify the mail
app.get("/verify/:token", async (req, res) => {
    try {
        const token = req.params.token;

        //find the user with given verification token
        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({
                message: "Invalid token"
            });
        }
        // update the user's verification token to null
        user.verified = true;
        user.verificationToken = null;
        await user.save();
        // send the user a success message
        res.status(200).json({
            message: "Email Verified"
        });
    } catch (error) {
        res.status(500).json({ message: "Email Verification Failed" })
    }
})

// endpoint to login the app
const generatesecretKey = () => {
    const secretKey = crypto.randomBytes(32).toString("hex");
    return secretKey;
}

const secretKey = generatesecretKey();

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // find the user with the given email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        // compare the password with the hashed password
        const match = await comparePassword(password, user.password)
        if (!match) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        // generate a token
        const token = jwt.sign({ userId: user._id }, secretKey)
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ message: "Login Failed" })
    }
})

//endpoint to Reset Password


app.post("/reset", async (req, res) => {
    try {
        const { email } = req.body;

        // check if email is already registered.
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({
                message: "Email does not exist."
            });
        }


        existingUser.otp = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;;
        const sendOtp = await existingUser.save();
        if (sendOtp) {
            // send the verification token to the user
            sendResetEmail(existingUser.email, existingUser.otp, existingUser.fname)

            return res.status(200).json({
                message: "OTP Sent"
            });
        } else {
            return res.status(400).json({
                message: "Something Went Wrong"
            });
        }


    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Registration Failed", error })
    }
});

//endpoint to Verify OTP

app.post("/otp", async (req, res) => {
    try {
        const { otp, email } = req.body;

        const newOtp = otp;

        // check if email is already registered.
        const existingUser = await User.findOne({ email });
        if (existingUser.otp == newOtp) {
            return res.status(200).json({
                message: "OTP Matched"
            });
        } else {
            return res.status(400).json({
                message: existingUser.otp
            });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "OTP Verification Failed", error })
    }
});

//endpoint to Create New Password

app.post("/nepassword", async (req, res) => {
    try {
        const { email, password, cpassword } = req.body;

        // check if email is already registered.
        const existingUser = await User.findOne({ email });

        // create a new user
        const hashedPassword = await hashPassword(password)
        existingUser.password = hashedPassword;
        const savePassword = await existingUser.save();

        if (savePassword) {
            // send the verification token to the user
            // sendResetEmail(existingUser.email, existingUser.otp, existingUser.fname)

            return res.status(200).json({
                message: "Password Saved"
            });
        } else {
            return res.status(400).json({
                message: "Something Went Wrong"
            });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Registration Failed", error })
    }
});