import { body, param } from "express-validator";
import User from "../Model/User.model";
import Category from "../Model/Category.model";
import Product from "../Model/Product.model";
import Wishlist from "../Model/wishlist.model";

// ? ********************************************* Registers *********************************************

export const registerValidations = [
  body("name")
    .notEmpty()
    .withMessage("Name is required!"),

  body("email")
    .notEmpty()
    .withMessage("Email is required!")
    .custom(async (value) => {
      const isExist = await User.findOne({
        email: value,
      });

      if (!isExist) {
        return true;
      }

      return Promise.reject(
        "Email already exist. Try again!"
      );
    }),

  body("phone")
    .notEmpty()
    .withMessage("phone is required!")
    .custom(async (value) => {
      const isExist = await User.findOne({
        phone: value,
      });

      if (!isExist) {
        return true;
      }

      return Promise.reject(
        "Phone number already exists!"
      );
    }),

  body("password")
    .notEmpty()
    .withMessage("password is required!"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("confirm_password is required!")
    .custom((value, { req }) => {
      const { password } = req.body;

      if (password !== value) {
        return Promise.reject(
          "Passwords must be same!"
        );
      }

      return true;
    }),
];
//login
// Login validations

export const loginValidations = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email")
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: value });

      if (!user) {
        return Promise.reject("No account found with this email");
      }
      req.body.user = user;
      return true;
    }),

  body("password").notEmpty().withMessage("Password is required"),
];
//for forget password
export const forgotPasswordValidations = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email")
    .custom(async (value, { req }) => {
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
    .custom(async (value, { req }) => {
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
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),

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
        return Promise.reject("Phone number already registered");
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

  body("user").custom(async (_value, { req }) => {
    const userId = (req as any).userId;

    const user = await User.findById(userId);

    if (!user) {
      return Promise.reject("User not found");
    }

    req.body.user = user;

    return true;
  }),
];
//for category controller

// =========================
// CREATE CATEGORY
// =========================



export const createCategoryValidations = [
  body("name")
    .notEmpty()
    .withMessage("Category name is required")
    .trim()
    .custom(async (value) => {
      const category = await Category.findOne({
        name: value,
      });

      if (category) {
        return Promise.reject("Category already exists");
      }

      return true;
    }),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  body("image")
    .optional()
    .isString()
    .withMessage("Image must be a string"),

  body("parentCategory")
    .optional()
    .isMongoId()
    .withMessage("Invalid parent category ID")
    .custom(async (value) => {
      const parent = await Category.findById(value);

      if (!parent) {
        return Promise.reject("Parent category not found");
      }

      return true;
    }),
];

//update category

export const updateCategoryValidations = [

  // Check category ID
  param("id")
    .isMongoId()
    .withMessage("Invalid category ID"),

  // Check name
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category name cannot be empty")
    .custom(async (value, { req }) => {
      const existingCategory = await Category.findOne({
        name: value,
        _id: { $ne: req.params?.id },
      });

      if (existingCategory) {
        return Promise.reject("Category name already exists");
      }

      return true;
    }),

  // Description
  body("description")
    .optional()
    .trim(),

  // Image
  body("image")
    .optional()
    .trim(),

  // Parent category
  body("parentCategory")
    .optional({ nullable: true })
    .custom(async (value, { req }) => {

      // Allow empty parent category
      if (value === "" || value === null) {
        return true;
      }

      // Category cannot be its own parent
      if (value === req.params?.id) {
        return Promise.reject(
          "A category cannot be its own parent"
        );
      }

      // Parent category must exist
      const parent = await Category.findById(value);

      if (!parent) {
        return Promise.reject(
          "Parent category not found"
        );
      }

      return true;
    }),

  // isActive
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];
// =========================
// CATEGORY ID VALIDATION
// =========================

export const categoryIdValidation = [
  param("id").isMongoId().withMessage("Invalid category ID"),
];
//product controller

// =========================
// CREATE PRODUCT VALIDATION
// =========================

export const createProductValidations = [

  // Name
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required"),

  // Description
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Product description is required"),

  // Brand
  body("brand")
    .optional()
    .trim(),

  // Category
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isMongoId()
    .withMessage("Invalid category ID")
    .custom(async (value) => {
      const category = await Category.findById(value);

      if (!category) {
        return Promise.reject("Category not found");
      }

      return true;
    }),

  // Images
  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array"),

  // Price
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  // Discount Price
  body("discountPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount price must be a positive number"),

  // Tax
  body("tax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax must be a positive number"),

  // Stock
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock cannot be negative"),

  // SKU
  body("sku")
    .trim()
    .notEmpty()
    .withMessage("SKU is required")
    .custom(async (value) => {
      const existingProduct = await Product.findOne({
        sku: value,
      });

      if (existingProduct) {
        return Promise.reject(
          "Product with this SKU already exists"
        );
      }

      return true;
    }),

  // Low Stock Threshold
  body("lowStockThreshold")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Low stock threshold cannot be negative"),

  // Specifications
  body("specifications")
    .optional()
    .isObject()
    .withMessage("Specifications must be an object"),

  // Tags
  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array"),

  // Weight
  body("weight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Weight cannot be negative"),

  // Active status
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),

  // Featured status
  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be a boolean"),
];
//get by id,//del by id


// =========================
// PRODUCT ID VALIDATION
// =========================

export const productIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid product ID"),
];
// related product validation
export const getRelatedProductsValidations = [
  param("id")
    .isMongoId()
    .withMessage("Invalid product ID")
    .custom(async (value) => {
      const product = await Product.findById(value);

      if (!product) {
        return Promise.reject("Product not found");
      }

      return true;
    }),
];
//update product


