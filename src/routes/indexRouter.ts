import {Router} from "express";

const indexRouter = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get API welcome message
 *     tags: [Index]
 *     responses:
 *       200:
 *         description: Welcome message
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Hello World
 */

indexRouter.get("/", async (req, res) => {
  res.send("Hello World");
});

export default indexRouter;
