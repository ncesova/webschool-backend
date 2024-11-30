import {Router, Response} from "express";
import {
  AuthRequest,
  authMiddleware,
  teacherOnly,
} from "../middleware/authMiddleware";
import {v4 as uuidv4} from "uuid";
import * as lessonQueries from "../db/queries/lessons";
import * as lessonSummaryQueries from "../db/queries/lessonSummaries";
import * as gameQueries from "../db/queries/games";
import {upload} from "../middleware/uploadMiddleware";
import path from "path";
import fs from "fs";

const lessonRouter = Router();

lessonRouter.use(authMiddleware as any);

/**
 * @swagger
 * tags:
 *   name: Lessons
 *   description: Lesson management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Lesson:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Lesson's unique ID
 *         name:
 *           type: string
 *           description: Lesson name
 *         description:
 *           type: string
 *           description: Lesson description
 *         classroomId:
 *           type: string
 *           description: ID of the classroom this lesson belongs to
 *         gameIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of game IDs available in this lesson
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /lessons:
 *   post:
 *     summary: Create a new lesson (teachers only)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - classroomId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               classroomId:
 *                 type: string
 *               gameIds:
 *                 type: array
 *                 items:
 *                   type: string
 */
lessonRouter.post(
  "/",
  teacherOnly as any,
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {name, description, classroomId, gameIds = []} = req.body;

      if (!name || !classroomId) {
        return res.status(400).json({
          message: "Name and classroom ID are required",
        });
      }

      // Verify all game IDs exist
      if (gameIds.length > 0) {
        const games = await Promise.all(
          gameIds.map((id: string) => gameQueries.getGameById(id))
        );
        if (games.some((game) => !game.length)) {
          return res.status(400).json({message: "One or more games not found"});
        }
      }

      const newLesson = await lessonQueries.createLesson({
        id: uuidv4(),
        name,
        description,
        classroomId,
        gameIds,
      });

      res.status(201).json(newLesson[0]);
    } catch (error) {
      console.error("Create lesson error:", error);
      res.status(500).json({message: "Failed to create lesson"});
    }
  }
);

/**
 * @swagger
 * /lessons/classroom/{classroomId}:
 *   get:
 *     summary: Get all lessons in a classroom
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classroomId
 *         required: true
 *         schema:
 *           type: string
 */
lessonRouter.get(
  "/classroom/:classroomId",
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {classroomId} = req.params;
      const userId = req.user!.userId;

      // Check if user has access to this classroom
      const hasAccess = await lessonQueries.isUserInClassroom(
        userId,
        classroomId
      );
      if (!hasAccess) {
        return res.status(403).json({
          message: "You don't have access to this classroom's lessons",
        });
      }

      const lessons = await lessonQueries.getClassroomLessons(classroomId);
      res.json(lessons);
    } catch (error) {
      console.error("Get classroom lessons error:", error);
      res.status(500).json({message: "Failed to get lessons"});
    }
  }
);

/**
 * @swagger
 * /lessons/{id}:
 *   get:
 *     summary: Get a lesson by ID
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
lessonRouter.get(
  "/:id",
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;
      const userId = req.user!.userId;

      const lesson = await lessonQueries.getLessonById(id);
      if (!lesson.length) {
        return res.status(404).json({message: "Lesson not found"});
      }

      // Check if user has access to this lesson's classroom
      const hasAccess = await lessonQueries.isUserInClassroom(
        userId,
        lesson[0].classroomId
      );
      if (!hasAccess) {
        return res
          .status(403)
          .json({message: "You don't have access to this lesson"});
      }

      res.json(lesson[0]);
    } catch (error) {
      console.error("Get lesson error:", error);
      res.status(500).json({message: "Failed to get lesson"});
    }
  }
);

/**
 * @swagger
 * /lessons/{id}:
 *   put:
 *     summary: Update a lesson (teachers only)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
lessonRouter.put(
  "/:id",
  teacherOnly as any,
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;
      const {name, description, gameIds} = req.body;

      // Verify all game IDs exist if provided
      if (gameIds?.length > 0) {
        const games = await Promise.all(
          gameIds.map((gameId: string) => gameQueries.getGameById(gameId))
        );
        if (games.some((game) => !game.length)) {
          return res.status(400).json({message: "One or more games not found"});
        }
      }

      const updatedLesson = await lessonQueries.updateLesson(id, {
        name,
        description,
        gameIds,
      });

      if (!updatedLesson.length) {
        return res.status(404).json({message: "Lesson not found"});
      }

      res.json(updatedLesson[0]);
    } catch (error) {
      console.error("Update lesson error:", error);
      res.status(500).json({message: "Failed to update lesson"});
    }
  }
);

/**
 * @swagger
 * /lessons/{id}:
 *   delete:
 *     summary: Delete a lesson (teachers only)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
lessonRouter.delete(
  "/:id",
  teacherOnly as any,
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;

      const deletedLesson = await lessonQueries.deleteLesson(id);
      if (!deletedLesson.length) {
        return res.status(404).json({message: "Lesson not found"});
      }

      res.json({message: "Lesson deleted successfully"});
    } catch (error) {
      console.error("Delete lesson error:", error);
      res.status(500).json({message: "Failed to delete lesson"});
    }
  }
);

/**
 * @swagger
 * /lessons/{id}/summary:
 *   post:
 *     summary: Upload lesson summary file (teachers only)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 */
