import {Router, Response} from "express";
import {
  AuthRequest,
  authMiddleware,
  teacherOnly,
} from "../middleware/authMiddleware";
import {v4 as uuidv4} from "uuid";
import * as classroomQueries from "../db/queries/classrooms";

const classroomRouter = Router();

classroomRouter.use(authMiddleware as any);

classroomRouter.post(
  "/",
  teacherOnly as any,
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

classroomRouter.delete(
  "/:id",
  teacherOnly as any,
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

classroomRouter.post(
  "/:id/users",
  teacherOnly as any,
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

classroomRouter.delete(
  "/:id/users/:userId",
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
