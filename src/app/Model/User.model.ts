import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  avatar?: string;

  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };

  refreshToken?: string;
  resetPasswordOtp?: string;
resetPasswordOtpExpires?: Date;

  isVerified: boolean;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    avatar: {
      type: String,
      default: "",
    },

    address: {
      street: {
        type: String,
        trim: true,
      },

      city: {
        type: String,
        trim: true,
      },

      state: {
        type: String,
        trim: true,
      },

      country: {
        type: String,
        trim: true,
        default: "India",
      },

      pincode: {
        type: String,
        trim: true,
      },

      deletedAt: {
        type: Date,
        default: null
      }
    },


refreshToken: {
  type: String,
  default: null,
},
resetPasswordOtp: {
  type: String,
  default: null,
},

resetPasswordOtpExpires: {
  type: Date,
  default: null,
},

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Auth = mongoose.model<IUser>("User", userSchema);

export default Auth;