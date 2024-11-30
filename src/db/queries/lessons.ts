import {db} from "../index";
import {lessonsTable, classroomsTable} from "../schema";
import {eq, and, inArray} from "drizzle-orm";

export async function createLesson(data: {
  id: string;
  name: string;
  description?: string;
  classroomId: string;
  gameIds: string[];
}) {
  return db.insert(lessonsTable).values(data).returning();
}

export async function getLessonById(id: string) {
  return db.select().from(lessonsTable).where(eq(lessonsTable.id, id));
}

export async function getClassroomLessons(classroomId: string) {
  return db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.classroomId, classroomId))
    .orderBy(lessonsTable.createdAt);
}

export async function updateLesson(
  id: string,
  data: {
    name?: string;
    description?: string;
    gameIds?: string[];
    updatedAt?: Date;
  }
) {
  if (data.gameIds) {
    data = {
      ...data,
      updatedAt: new Date(),
    };
  }

  return db
    .update(lessonsTable)
    .set(data)
    .where(eq(lessonsTable.id, id))
    .returning();
}

export async function deleteLesson(id: string) {
  return db.delete(lessonsTable).where(eq(lessonsTable.id, id)).returning();
}

export async function isUserInClassroom(userId: string, classroomId: string) {
  const classroom = await db
    .select()
    .from(classroomsTable)
    .where(eq(classroomsTable.id, classroomId));

  if (!classroom.length) return false;

  const admins = JSON.parse(classroom[0].adminsId || "[]");
  const students = JSON.parse(classroom[0].studentsId || "[]");

  return admins.includes(userId) || students.includes(userId);
}
