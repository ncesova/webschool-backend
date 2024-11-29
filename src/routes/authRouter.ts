import {Router, Request, Response} from "express";
import {db} from "../db"; // Make sure you have your db connection exported
import {usersTable} from "../db/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {eq} from "drizzle-orm";

const authRouter = Router();
//@ts-ignore
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
    if (![1, 2, 3].includes(roleId)) {
      return res.status(400).json({
        message:
          "Invalid role. Must be 1 (student), 2 (parent), or 3 (teacher)",
      });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));
    if (existingUser.length > 0) {
      return res.status(400).json({message: "Username already exists"});
    }
    console.log(password);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db
      .insert(usersTable)
      .values({
        username,
        password: hashedPassword,
        name,
        surname,
        roleId,
      })
      .returning();

    const token = jwt.sign(
      {userId: newUser[0].id, username, roleId: newUser[0].roleId},
      process.env.JWT_SECRET || "your-secret-key",
      {expiresIn: "24h"}
    );

    res.status(201).json({token});
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({message: "Internal server error"});
  }
});
//@ts-ignore
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
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));

    if (users.length === 0) {
      return res.status(401).json({message: "Invalid credentials"});
    }

    const user = users[0];
    if (!user.password) {
      return res.status(401).json({message: "Invalid credentials"});
    }
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({message: "Invalid credentials"});
    }

    // Generate JWT
    const token = jwt.sign(
      {userId: user.id, username, roleId: user.roleId},
      process.env.JWT_SECRET || "your-secret-key",
      {expiresIn: "24h"}
    );

    res.json({token});
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({message: "Internal server error"});
  }
});

authRouter.get("/test-headers", (req: Request, res: Response) => {
  console.log("Headers:", req.headers);
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("Body:", req.body);

  res.json({
    headers: req.headers,
    contentType: req.headers["content-type"],
    body: req.body,
  });
});

export default authRouter;
