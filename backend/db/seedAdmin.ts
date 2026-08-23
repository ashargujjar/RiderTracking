import { User } from "../schemas/user.schema";

export async function seedAdmin(): Promise<void> {
  const username = process.env.ADMIN_USERNAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !email || !password) {
    console.warn("ADMIN_USERNAME/ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin seed.");
    return;
  }

  const existingAdmin = await User.findOne({ username });
  if (existingAdmin) return;

  await User.create({ username, email, password });
  console.log(`Seeded admin user "${username}".`);
}
