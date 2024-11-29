import {Router, Request, Response} from "express";
import {v4 as uuidv4} from "uuid";
import {ROLES} from "../db/seed";
import * as authQueries from "../db/queries/auth";

const authRouter = Router();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - roleId
 *             properties:
 *               username:
 *                 type: string
 *                 description: User's username
 *               password:
 *                 type: string
 *                 description: User's password
 *               name:
 *                 type: string
 *                 description: User's first name
 *               surname:
 *                 type: string
 *                 description: User's last name
 *               roleId:
 *                 type: integer
 *                 description: User's role (1 = student, 2 = parent, 3 = teacher)
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       400:
 *         description: Invalid input or username already exists
 *       500:
 *         description: Server error
 */
// @ts-ignore
authRouter.post("/signup", async (req: Request, res: Response) => {
  try {
    const {username, password, name, surname, roleId} = req.body;

    if (!username || !password || !roleId) {
      return res
        .status(400)
        .json({message: "Username, password, and role are required"});
    }

    if (![ROLES.STUDENT, ROLES.PARENT, ROLES.TEACHER].includes(roleId)) {
      return res.status(400).json({
        message:
          "Invalid role. Must be 1 (student), 2 (parent), or 3 (teacher)",
      });
    }

    const existingUser = await authQueries.checkUserExists(username);
    if (existingUser.length > 0) {
      return res.status(400).json({message: "Username already exists"});
    }

    const newUser = await authQueries.createUser({
      id: uuidv4(),
      username,
      password,
      name,
      surname,
      roleId,
    });

    const token = await authQueries.generateToken(
      newUser[0].id,
      username,
      newUser[0].roleId!
    );

    res.status(201).json({token});
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({message: "Internal server error"});
  }
}) as any;

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
// @ts-ignore
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const {username, password} = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({message: "Username and password are required"});
    }

    const users = await authQueries.checkUserExists(username);
    if (users.length === 0) {
      return res.status(401).json({message: "Invalid credentials"});
    }

    const user = users[0];
    if (!user.password) {
      return res.status(401).json({message: "Invalid credentials"});
    }

    const passwordMatch = await authQueries.verifyPassword(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({message: "Invalid credentials"});
    }

    const token = await authQueries.generateToken(
      user.id,
      username,
      user.roleId!
    );

    res.json({token});
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({message: "Internal server error"});
  }
}) as any;

export default authRouter;
