import express from "express";
import "dotenv/config";
import cors from "cors";
import indexRouter from "./routes/indexRouter";
import authRouter from "./routes/authRouter";
import classroomRouter from "./routes/classroomRouter";
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
app.use((req, res, next) => {
  console.log("Request Body:", req.body);
  console.log("Content-Type:", req.headers["content-type"]);
  next();
});
app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/classroom", classroomRouter);

app.listen(3000, () => {
  console.log("app listening on port 3000!");
});
