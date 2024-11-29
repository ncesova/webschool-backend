import {Router, Request, Response} from "express";
import {db} from "../db";
import {v4 as uuidv4} from "uuid";
import {classroomsTable, usersTable} from "../db/schema";
import {eq} from "drizzle-orm";
import {
  AuthRequest,
  authMiddleware,
  teacherOnly,
} from "../middleware/authMiddleware";

const classroomRouter = Router();

//@ts-ignore
classroomRouter.use(authMiddleware);

classroomRouter.post(
  "/",
  //@ts-ignore
  teacherOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      console.log("trying to create classroom");
      const teacherId = req.user!.userId;
      const name = req.body.name;
      console.log("Classroom route teacherId", teacherId);
      console.log({
        adminsId: JSON.stringify([teacherId]),
        studentsId: JSON.stringify([]),
        name,
      });

      const newClassroom = await db
        .insert(classroomsTable)
        .values({
          id: uuidv4(),
          adminsId: JSON.stringify([teacherId]),
          studentsId: JSON.stringify([]),
          name,
        })
        .returning();

      res.status(201).json(newClassroom[0]);
    } catch (error) {
      res.status(500).json({message: "Failed to create classroom" + error});
    }
  }
);

classroomRouter.delete(
  "/:id",
  //@ts-ignore
  teacherOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;
      const teacherId = req.user!.userId;

      const classroom = await db
        .select()
        .from(classroomsTable)
        .where(eq(classroomsTable.id, id));

      if (!classroom.length) {
        return res.status(404).json({message: "Classroom not found"});
      }

      const admins = JSON.parse(classroom[0].adminsId || "[]");
      if (!admins.includes(teacherId)) {
        return res
          .status(403)
          .json({message: "Only classroom admins can delete it"});
      }

      await db
        .update(usersTable)
        .set({classroomId: null})
        .where(eq(usersTable.classroomId, id));

      await db.delete(classroomsTable).where(eq(classroomsTable.id, id));

      res.status(200).json({message: "Classroom deleted"});
    } catch (error) {
      res.status(500).json({message: "Failed to delete classroom" + error});
    }
  }
);

classroomRouter.post(
  "/:id/users",
  //@ts-ignore
  teacherOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;
      const {userId, role} = req.body;
      const teacherId = req.user!.userId;

      const classroom = await db
        .select()
        .from(classroomsTable)
        .where(eq(classroomsTable.id, id));

      console.log("classroom", classroom);

      if (!classroom.length) {
        return res.status(404).json({message: "Classroom not found"});
      }

      const admins = JSON.parse(classroom[0].adminsId || "[]");
      if (!admins.includes(teacherId)) {
        return res
          .status(403)
          .json({message: "Only classroom admins can add users"});
      }

      const currentClassroom = classroom[0];
      const adminsArray = JSON.parse(currentClassroom.adminsId || "[]");
      const studentsArray = JSON.parse(currentClassroom.studentsId || "[]");

      if (role === "admin") {
        adminsArray.push(userId);
        await db
          .update(classroomsTable)
          .set({adminsId: JSON.stringify(adminsArray)})
          .where(eq(classroomsTable.id, id));
      } else {
        studentsArray.push(userId);
        await db
          .update(classroomsTable)
          .set({studentsId: JSON.stringify(studentsArray)})
          .where(eq(classroomsTable.id, id));
      }

      await db
        .update(usersTable)
        .set({classroomId: id})
        .where(eq(usersTable.id, userId));

      res.status(200).json({message: "User added to classroom"});
    } catch (error) {
      res.status(500).json({message: "Failed to add user to classroom"});
    }
  }
);

//@ts-ignore
classroomRouter.delete(
  "/:id/users/:userId",
  //@ts-ignore
  async (req: Request, res: Response) => {
    try {
      const {id, userId} = req.params;

      const classroom = await db
        .select()
        .from(classroomsTable)
        .where(eq(classroomsTable.id, id));

      if (!classroom.length) {
        return res.status(404).json({message: "Classroom not found"});
      }

      const currentClassroom = classroom[0];
      const admins = JSON.parse(currentClassroom.adminsId || "[]");
      const students = JSON.parse(currentClassroom.studentsId || "[]");

      const newAdmins = admins.filter((id: string) => id !== userId);
      const newStudents = students.filter((id: string) => id !== userId);

      await db
        .update(classroomsTable)
        .set({
          adminsId: JSON.stringify(newAdmins),
          studentsId: JSON.stringify(newStudents),
        })
        .where(eq(classroomsTable.id, id));

      console.log(newStudents, students);

      await db
        .update(usersTable)
        .set({classroomId: null})
        .where(eq(usersTable.id, parseInt(userId)));

      res.status(200).json({message: "User removed from classroom"});
    } catch (error) {
      res.status(500).json({message: "Failed to remove user from classroom"});
    }
  }
);

export default classroomRouter;
