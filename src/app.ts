import express from "express";
import "dotenv/config";
import cors from "cors";
import indexRouter from "./routes/indexRouter";
import authRouter from "./routes/authRouter";
import classroomRouter from "./routes/classroomRouter";
import leaderboardRouter from "./routes/leaderboardRouter";
import gameRouter from "./routes/gameRouter";
import userRouter from "./routes/userRouter";
import tagRouter from "./routes/tagRouter";
import swaggerUi from "swagger-ui-express";
import {specs} from "./swagger";
import teacherInfoRouter from "./routes/teacherInfoRouter";
import parentRouter from "./routes/parentRouter";

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/classroom", classroomRouter);
app.use("/leaderboard", leaderboardRouter);
app.use("/games", gameRouter);
app.use("/users", userRouter);
app.use("/tags", tagRouter);
app.use("/teacher-info", teacherInfoRouter);
app.use("/parent", parentRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

const port = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
