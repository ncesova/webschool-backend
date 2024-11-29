import {Router, Response} from "express";
import {
  AuthRequest,
  authMiddleware,
  teacherOnly,
} from "../middleware/authMiddleware";
import * as userQueries from "../db/queries/users";

const userRouter = Router();

userRouter.use(authMiddleware as any);

// Get all users (teacher only)
userRouter.get(
  "/",
  teacherOnly as any,
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

// Get specific user
userRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const {id} = req.params;
    const user = await userQueries.getUserById(id);

    if (!user.length) {
      return res.status(404).json({message: "User not found"});
    }

    // Remove sensitive information
    const {password, ...userWithoutPassword} = user[0];
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({message: "Failed to get user"});
  }
});

// Get all users from a classroom
userRouter.get(
  "/classroom/:classroomId",
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
