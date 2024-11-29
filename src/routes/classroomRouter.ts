import {Router, Response} from "express";
import {
  AuthRequest,
  authMiddleware,
  teacherOnly,
} from "../middleware/authMiddleware";
import {v4 as uuidv4} from "uuid";
import * as classroomQueries from "../db/queries/classrooms";

const classroomRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Classrooms
 *   description: Classroom management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Classroom:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Classroom's unique ID
 *         name:
 *           type: string
 *           description: Classroom name
 *         adminsId:
 *           type: string
 *           description: JSON string array of admin user IDs
 *         studentsId:
 *           type: string
 *           description: JSON string array of student user IDs
 */

classroomRouter.use(authMiddleware as any);

/**
 * @swagger
 * /classroom:
 *   post:
 *     summary: Create a new classroom (teachers only)
 *     tags: [Classrooms]
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
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Classroom created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Classroom'
 *       403:
 *         description: Not authorized (teacher role required)
 *       500:
 *         description: Server error
 */
classroomRouter.post(
  "/",
  teacherOnly as any,
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const teacherId = req.user!.userId;
      const {name} = req.body;

      const newClassroom = await classroomQueries.createClassroom({
        id: uuidv4(),
        adminsId: JSON.stringify([teacherId]),
        studentsId: JSON.stringify([]),
        name,
      });

      res.status(201).json(newClassroom[0]);
    } catch (error) {
      res.status(500).json({message: "Failed to create classroom" + error});
    }
  }
);

/**
 * @swagger
 * /classroom/{id}:
 *   delete:
 *     summary: Delete a classroom (teachers only)
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Classroom ID
 *     responses:
 *       200:
 *         description: Classroom deleted successfully
 *       403:
 *         description: Not authorized or not classroom admin
 *       404:
 *         description: Classroom not found
 *       500:
 *         description: Server error
 */
classroomRouter.delete(
  "/:id",
  teacherOnly as any,
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;
      const teacherId = req.user!.userId;

      const classroom = await classroomQueries.getClassroomById(id);
      if (!classroom.length) {
        return res.status(404).json({message: "Classroom not found"});
      }

      const admins = JSON.parse(classroom[0].adminsId || "[]");
      if (!admins.includes(teacherId)) {
        return res
          .status(403)
          .json({message: "Only classroom admins can delete it"});
      }

      await classroomQueries.deleteClassroom(id);
      res.status(200).json({message: "Classroom deleted"});
    } catch (error) {
      res.status(500).json({message: "Failed to delete classroom" + error});
    }
  }
);

/**
 * @swagger
 * /classroom/{id}/users:
 *   post:
 *     summary: Add a user to classroom (teachers only)
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Classroom ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, student]
 *     responses:
 *       200:
 *         description: User added to classroom
 *       403:
 *         description: Not authorized or not classroom admin
 *       404:
 *         description: Classroom not found
 *       500:
 *         description: Server error
 */
classroomRouter.post(
  "/:id/users",
  teacherOnly as any,
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;
      const {userId, role} = req.body;
      const teacherId = req.user!.userId;

      const classroom = await classroomQueries.getClassroomById(id);
      if (!classroom.length) {
        return res.status(404).json({message: "Classroom not found"});
      }

      const admins = JSON.parse(classroom[0].adminsId || "[]");
      if (!admins.includes(teacherId)) {
        return res
          .status(403)
          .json({message: "Only classroom admins can add users"});
      }

      await classroomQueries.addUserToClassroom(
        id,
        userId,
        role as "admin" | "student"
      );
      res.status(200).json({message: "User added to classroom"});
    } catch (error) {
      res.status(500).json({message: "Failed to add user to classroom"});
    }
  }
);

/**
 * @swagger
 * /classroom/{id}/users/{userId}:
 *   delete:
 *     summary: Remove a user from classroom
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Classroom ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to remove
 *     responses:
 *       200:
 *         description: User removed from classroom
 *       404:
 *         description: Classroom not found
 *       500:
 *         description: Server error
 */
classroomRouter.delete(
  "/:id/users/:userId",
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {id, userId} = req.params;

      const result = await classroomQueries.removeUserFromClassroom(id, userId);
      if (!result) {
        return res.status(404).json({message: "Classroom not found"});
      }

      res.status(200).json({message: "User removed from classroom"});
    } catch (error) {
      res.status(500).json({message: "Failed to remove user from classroom"});
    }
  }
);

export default classroomRouter;