lessonRouter.post(
  "/:id/summary",
  teacherOnly as any,
  upload.single("file"),
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({message: "No file uploaded"});
      }

      const lesson = await lessonQueries.getLessonById(id);
      if (!lesson.length) {
        // Clean up uploaded file
        fs.unlinkSync(file.path);
        return res.status(404).json({message: "Lesson not found"});
      }

      // Check if summary already exists
      const existingSummary = await lessonSummaryQueries.getLessonSummary(id);
      if (existingSummary.length > 0) {
        // Delete old file
        const oldFilePath = path.join(
          process.cwd(),
          "uploads",
          existingSummary[0].fileKey
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }

        // Update summary record
        await lessonSummaryQueries.updateLessonSummary(id, {
          fileName: file.originalname,
          fileKey: file.filename,
          fileType: file.mimetype,
        });
      } else {
        // Create new summary record
        await lessonSummaryQueries.createLessonSummary({
          id: uuidv4(),
          lessonId: id,
          fileName: file.originalname,
          fileKey: file.filename,
          fileType: file.mimetype,
        });
      }

      res.status(201).json({
        message: "Summary file uploaded successfully",
        fileName: file.originalname,
      });
    } catch (error) {
      console.error("Upload summary error:", error);
      res.status(500).json({message: "Failed to upload summary"});
    }
  }
);

/**
 * @swagger
 * /lessons/{id}/summary:
 *   get:
 *     summary: Download lesson summary file
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
lessonRouter.get(
  "/:id/summary",
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;
      const userId = req.user!.userId;

      const lesson = await lessonQueries.getLessonById(id);
      if (!lesson.length) {
        return res.status(404).json({message: "Lesson not found"});
      }

      // Check if user has access to this lesson's classroom
      const hasAccess = await lessonQueries.isUserInClassroom(
        userId,
        lesson[0].classroomId
      );
      if (!hasAccess) {
        return res
          .status(403)
          .json({message: "You don't have access to this lesson"});
      }

      const summary = await lessonSummaryQueries.getLessonSummary(id);
      if (!summary.length) {
        return res.status(404).json({message: "No summary file found"});
      }

      const filePath = path.join(process.cwd(), "uploads", summary[0].fileKey);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({message: "Summary file not found"});
      }

      res.download(filePath, summary[0].fileName);
    } catch (error) {
      console.error("Download summary error:", error);
      res.status(500).json({message: "Failed to download summary"});
    }
  }
);

/**
 * @swagger
 * /lessons/{id}/summary:
 *   delete:
 *     summary: Delete lesson summary file (teachers only)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
lessonRouter.delete(
  "/:id/summary",
  teacherOnly as any,
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;

      const summary = await lessonSummaryQueries.getLessonSummary(id);
      if (!summary.length) {
        return res.status(404).json({message: "No summary file found"});
      }

      // Delete file
      const filePath = path.join(process.cwd(), "uploads", summary[0].fileKey);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete record
      await lessonSummaryQueries.deleteLessonSummary(id);

      res.json({message: "Summary file deleted successfully"});
    } catch (error) {
      console.error("Delete summary error:", error);
      res.status(500).json({message: "Failed to delete summary"});
    }
  }
);

export default lessonRouter;
