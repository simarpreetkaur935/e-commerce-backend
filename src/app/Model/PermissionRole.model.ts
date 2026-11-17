import mongoose, { Document, Schema } from "mongoose";

export interface IPermissionRole extends Document {
  permission_id: mongoose.Types.ObjectId;
  role_id: mongoose.Types.ObjectId;
}

const permissionRoleSchema = new Schema<IPermissionRole>(
  {
    permission_id: {
      type: Schema.Types.ObjectId,
      ref: "Permission",
      required: true,
    },

    role_id: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

permissionRoleSchema.index(
  { permission_id: 1, role_id: 1 },
  { unique: true }
);

export const PermissionRole = mongoose.model<IPermissionRole>(
  "PermissionRole",
  permissionRoleSchema
);

export default PermissionRole;
