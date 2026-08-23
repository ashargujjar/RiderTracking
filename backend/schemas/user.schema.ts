import { Schema, model, type InferSchemaType } from "mongoose";
import bcrypt from "bcryptjs";

// Admin accounts only, for now — customer/rider accounts will get their own schema later.
const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },

    password: { type: String, required: true },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
