import {Router, Response} from "express";
import {
  AuthRequest,
  authMiddleware,
  teacherOnly,
} from "../middleware/authMiddleware";
import {v4 as uuidv4} from "uuid";
import * as tagQueries from "../db/queries/tags";

const tagRouter = Router();

tagRouter.use(authMiddleware as any);

/**
 * @swagger
 * tags:
 *   name: Tags
 *   description: Tag management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Tag:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Tag's unique ID
 *         name:
 *           type: string
 *           description: Tag name
 */

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: Get all tags
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
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
  async (req: AuthRequest, res: Response) => {
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
 *     responses:
 *       201:
 *         description: Tag created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Tag name already exists
 *       403:
 *         description: Not authorized (teacher role required)
 *       500:
 *         description: Server error
 */
tagRouter.post(
  "/",
  // @ts-ignore
  teacherOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const {name} = req.body;

      if (!name) {
        return res.status(400).json({message: "Tag name is required"});
      }

      // Check if tag already exists
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
