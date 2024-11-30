import {db} from "../index";
import {teacherMetaTable} from "../schema";
import {eq} from "drizzle-orm";

export async function getTeacherMetaByUserId(userId: string) {
  return db
    .select()
    .from(teacherMetaTable)
    .where(eq(teacherMetaTable.userId, userId));
}

export async function createTeacherMeta(data: {
  id: string;
  userId: string;
  tagsId: string[];
  aboutTeacher?: string;
  canHelpWith?: string;
  resume?: string;
}) {
  return db
    .insert(teacherMetaTable)
    .values({
      ...data,
      tagsId: JSON.stringify(data.tagsId),
    })
    .returning();
}

export async function updateTeacherMeta(
  userId: string,
  data: {
    tagsId?: string[];
    aboutTeacher?: string;
    canHelpWith?: string;
    resume?: string;
  }
) {
  const updateData = {
    ...data,
    tagsId: data.tagsId ? JSON.stringify(data.tagsId) : undefined,
  };

  return db
    .update(teacherMetaTable)
    .set(updateData)
    .where(eq(teacherMetaTable.userId, userId))
    .returning();
}

export async function deleteTeacherMeta(userId: string) {
  return db
    .delete(teacherMetaTable)
    .where(eq(teacherMetaTable.userId, userId))
    .returning();
}