// =========================
// UPDATE PRODUCT VALIDATION
// =========================

export const updateProductValidations = [

  // Product ID
  param("id")
    .isMongoId()
    .withMessage("Invalid product ID"),


  // Name
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Product name cannot be empty"),


  // Description
  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Product description cannot be empty"),


  // Brand
  body("brand")
    .optional()
    .trim(),


  // Category
  body("category")
    .optional()
    .isMongoId()
    .withMessage("Invalid category ID")
    .custom(async (value) => {
      const category = await Category.findById(value);

      if (!category) {
        return Promise.reject("Category not found");
      }

      return true;
    }),


  // Images
  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array"),


  // Price
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),


  // Discount Price
  body("discountPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount price must be a positive number"),


  // Tax
  body("tax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax must be a positive number"),


  // Stock
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock cannot be negative"),


  // SKU
  body("sku")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("SKU cannot be empty")
    .custom(async (value, { req }) => {
      const existingProduct = await Product.findOne({
        sku: value,
        _id: { $ne: req.params?.id },
      });

      if (existingProduct) {
        return Promise.reject("SKU already exists");
      }

      return true;
    }),


  // Low Stock Threshold
  body("lowStockThreshold")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Low stock threshold cannot be negative"),


  // Specifications
  body("specifications")
    .optional()
    .isObject()
    .withMessage("Specifications must be an object"),


  // Tags
  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array"),


  // Weight
  body("weight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Weight cannot be negative"),


  // Active status
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),


  // Featured status
  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be a boolean"),
];
///add to wishlist 


export const addWishlistValidation = [
  param("productId")
    .notEmpty()
    .withMessage("Product ID is required")

    .isMongoId()
    .withMessage("Invalid Product ID")

    .custom(async (productId, { req }) => {
      // Check product exists
      const product = await Product.findById(productId);

      if (!product) {
        throw new Error("Product not found");
      }

      // Get logged-in user
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new Error("Unauthorized");
      }

      // Check wishlist
      const existingWishlist = await Wishlist.findOne({
        user: userId,
        product: productId,
      });

      if (existingWishlist) {
        throw new Error("Product already exists in wishlist");
      }

      return true;
    }),
];
// =========================
// GET MY WISHLIST
// =========================

export const getMyWishlistValidations = [
  body("user").custom(async (_value, { req }) => {
    const userId = (req as any).user?.id;

    // Check logged-in user
    if (!userId) {
      return Promise.reject("Unauthorized");
    }

    // Check user exists in database
    const user = await User.findById(userId);

    if (!user) {
      return Promise.reject("User not found");
    }

    return true;
  }),
];
//remove wishlist
// =========================
// REMOVE FROM WISHLIST
// =========================

export const removeWishlistValidation = [
  param("productId")
    .notEmpty()
    .withMessage("Product ID is required")

    .isMongoId()
    .withMessage("Invalid Product ID")

    .custom(async (productId, { req }) => {
      // Check logged-in user
      const userId = (req as any).user?.id;

      if (!userId) {
        return Promise.reject("Unauthorized");
      }

      // Check product exists
      const product = await Product.findById(productId);

      if (!product) {
        return Promise.reject("Product not found");
      }

      // Check product exists in user's wishlist
      const wishlist = await Wishlist.findOne({
        user: userId,
        product: productId,
      });

      if (!wishlist) {
        return Promise.reject(
          "Product not found in wishlist"
        );
      }

      return true;
    }),
];