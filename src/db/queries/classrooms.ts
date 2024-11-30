import {db} from "../index";
import {classroomsTable, usersTable} from "../schema";
import {eq, inArray, and} from "drizzle-orm";
import {ROLES} from "../seed";
import {sql} from "drizzle-orm";

export async function createClassroom(data: {
  id: string;
  name: string;
  adminsId: string;
  studentsId: string;
}) {
  return db
    .insert(classroomsTable)
    .values({
      ...data,
    })
    .returning();
}

export async function getClassroomById(id: string) {
  return db.select().from(classroomsTable).where(eq(classroomsTable.id, id));
}

export async function updateClassroomUsers(
  id: string,
  data: {adminsId: string[]; studentsId: string[]}
) {
  return db
    .update(classroomsTable)
    .set({
      adminsId: JSON.stringify(data.adminsId),
      studentsId: JSON.stringify(data.studentsId),
    })
    .where(eq(classroomsTable.id, id));
}

export async function deleteClassroom(id: string) {
  await db
    .update(usersTable)
    .set({classroomId: null})
    .where(eq(usersTable.classroomId, id));

  return db.delete(classroomsTable).where(eq(classroomsTable.id, id));
}

export async function removeUsersFromClassroom(
  classroomId: string,
  userIds: string[]
) {
  const classroom = await getClassroomById(classroomId);
  if (!classroom.length) return null;

  const currentClassroom = classroom[0];
  const admins = JSON.parse(currentClassroom.adminsId || "[]");
  const students = JSON.parse(currentClassroom.studentsId || "[]");

  const newAdmins = admins.filter((id: string) => !userIds.includes(id));
  const newStudents = students.filter((id: string) => !userIds.includes(id));

  await updateClassroomUsers(classroomId, {
    adminsId: newAdmins,
    studentsId: newStudents,
  });

  await db
    .update(usersTable)
    .set({classroomId: null})
    .where(
      and(
        eq(usersTable.classroomId, classroomId),
        inArray(usersTable.id, userIds)
      )
    );

  return {newAdmins, newStudents};
}

export async function addUsersToClassroom(
  classroomId: string,
  userIds: string[]
) {
  const classroom = await getClassroomById(classroomId);
  if (!classroom.length) return null;

  const currentClassroom = classroom[0];
  const adminsArray = JSON.parse(currentClassroom.adminsId || "[]");
  const studentsArray = JSON.parse(currentClassroom.studentsId || "[]");

  // Get all users with their roles
  const users = await db
    .select({
      id: usersTable.id,
      roleId: usersTable.roleId,
    })
    .from(usersTable)
    .where(inArray(usersTable.id, userIds));

  users.forEach(({id, roleId}) => {
    if (roleId === ROLES.TEACHER && !adminsArray.includes(id)) {
      adminsArray.push(id);
    } else if (roleId === ROLES.STUDENT && !studentsArray.includes(id)) {
      studentsArray.push(id);
    }
    // Parents are not added to either array
  });

  await updateClassroomUsers(classroomId, {
    adminsId: adminsArray,
    studentsId: studentsArray,
  });

  // Update all users' classroomId at once
  await db
    .update(usersTable)
    .set({classroomId})
    .where(inArray(usersTable.id, userIds));

  return {adminsArray, studentsArray};
}

export async function getTeacherClassrooms(teacherId: string) {
  return db
    .select({
      id: classroomsTable.id,
      name: classroomsTable.name,
      adminsId: classroomsTable.adminsId,
      studentsId: classroomsTable.studentsId,
    })
    .from(classroomsTable)
    .where(
      sql`${classroomsTable.adminsId}::jsonb @> ${JSON.stringify([
        teacherId,
      ])}::jsonb`
    );
}

export async function getClassroomWithDetails(id: string) {
  const classroom = await db
    .select()
    .from(classroomsTable)
    .where(eq(classroomsTable.id, id));

  if (!classroom.length) return null;

  const admins = JSON.parse(classroom[0].adminsId || "[]");
  const students = JSON.parse(classroom[0].studentsId || "[]");

  // Get admin details
  const adminDetails = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      name: usersTable.name,
      surname: usersTable.surname,
    })
    .from(usersTable)
    .where(inArray(usersTable.id, admins));

  // Get student details
  const studentDetails = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      name: usersTable.name,
      surname: usersTable.surname,
    })
    .from(usersTable)
    .where(inArray(usersTable.id, students));

  return {
    ...classroom[0],
    admins: adminDetails,
    students: studentDetails,
  };
}
