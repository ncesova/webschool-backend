import {Router} from "express";

const indexRouter = Router();

indexRouter.get("/", async (req, res) => {
  res.send("Hello World");
});

export default indexRouter;
