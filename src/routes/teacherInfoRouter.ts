import {Router, Response} from "express";
import {AuthRequest, authMiddleware} from "../middleware/authMiddleware";
import {v4 as uuidv4} from "uuid";
import * as teacherMetaQueries from "../db/queries/teacherMeta";
import {ROLES} from "../db/seed";

const teacherMetaRouter = Router();

teacherMetaRouter.use(authMiddleware as any);

const teacherOnly = async (req: AuthRequest, res: Response, next: Function) => {
  if (req.user?.roleId !== ROLES.TEACHER) {
    return res
      .status(403)
      .json({message: "Only teachers can access this resource"});
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: TeacherInfo
 *   description: Teacher information management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TeacherInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Info's unique ID
 *         userId:
 *           type: string
 *           description: Teacher's user ID
 *         tagsId:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of tag IDs
 *         aboutTeacher:
 *           type: string
 *           description: About the teacher
 *         canHelpWith:
 *           type: string
 *           description: What the teacher can help with
 *         resume:
 *           type: string
 *           description: Teacher's resume
 */

/**
 * @swagger
 * /teacher-info:
 *   get:
 *     summary: Get teacher's own information
 *     tags: [TeacherInfo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherInfo'
 *       403:
 *         description: Not authorized (teacher role required)
 *       404:
 *         description: Information not found
 *       500:
 *         description: Server error
 */
teacherMetaRouter.get(
  "/",
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const meta = await teacherMetaQueries.getTeacherMetaByUserId(userId);

      if (!meta.length) {
        return res.status(404).json({message: "Teacher metadata not found"});
      }

      res.json(meta[0]);
    } catch (error) {
      console.error("Get teacher meta error:", error);
      res.status(500).json({message: "Failed to get teacher metadata"});
    }
  }
);

/**
 * @swagger
 * /teacher-info:
 *   post:
 *     summary: Create teacher's metadata
 *     tags: [TeacherInfo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tagsId:
 *                 type: string
 *               aboutTeacher:
 *                 type: string
 *               canHelpWith:
 *                 type: string
 *               resume:
 *                 type: string
 *     responses:
 *       201:
 *         description: Metadata created successfully
 *       400:
 *         description: Metadata already exists
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
teacherMetaRouter.post(
  "/",
  // @ts-ignore
  teacherOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const {tagsId, aboutTeacher, canHelpWith, resume} = req.body;

      // Check if meta already exists
      const existingMeta = await teacherMetaQueries.getTeacherMetaByUserId(
        userId
      );
      if (existingMeta.length > 0) {
        return res
          .status(400)
          .json({message: "Teacher metadata already exists"});
      }

      const newMeta = await teacherMetaQueries.createTeacherMeta({
        id: uuidv4(),
        userId,
        tagsId,
        aboutTeacher,
        canHelpWith,
        resume,
      });

      res.status(201).json(newMeta[0]);
    } catch (error) {
      console.error("Create teacher meta error:", error);
      res.status(500).json({message: "Failed to create teacher metadata"});
    }
  }
);

/**
 * @swagger
 * /teacher-info:
 *   put:
 *     summary: Update teacher's metadata
 *     tags: [TeacherInfo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tagsId:
 *                 type: string
 *               aboutTeacher:
 *                 type: string
 *               canHelpWith:
 *                 type: string
 *               resume:
 *                 type: string
 *     responses:
 *       200:
 *         description: Metadata updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Metadata not found
 *       500:
 *         description: Server error
 */
teacherMetaRouter.put(
  "/",
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const {tagsId, aboutTeacher, canHelpWith, resume} = req.body;

      const updatedMeta = await teacherMetaQueries.updateTeacherMeta(userId, {
        tagsId,
        aboutTeacher,
        canHelpWith,
        resume,
      });

      if (!updatedMeta.length) {
        return res.status(404).json({message: "Teacher metadata not found"});
      }

      res.json(updatedMeta[0]);
    } catch (error) {
      console.error("Update teacher meta error:", error);
      res.status(500).json({message: "Failed to update teacher metadata"});
    }
  }
);

/**
 * @swagger
 * /teacher-info:
 *   delete:
 *     summary: Delete teacher's metadata
 *     tags: [TeacherInfo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metadata deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Metadata not found
 *       500:
 *         description: Server error
 */
teacherMetaRouter.delete(
  "/",
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const deletedMeta = await teacherMetaQueries.deleteTeacherMeta(userId);

      if (!deletedMeta.length) {
        return res.status(404).json({message: "Teacher metadata not found"});
      }

      res.json({message: "Teacher metadata deleted successfully"});
    } catch (error) {
      console.error("Delete teacher meta error:", error);
      res.status(500).json({message: "Failed to delete teacher metadata"});
    }
  }
);

/**
 * @swagger
 * /teacher-info/search:
 *   get:
 *     summary: Search for teachers by tag names
 *     tags: [TeacherInfo]
 *     parameters:
 *       - in: query
 *         name: tags
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated list of tag names
 *     responses:
 *       200:
 *         description: List of teachers matching the tags
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   teacherId:
 *                     type: string
 *                   teacherName:
 *                     type: string
 *                   teacherSurname:
 *                     type: string
 *                   aboutTeacher:
 *                     type: string
 *                   canHelpWith:
 *                     type: string
 *                   tagsId:
 *                     type: array
 *                     items:
 *                       type: string
 *       400:
 *         description: No tags provided
 *       500:
 *         description: Server error
 */

teacherMetaRouter.get(
  "/search",
  // @ts-ignore
  async (req: Request<any, any, any, {tags?: string}>, res: Response) => {
    try {
      const tagsParam = req.query.tags;

      if (!tagsParam) {
        return res.status(400).json({message: "No tags provided"});
      }

      // Split the comma-separated tags and trim whitespace
      const tagNames = tagsParam.split(",").map((tag: string) => tag.trim());

      if (!tagNames.length) {
        return res.status(400).json({message: "No valid tags provided"});
      }

      const teachers = await teacherMetaQueries.searchTeachersByTagNames(
        tagNames
      );
      res.json(teachers);
    } catch (error) {
      console.error("Search teachers error:", error);
      res.status(500).json({message: "Failed to search teachers"});
    }
  }
);

export default teacherMetaRouter;
