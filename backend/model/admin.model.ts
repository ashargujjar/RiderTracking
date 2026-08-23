import bcrypt from "bcryptjs";

import { User as UserSchema } from "../schemas/user.schema";

export class Admin {
  static async login(username: string, password: string) {
    const admin = await UserSchema.findOne({ username });
    if (!admin) return null;

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return null;

    return admin;
  }
}