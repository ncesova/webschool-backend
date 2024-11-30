import {Response, NextFunction} from "express";
import {AuthRequest} from "./authMiddleware";
import * as parentChildQueries from "../db/queries/parentChild";
import {ROLES} from "../db/seed";

export async function canAccessChildData(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.userId;
    const targetUserId = req.params.userId || req.params.id;

    // If user is accessing their own data or is a teacher, allow access
    if (userId === targetUserId || req.user!.roleId === ROLES.TEACHER) {
      return next();
    }

    // If user is a parent, check if they're the parent of the target user
    if (req.user!.roleId === ROLES.PARENT) {
      const isParent = await parentChildQueries.isParentOfChild(
        userId,
        targetUserId
      );
      if (isParent) {
        return next();
      }
    }

    res.status(403).json({message: "Not authorized to access this data"});
  } catch (error) {
    console.error("Parent-child authorization error:", error);
    res.status(500).json({message: "Authorization check failed"});
  }
}
