import {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import {db} from "../db";
import {usersTable} from "../db/schema";
import {eq} from "drizzle-orm";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
    roleId: number;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    console.log("authMiddleware token", token);
    if (!token) {
      return res.status(401).json({message: "No token provided"});
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as any;
    console.log("authMiddleware decoded", decoded);

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, decoded.userId));

    if (!user.length) {
      return res.status(401).json({message: "Invalid token"});
    }

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      roleId: user[0].roleId!,
    };

    next();
  } catch (error) {
    res.status(401).json({message: "Invalid token"});
  }
};

export const teacherOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.roleId !== 3) {
    // 3 is teacher role
    return res
      .status(403)
      .json({message: "Only teachers can perform this action"});
  }
  next();
};
