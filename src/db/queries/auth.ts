import {db} from "../index";
import {usersTable} from "../schema";
import {eq} from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {ROLES} from "../seed";
import {v4 as uuidv4} from "uuid";
import * as parentChildQueries from "./parentChild";

interface SignupData {
  id: string;
  username: string;
  password: string;
  name?: string;
  surname?: string;
  roleId: number;
  parentId?: string;
}

export async function checkUserExists(username: string) {
  return db.select().from(usersTable).where(eq(usersTable.username, username));
}

export async function createUser(data: SignupData) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const {parentId, ...userData} = data;

  const newUser = await db
    .insert(usersTable)
    .values({
      ...userData,
      password: hashedPassword,
    })
    .returning();

  if (parentId && data.roleId === ROLES.STUDENT) {
    await parentChildQueries.addChildToParent({
      id: uuidv4(),
      parentId,
      childId: newUser[0].id,
    });
  }

  return newUser;
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
