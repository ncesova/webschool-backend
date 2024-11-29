import {Router, Request, Response} from "express";
import {v4 as uuidv4} from "uuid";
import {ROLES} from "../db/seed";
import * as authQueries from "../db/queries/auth";

const authRouter = Router();

authRouter.post("/signup", async (req: Request, res: Response) => {
  try {
    const {username, password, name, surname, roleId} = req.body;

    // Add validation
    if (!username || !password || !roleId) {
      return res
        .status(400)
        .json({message: "Username, password, and role are required"});
    }

    // Validate role
    if (![ROLES.STUDENT, ROLES.PARENT, ROLES.TEACHER].includes(roleId)) {
      return res.status(400).json({
        message:
          "Invalid role. Must be 1 (student), 2 (parent), or 3 (teacher)",
      });
    }

    // Check if user already exists
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

authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const {username, password} = req.body;

    // Validate input
    if (!username || !password) {
      return res
        .status(400)
        .json({message: "Username and password are required"});
    }

    // Find user
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

    // Generate JWT
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
