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
    body("confirm_password").notEmpty().withMessage("confirm_password is required!").custom((value, { req }) => {
        const { password } = req.body

        if (password !== value) {
            Promise.reject("Passwords must be same!")
        }
        return true;

    }),

]