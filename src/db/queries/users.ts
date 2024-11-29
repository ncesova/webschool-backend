import {db} from "../index";
import {usersTable, classroomsTable} from "../schema";
import {eq} from "drizzle-orm";

export async function createUser(data: {
  id: string;
  username: string;
  password: string;
  roleId: number;
  name?: string;
  surname?: string;
}) {
  return db.insert(usersTable).values(data).returning();
}

export async function getUserByUsername(username: string) {
  return db.select().from(usersTable).where(eq(usersTable.username, username));
}

export async function getUserById(id: string) {
  return db.select().from(usersTable).where(eq(usersTable.id, id));
}

export async function updateUserClassroom(
  userId: string,
  classroomId: string | null
) {
  return db
    .update(usersTable)
    .set({classroomId})
    .where(eq(usersTable.id, userId));
}

export async function getClassroomUsers(classroomId: string) {
  return db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      name: usersTable.name,
      surname: usersTable.surname,
      roleId: usersTable.roleId,
    })
    .from(usersTable)
    .where(eq(usersTable.classroomId, classroomId));
}

export async function getAllUsers() {
  return db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      name: usersTable.name,
      surname: usersTable.surname,
      roleId: usersTable.roleId,
      classroomId: usersTable.classroomId,
    })
    .from(usersTable);
}
