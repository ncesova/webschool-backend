import {db} from "../index";
import {teacherMetaTable, usersTable, tagsTable} from "../schema";
import {eq, inArray, sql} from "drizzle-orm";

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

export async function findTeachersByTags(tagIds: string[]) {
  return db
    .select({
      teacherId: teacherMetaTable.userId,
      teacherName: usersTable.name,
      teacherSurname: usersTable.surname,
      aboutTeacher: teacherMetaTable.aboutTeacher,
      canHelpWith: teacherMetaTable.canHelpWith,
      tagsId: teacherMetaTable.tagsId,
    })
    .from(teacherMetaTable)
    .innerJoin(usersTable, eq(usersTable.id, teacherMetaTable.userId))
    .where(
      sql`${teacherMetaTable.tagsId}::jsonb ?| array[${sql.join(tagIds)}]`
    );
}

export async function searchTeachersByTagNames(tagNames: string[]) {
  // First, get tag IDs from names
  const tags = await db
    .select()
    .from(tagsTable)
    .where(inArray(tagsTable.name, tagNames));

  if (!tags.length) return [];

  const tagIds = tags.map((tag) => tag.id);
  return findTeachersByTags(tagIds);
}
