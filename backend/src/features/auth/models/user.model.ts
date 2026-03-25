import mongoose, { InferSchemaType, Schema } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    bestScore: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    collection: "users",
    timestamps: true,
    versionKey: false,
  },
);

userSchema.index({ email: 1 }, { unique: true });

export type UserRecord = InferSchemaType<typeof userSchema>;

export const User = mongoose.models.User || mongoose.model<UserRecord>("User", userSchema);
