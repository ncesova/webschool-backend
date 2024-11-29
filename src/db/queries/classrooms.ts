import {db} from "../index";
import {classroomsTable, usersTable} from "../schema";
import {eq} from "drizzle-orm";

export async function createClassroom(data: {
  id: string;
  name: string;
  adminsId: string;
  studentsId: string;
}) {
  return db.insert(classroomsTable).values(data).returning();
}

export async function getClassroomById(id: string) {
  return db.select().from(classroomsTable).where(eq(classroomsTable.id, id));
}

export async function updateClassroomUsers(
  id: string,
  data: {adminsId: string; studentsId: string}
) {
  return db.update(classroomsTable).set(data).where(eq(classroomsTable.id, id));
}

export async function deleteClassroom(id: string) {
  await db
    .update(usersTable)
    .set({classroomId: null})
    .where(eq(usersTable.classroomId, id));

  return db.delete(classroomsTable).where(eq(classroomsTable.id, id));
}

export async function removeUserFromClassroom(
  classroomId: string,
  userId: string
) {
  const classroom = await getClassroomById(classroomId);
  if (!classroom.length) return null;

  const currentClassroom = classroom[0];
  const admins = JSON.parse(currentClassroom.adminsId || "[]");
  const students = JSON.parse(currentClassroom.studentsId || "[]");

  const newAdmins = admins.filter((id: string) => id !== userId);
  const newStudents = students.filter((id: string) => id !== userId);

  await updateClassroomUsers(classroomId, {
    adminsId: JSON.stringify(newAdmins),
    studentsId: JSON.stringify(newStudents),
  });

  await db
    .update(usersTable)
    .set({classroomId: null})
    .where(eq(usersTable.id, userId));

  return {newAdmins, newStudents};
}

export async function addUserToClassroom(
  classroomId: string,
  userId: string,
  role: "admin" | "student"
) {
  const classroom = await getClassroomById(classroomId);
  if (!classroom.length) return null;

  const currentClassroom = classroom[0];
  const adminsArray = JSON.parse(currentClassroom.adminsId || "[]");
  const studentsArray = JSON.parse(currentClassroom.studentsId || "[]");

  if (role === "admin") {
    adminsArray.push(userId);
    await updateClassroomUsers(classroomId, {
      adminsId: JSON.stringify(adminsArray),
      studentsId: JSON.stringify(studentsArray),
    });
  } else {
    studentsArray.push(userId);
    await updateClassroomUsers(classroomId, {
      adminsId: JSON.stringify(adminsArray),
      studentsId: JSON.stringify(studentsArray),
    });
  }

  await db
    .update(usersTable)
    .set({classroomId})
    .where(eq(usersTable.id, userId));

  return {adminsArray, studentsArray};
}
