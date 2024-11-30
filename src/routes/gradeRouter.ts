import {Router, Response, Request} from "express";
import {
  AuthRequest,
  authMiddleware,
  teacherOnly,
} from "../middleware/authMiddleware";
import {v4 as uuidv4} from "uuid";
import * as gradeQueries from "../db/queries/grades";
import * as lessonQueries from "../db/queries/lessons";
import {ROLES} from "../db/seed";
import * as parentChildQueries from "../db/queries/parentChild";

const gradeRouter = Router();
// @ts-ignore
gradeRouter.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Grades
 *   description: Grade management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Grade:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Grade's unique ID
 *         lessonId:
 *           type: string
 *           description: Lesson ID
 *         studentId:
 *           type: string
 *           description: Student ID
 *         grade:
 *           type: integer
 *           description: Grade value
 *         comment:
 *           type: string
 *           description: Optional comment
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /grades/lesson/{lessonId}:
 *   post:
 *     summary: Add or update a grade for a student (teachers only)
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - grade
 *             properties:
 *               studentId:
 *                 type: string
 *               grade:
 *                 type: integer
 *               comment:
 *                 type: string
 */
gradeRouter.post(
  "/lesson/:lessonId",
  // @ts-ignore
  teacherOnly,
  async (req: Request, res: Response) => {
    try {
      const {lessonId} = req.params;
      const {studentId, grade, comment} = req.body;

      if (!studentId || grade === undefined) {
        return res.status(400).json({
          message: "Student ID and grade are required",
        });
      }

      if (grade < 1 || grade > 5) {
        return res.status(400).json({
          message: "Grade must be between 1 and 5",
        });
      }

      // Check if lesson exists and teacher has access
      const lesson = await lessonQueries.getLessonById(lessonId);
      if (!lesson.length) {
        return res.status(404).json({message: "Lesson not found"});
      }

      // Check if grade already exists
      const existingGrade = await gradeQueries.getStudentLessonGrade(
        lessonId,
        studentId
      );

      let result;
      if (existingGrade.length > 0) {
        result = await gradeQueries.updateGrade(lessonId, studentId, {
          grade,
          comment,
        });
      } else {
        result = await gradeQueries.createGrade({
          id: uuidv4(),
          lessonId,
          studentId,
          grade,
          comment,
        });
      }

      res.status(201).json(result[0]);
    } catch (error) {
      console.error("Add/update grade error:", error);
      res.status(500).json({message: "Failed to add/update grade"});
    }
  }
);

/**
 * @swagger
 * /grades/lesson/{lessonId}:
 *   get:
 *     summary: Get all grades for a lesson (teachers only)
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 */
gradeRouter.get(
  "/lesson/:lessonId",
  // @ts-ignore
  teacherOnly,
  async (req: Request, res: Response) => {
    try {
      const {lessonId} = req.params;
      const grades = await gradeQueries.getLessonGrades(lessonId);
      res.json(grades);
    } catch (error) {
      console.error("Get lesson grades error:", error);
      res.status(500).json({message: "Failed to get grades"});
    }
  }
);

/**
 * @swagger
 * /grades/student/{studentId}:
 *   get:
 *     summary: Get all grades for a student
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student's user ID
 *     responses:
 *       200:
 *         description: List of student's grades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   lessonId:
 *                     type: string
 *                   grade:
 *                     type: integer
 *                   comment:
 *                     type: string
 */
gradeRouter.get(
  "/student/:studentId",
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {studentId} = req.params;
      const userId = req.user!.userId;

      // Allow access if:
      // 1. User is requesting their own data
      // 2. User is a teacher
      // 3. User is a parent of the student
      if (userId !== studentId && req.user!.roleId !== ROLES.TEACHER) {
        // If user is a parent, check if they have access to this student
        if (req.user!.roleId === ROLES.PARENT) {
          const isParent = await parentChildQueries.isParentOfChild(
            userId,
            studentId
          );
          if (!isParent) {
            return res.status(403).json({
              message: "Not authorized to access this student's data",
            });
          }
        } else {
          return res.status(403).json({
            message: "Not authorized to access this student's data",
          });
        }
      }

      const grades = await gradeQueries.getStudentGradesSimple(studentId);
      res.json(grades);
    } catch (error) {
      console.error("Get student grades error:", error);
      res.status(500).json({message: "Failed to get grades"});
    }
  }
);

/**
 * @swagger
 * /grades/lesson/{lessonId}/student/{studentId}:
 *   delete:
 *     summary: Delete a grade (teachers only)
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 */
gradeRouter.delete(
  "/lesson/:lessonId/student/:studentId",
  // @ts-ignore
  teacherOnly,
  async (req: Request, res: Response) => {
    try {
      const {lessonId, studentId} = req.params;

      const deletedGrade = await gradeQueries.deleteGrade(lessonId, studentId);
      if (!deletedGrade.length) {
        return res.status(404).json({message: "Grade not found"});
      }

      res.json({message: "Grade deleted successfully"});
    } catch (error) {
      console.error("Delete grade error:", error);
      res.status(500).json({message: "Failed to delete grade"});
    }
  }
);

/**
 * @swagger
 * /grades/classroom/{classroomId}:
 *   get:
 *     summary: Get all grades in a classroom (teachers only)
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classroomId
 *         required: true
 *         schema:
 *           type: string
 */
gradeRouter.get(
  "/classroom/:classroomId",
  // @ts-ignore
  teacherOnly,
  async (req: Request, res: Response) => {
    try {
      const {classroomId} = req.params;
      const grades = await gradeQueries.getClassroomGrades(classroomId);
      res.json(grades);
    } catch (error) {
      console.error("Get classroom grades error:", error);
      res.status(500).json({message: "Failed to get classroom grades"});
    }
  }
);

export default gradeRouter;
