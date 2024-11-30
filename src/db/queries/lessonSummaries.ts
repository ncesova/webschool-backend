import {db} from "../index";
import {lessonSummariesTable} from "../schema";
import {eq} from "drizzle-orm";

export async function createLessonSummary(data: {
  id: string;
  lessonId: string;
  fileName: string;
  fileKey: string;
  fileType: string;
}) {
  return db.insert(lessonSummariesTable).values(data).returning();
}

export async function getLessonSummary(lessonId: string) {
  return db
    .select()
    .from(lessonSummariesTable)
    .where(eq(lessonSummariesTable.lessonId, lessonId));
}

export async function updateLessonSummary(
  lessonId: string,
  data: {
    fileName: string;
    fileKey: string;
    fileType: string;
  }
) {
  return db
    .update(lessonSummariesTable)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(lessonSummariesTable.lessonId, lessonId))
    .returning();
}

export async function deleteLessonSummary(lessonId: string) {
  return db
    .delete(lessonSummariesTable)
    .where(eq(lessonSummariesTable.lessonId, lessonId))
    .returning();
}
