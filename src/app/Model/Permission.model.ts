import mongoose, { Document, Schema } from "mongoose";

export interface IPermission extends Document {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

const permissionSchema = new Schema<IPermission>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    resource: {
      type: String,
      required: true,
      trim: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Permission = mongoose.model<IPermission>(
  "Permission",
  permissionSchema
);

export default Permission;
