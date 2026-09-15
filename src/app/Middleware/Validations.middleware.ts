import { body } from "express-validator";
import User from "../Model/User.model"

// ? ********************************************* Registers *********************************************
export const registerValidations = [
    body("name").notEmpty().withMessage("Name is required!"),
    body("email").notEmpty().withMessage("Email is required!").custom(async (value) => {
        const isExist = await User.findOne({ email: value });

        if (!isExist) {
            return true
        }

        Promise.reject("Email already exist. Try again!")

    }),
    body("phone").notEmpty().withMessage("phone is required!"),
    body("password").notEmpty().withMessage("password is required!"),
    body(" confirmPassword").notEmpty().withMessage("confirm_password is required!").custom((value, { req }) => {
        const { password } = req.body

        if (password !== value) {
            Promise.reject("Passwords must be same!")
        }
        return true;

    }),

]
//login 
// Login validations

export const loginValidations = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email")
    .custom(async (value) => {
      const user = await User.findOne({ email: value });

      if (!user) {
        return Promise.reject("No account found with this email");
      }

      return true;
    }),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];
//for forget password
export const forgotPasswordValidations = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email")
    .custom(async (value) => {
      const user = await User.findOne({ email: value });

      if (!user) {
        return Promise.reject("No account found with this email");
      }

      return true;
    }),
];
// Reset password
export const resetPasswordValidations = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email")
    .custom(async (value) => {
      const user = await User.findOne({ email: value });

      if (!user) {
        return Promise.reject("User not found");
      }

      return true;
    }),

  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only numbers"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }

      return true;
    }),
];