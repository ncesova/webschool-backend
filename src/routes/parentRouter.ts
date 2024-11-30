import {Router, Response} from "express";
import {AuthRequest, authMiddleware} from "../middleware/authMiddleware";
import {v4 as uuidv4} from "uuid";
import * as parentChildQueries from "../db/queries/parentChild";
import * as userQueries from "../db/queries/users";
import {ROLES} from "../db/seed";

const parentChildRouter = Router();

parentChildRouter.use(authMiddleware as any);

/**
 * @swagger
 * tags:
 *   name: Parent
 *   description: Parent management endpoints
 */

/**
 * @swagger
 * /parent/children:
 *   get:
 *     summary: Get parent's children
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of parent's children
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Not authorized (parent role required)
 *       500:
 *         description: Server error
 */
parentChildRouter.get(
  "/children",
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.roleId !== ROLES.PARENT) {
        return res
          .status(403)
          .json({message: "Only parents can access their children list"});
      }

      const children = await parentChildQueries.getParentChildren(
        req.user!.userId
      );
      const childrenDetails = await Promise.all(
        children.map(async ({childId}) => {
          const child = await userQueries.getUserById(childId);
          return child[0];
        })
      );

      res.json(childrenDetails);
    } catch (error) {
      console.error("Get children error:", error);
      res.status(500).json({message: "Failed to get children"});
    }
  }
);

/**
 * @swagger
 * /parent/children/{childId}:
 *   post:
 *     summary: Add a child to parent
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student's user ID to add as child
 *     responses:
 *       201:
 *         description: Child added successfully
 *       400:
 *         description: Invalid child ID or user is not a student
 *       403:
 *         description: Not authorized (parent role required)
 *       500:
 *         description: Server error
 */
parentChildRouter.post(
  "/children/:childId",
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.roleId !== ROLES.PARENT) {
        return res.status(403).json({message: "Only parents can add children"});
      }

      const {childId} = req.params;
      const child = await userQueries.getUserById(childId);

      if (!child.length) {
        return res.status(400).json({message: "Child not found"});
      }

      if (child[0].roleId !== ROLES.STUDENT) {
        return res.status(400).json({message: "User is not a student"});
      }

      await parentChildQueries.addChildToParent({
        id: uuidv4(),
        parentId: req.user!.userId,
        childId,
      });

      res.status(201).json({message: "Child added successfully"});
    } catch (error) {
      console.error("Add child error:", error);
      res.status(500).json({message: "Failed to add child"});
    }
  }
);

/**
 * @swagger
 * /parent/children/{childId}:
 *   delete:
 *     summary: Remove a child from parent
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child's user ID to remove
 *     responses:
 *       200:
 *         description: Child removed successfully
 *       403:
 *         description: Not authorized (parent role required)
 *       500:
 *         description: Server error
 */
parentChildRouter.delete(
  "/children/:childId",
  // @ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.roleId !== ROLES.PARENT) {
        return res
          .status(403)
          .json({message: "Only parents can remove children"});
      }

      const {childId} = req.params;
      await parentChildQueries.removeChildFromParent(req.user!.userId, childId);

      res.json({message: "Child removed successfully"});
    } catch (error) {
      console.error("Remove child error:", error);
      res.status(500).json({message: "Failed to remove child"});
    }
  }
);

export default parentChildRouter;
