import mongoose, { Document, Schema } from "mongoose";

export interface IUserRole extends Document {
  user_id: mongoose.Types.ObjectId;
  role_id: mongoose.Types.ObjectId;
}

const userRoleSchema = new Schema<IUserRole>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      alias: "user",
    },

    role_id: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

userRoleSchema.index({ user_id: 1, role_id: 1 }, { unique: true });

export const UserRole = mongoose.model<IUserRole>("UserRole", userRoleSchema);
// user_roles

export default UserRole;
