import {db} from "../index";
import {usersTable} from "../schema";
import {eq} from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

interface SignupData {
  id: string;
  username: string;
  password: string;
  name?: string;
  surname?: string;
  roleId: number;
}

export async function checkUserExists(username: string) {
  return db.select().from(usersTable).where(eq(usersTable.username, username));
}

export async function createUser(data: SignupData) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  return db
    .insert(usersTable)
    .values({
      ...data,
      password: hashedPassword,
    })
    .returning();
}

export async function generateToken(
  userId: string,
  username: string,
  roleId: number
) {
  return jwt.sign(
    {userId, username, roleId},
    process.env.JWT_SECRET || "your-secret-key",
    {expiresIn: "24h"}
  );
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}
