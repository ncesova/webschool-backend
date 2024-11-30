import {db} from "../index";
import {gradesTable, usersTable, lessonsTable} from "../schema";
import {eq, and, desc} from "drizzle-orm";

export async function createGrade(data: {
  id: string;
  lessonId: string;
  studentId: string;
  grade: number;
  comment?: string;
}) {
  return db.insert(gradesTable).values(data).returning();
}

export async function updateGrade(
  lessonId: string,
  studentId: string,
  data: {
    grade: number;
    comment?: string;
  }
) {
  return db
    .update(gradesTable)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(gradesTable.lessonId, lessonId),
        eq(gradesTable.studentId, studentId)
      )
    )
    .returning();
}

export async function getStudentGrades(studentId: string) {
  return db
    .select({
      id: gradesTable.id,
      lessonId: gradesTable.lessonId,
      grade: gradesTable.grade,
      comment: gradesTable.comment,
      createdAt: gradesTable.createdAt,
      updatedAt: gradesTable.updatedAt,
      lessonName: lessonsTable.name,
    })
    .from(gradesTable)
    .innerJoin(lessonsTable, eq(lessonsTable.id, gradesTable.lessonId))
    .where(eq(gradesTable.studentId, studentId))
    .orderBy(desc(gradesTable.createdAt));
}

export async function getLessonGrades(lessonId: string) {
  return db
    .select({
      id: gradesTable.id,
      studentId: gradesTable.studentId,
      grade: gradesTable.grade,
      comment: gradesTable.comment,
      createdAt: gradesTable.createdAt,
      updatedAt: gradesTable.updatedAt,
      studentName: usersTable.name,
      studentSurname: usersTable.surname,
    })
    .from(gradesTable)
    .innerJoin(usersTable, eq(usersTable.id, gradesTable.studentId))
    .where(eq(gradesTable.lessonId, lessonId))
    .orderBy(desc(gradesTable.createdAt));
}

export async function getStudentLessonGrade(
  lessonId: string,
  studentId: string
) {
  return db
    .select()
    .from(gradesTable)
    .where(
      and(
        eq(gradesTable.lessonId, lessonId),
        eq(gradesTable.studentId, studentId)
      )
    );
}

export async function deleteGrade(lessonId: string, studentId: string) {
  return db
    .delete(gradesTable)
    .where(
      and(
        eq(gradesTable.lessonId, lessonId),
        eq(gradesTable.studentId, studentId)
      )
    )
    .returning();
}

export async function getClassroomGrades(classroomId: string) {
  return db
    .select({
      id: gradesTable.id,
      lessonId: gradesTable.lessonId,
      studentId: gradesTable.studentId,
      grade: gradesTable.grade,
      comment: gradesTable.comment,
      createdAt: gradesTable.createdAt,
      updatedAt: gradesTable.updatedAt,
      lessonName: lessonsTable.name,
      studentName: usersTable.name,
      studentSurname: usersTable.surname,
    })
    .from(gradesTable)
    .innerJoin(lessonsTable, eq(lessonsTable.id, gradesTable.lessonId))
    .innerJoin(usersTable, eq(usersTable.id, gradesTable.studentId))
    .where(eq(lessonsTable.classroomId, classroomId))
    .orderBy(desc(gradesTable.createdAt));
}

export async function getStudentGradesSimple(studentId: string) {
  return db
    .select({
      lessonId: gradesTable.lessonId,
      grade: gradesTable.grade,
      comment: gradesTable.comment,
    })
    .from(gradesTable)
    .where(eq(gradesTable.studentId, studentId))
    .orderBy(desc(gradesTable.createdAt));
}
