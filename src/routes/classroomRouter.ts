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
 *     summary: Add users to classroom (teachers only)
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
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to add (teachers will be added as admins, students as students)
 */
classroomRouter.post(
  "/:id/users",
  teacherOnly as any,
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;
      const {userIds} = req.body;
      const teacherId = req.user!.userId;

      if (!Array.isArray(userIds)) {
        return res.status(400).json({message: "UserIds must be an array"});
      }

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

      await classroomQueries.addUsersToClassroom(id, userIds);
      res.status(200).json({message: "Users added to classroom"});
    } catch (error) {
      console.error("Add users to classroom error:", error);
      res.status(500).json({message: "Failed to add users to classroom"});
    }
  }
);

/**
 * @swagger
 * /classroom/{id}/users:
 *   delete:
 *     summary: Remove multiple users from classroom
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
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 */
classroomRouter.delete(
  "/:id/users",
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;
      const {userIds} = req.body;

      if (!Array.isArray(userIds)) {
        return res.status(400).json({message: "UserIds must be an array"});
      }

      const result = await classroomQueries.removeUsersFromClassroom(
        id,
        userIds
      );
      if (!result) {
        return res.status(404).json({message: "Classroom not found"});
      }

      res.status(200).json({message: "Users removed from classroom"});
    } catch (error) {
      console.error("Remove users from classroom error:", error);
      res.status(500).json({message: "Failed to remove users from classroom"});
    }
  }
);

/**
 * @swagger
 * /classroom/teacher:
 *   get:
 *     summary: Get all classrooms where the teacher is an admin
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classrooms
 *       403:
 *         description: Not authorized (teacher role required)
 *       500:
 *         description: Server error
 */
classroomRouter.get(
  "/teacher",
  // @ts-ignore
  teacherOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const teacherId = req.user!.userId;
      const classrooms = await classroomQueries.getTeacherClassrooms(teacherId);
      res.json(classrooms);
    } catch (error) {
      console.error("Get teacher classrooms error:", error);
      res.status(500).json({message: "Failed to get classrooms"});
    }
  }
);

/**
 * @swagger
 * /classroom/{id}/details:
 *   get:
 *     summary: Get detailed classroom information
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
 *         description: Classroom details including admin and student information
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Classroom not found
 *       500:
 *         description: Server error
 */
// @ts-ignore
classroomRouter.get("/:id/details", async (req: AuthRequest, res: Response) => {
  try {
    const {id} = req.params;
    const userId = req.user!.userId;

    const classroom = await classroomQueries.getClassroomWithDetails(id);
    if (!classroom) {
      return res.status(404).json({message: "Classroom not found"});
    }

    // Check if user has access to this classroom
    const admins = classroom.admins.map((admin) => admin.id);
    const students = classroom.students.map((student) => student.id);

    if (!admins.includes(userId) && !students.includes(userId)) {
      return res.status(403).json({
        message: "You don't have access to this classroom",
      });
    }

    res.json(classroom);
  } catch (error) {
    console.error("Get classroom details error:", error);
    res.status(500).json({message: "Failed to get classroom details"});
  }
});

/**
 * @swagger
 * /classroom/student/{studentId}:
 *   get:
 *     summary: Get all classrooms with lessons for a student
 *     tags: [Classrooms]
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
 *         description: List of classrooms with their lessons
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   lessons:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 */
classroomRouter.get(
  "/student/:studentId",
  // @ts-ignore
  canAccessChildData,
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {studentId} = req.params;
      const classrooms = await classroomQueries.getStudentClassroomsWithLessons(
        studentId
      );
      res.json(classrooms);
    } catch (error) {
      console.error("Get student classrooms error:", error);
      res.status(500).json({message: "Failed to get student classrooms"});
    }
  }
);

export default classroomRouter;
