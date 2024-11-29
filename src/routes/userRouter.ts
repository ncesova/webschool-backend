import {Router, Response, RequestHandler} from "express";
import {
  AuthRequest,
  authMiddleware,
  teacherOnly,
} from "../middleware/authMiddleware";
import * as userQueries from "../db/queries/users";

const userRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User's unique ID
 *         username:
 *           type: string
 *           description: User's username
 *         name:
 *           type: string
 *           description: User's first name
 *         surname:
 *           type: string
 *           description: User's last name
 *         roleId:
 *           type: integer
 *           description: User's role (1 = student, 2 = parent, 3 = teacher)
 *         classroomId:
 *           type: string
 *           description: ID of user's classroom (if any)
 */

userRouter.use(authMiddleware as any);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (teachers only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Not authorized (teacher role required)
 *       500:
 *         description: Server error
 */
userRouter.get(
  "/",
  teacherOnly as any,
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const users = await userQueries.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({message: "Failed to get users"});
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// @ts-ignore
userRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const {id} = req.params;
    const user = await userQueries.getUserById(id);

    if (!user.length) {
      return res.status(404).json({message: "User not found"});
    }

    const {password, ...userWithoutPassword} = user[0];
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({message: "Failed to get user"});
  }
});

/**
 * @swagger
 * /users/classroom/{classroomId}:
 *   get:
 *     summary: Get all users in a classroom
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classroomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Classroom ID
 *     responses:
 *       200:
 *         description: List of users in the classroom
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
userRouter.get(
  "/classroom/:classroomId",
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {classroomId} = req.params;
      const users = await userQueries.getClassroomUsers(classroomId);
      res.json(users);
    } catch (error) {
      console.error("Get classroom users error:", error);
      res.status(500).json({message: "Failed to get classroom users"});
    }
  }
);

export default userRouter;
