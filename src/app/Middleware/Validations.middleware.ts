import { body, param} from "express-validator";
import User from "../Model/User.model";
import Category from "../Model/Category.model";

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
    .custom(async (value,{req}) => {
      const user = await User.findOne({ email: value });

      if (!user) {
        return Promise.reject("No account found with this email");
      }
    req.body.user = user;
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
    .custom(async (value,{req}) => {
      const user = await User.findOne({ email: value });

      if (!user) {
        return Promise.reject("No account found with this email");
      }
     req.body.user = user;
      return true;
    }),
];
// =========================
// RESET PASSWORD
// =========================

export const resetPasswordValidations = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email")
    .custom(async (value,{req}) => {
      const user = await User.findOne({ email: value });

      if (!user) {
        return Promise.reject("User not found");
      }
      req.body.user = user;

      return true;
    }),

  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only numbers")
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
        return Promise.reject("User not found");
      }

      if (
        user.resetPasswordOtp !== value ||
        !user.resetPasswordOtpExpires ||
        user.resetPasswordOtpExpires < new Date()
      ) {
        return Promise.reject("Invalid or expired OTP");
      }

      return true;
    }),

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
        return Promise.reject("Passwords do not match");
      }

      return true;
    }),
];
//
//user controller
////update validations

export const updateProfileValidations = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty"),

  body("phone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Phone number cannot be empty")
    .isMobilePhone("any")
    .withMessage("Enter a valid phone number")
    .custom(async (value, { req }) => {
      const userId = (req as any).userId;

      const existingPhone = await User.findOne({
        phone: value,
        _id: { $ne: userId },
      });

      if (existingPhone) {
        return Promise.reject(
          "Phone number already registered"
        );
      }

      return true;
    }),

  body("avatar")
    .optional()
    .trim()
    .isURL()
    .withMessage("Avatar must be a valid URL"),

  body("address")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Address cannot be empty"),
];


// =========================
// CHANGE PASSWORD
// =========================

export const changePasswordValidations = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        return Promise.reject("New passwords do not match");
      }

      return true;
    }),

  body("user")
    .custom(async (_value, { req }) => {
      const userId = (req as any).userId;

      const user = await User.findById(userId);

      if (!user) {
        return Promise.reject("User not found");
      }

      req.body.user = user;

      return true;
    }),
];
//for category controoler


// =========================
// CREATE CATEGORY
// =========================

export const createCategoryValidations = [
  body("name")
    .notEmpty()
    .withMessage("Category name is required")
    .trim(),

  body("description")
    .optional()
    .trim(),

  body("image")
    .optional()
    .trim()
    .isURL()
    .withMessage("Image must be a valid URL"),

  body("parentCategory")
    .optional()
    .isMongoId()
    .withMessage("Invalid parent category ID"),
];


// =========================
// UPDATE CATEGORY
// =========================

export const updateCategoryValidations = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category name cannot be empty"),

  body("description")
    .optional()
    .trim(),

  body("image")
    .optional()
    .trim()
    .isURL()
    .withMessage("Image must be a valid URL"),

  body("parentCategory")
    .optional()
    .isMongoId()
    .withMessage("Invalid parent category ID"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];


// =========================
// CATEGORY ID VALIDATION
// =========================

export const categoryIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid category ID"),
];