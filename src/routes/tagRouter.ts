import {Router, Response} from "express";
import {v4 as uuidv4} from "uuid";
import * as tagQueries from "../db/queries/tags";
import {
  AuthRequest,
  authMiddleware,
  teacherOnly,
} from "../middleware/authMiddleware";

const tagRouter = Router();

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: Get all tags (public)
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: List of all tags
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tag'
 *       500:
 *         description: Server error
 */
tagRouter.get(
  "/",
  // @ts-ignore
  async (req: Request, res: Response) => {
    try {
      const tags = await tagQueries.getAllTags();
      res.json(tags);
    } catch (error) {
      console.error("Get tags error:", error);
      res.status(500).json({message: "Failed to get tags"});
    }
  }
);

/**
 * @swagger
 * /tags:
 *   post:
 *     summary: Create a new tag (teachers only)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 */
tagRouter.post(
  "/",
  // @ts-ignore
  authMiddleware,
  teacherOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const {name} = req.body;

      if (!name) {
        return res.status(400).json({message: "Tag name is required"});
      }

      const existingTag = await tagQueries.getTagByName(name);
      if (existingTag.length > 0) {
        return res.status(400).json({message: "Tag name already exists"});
      }

      const newTag = await tagQueries.createTag({
        id: uuidv4(),
        name,
      });

      res.status(201).json(newTag[0]);
    } catch (error) {
      console.error("Create tag error:", error);
      res.status(500).json({message: "Failed to create tag"});
    }
  }
);

export default tagRouter;
