import {Router, Response, Request} from "express";
import {AuthRequest, authMiddleware} from "../middleware/authMiddleware";
import {v4 as uuidv4} from "uuid";
import * as leaderboardQueries from "../db/queries/leaderboard";

const leaderboardRouter = Router();

leaderboardRouter.use(authMiddleware as any);

interface PaginationQuery {
  page?: string;
  limit?: string;
}

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function getPaginationParams(query: PaginationQuery) {
  const page = Math.max(1, parseInt(query.page || "1"));
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(query.limit || String(DEFAULT_PAGE_SIZE)))
  );
  const offset = (page - 1) * limit;
  return {limit, offset, page};
}

/**
 * @swagger
 * tags:
 *   name: Leaderboard
 *   description: Leaderboard management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LeaderboardEntry:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Entry's unique ID
 *         gameId:
 *           type: string
 *           description: Game ID
 *         userId:
 *           type: string
 *           description: User ID
 *         classroomId:
 *           type: string
 *           description: Classroom ID
 *         value:
 *           type: integer
 *           description: Score value
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the score was achieved
 */

/**
 * @swagger
 * /leaderboard:
 *   post:
 *     summary: Add a new score
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gameId
 *               - value
 *             properties:
 *               gameId:
 *                 type: string
 *               value:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Score added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaderboardEntry'
 *       400:
 *         description: User must be in a classroom
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /leaderboard/game/{gameId}:
 *   get:
 *     summary: Get game leaderboard
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated leaderboard entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardEntry'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     offset:
 *                       type: integer
 */

/**
 * @swagger
 * /leaderboard/classroom/{classroomId}:
 *   get:
 *     summary: Get classroom leaderboard
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classroomId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated leaderboard entries for a classroom
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardEntry'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /leaderboard/user/{userId}:
 *   get:
 *     summary: Get user scores
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated scores for a specific user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardEntry'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *       500:
 *         description: Server error
 */

//@ts-ignore
leaderboardRouter.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const {gameId, value} = req.body;
    const userId = req.user!.userId;

    const users = await leaderboardQueries.getUserWithClassroom(userId);
    const user = users[0];

    if (!user?.classroomId) {
      return res
        .status(400)
        .json({message: "User must be in a classroom to submit scores"});
    }

    const newScore = await leaderboardQueries.createLeaderboardEntry({
      id: uuidv4(),
      gameId,
      userId,
      classroomId: user.classroomId,
      value,
    });

    res.status(201).json(newScore[0]);
  } catch (error) {
    res.status(500).json({message: "Failed to add score to leaderboard"});
  }
});

leaderboardRouter.get(
  "/game/:gameId",
  //@ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {gameId} = req.params;
      const {limit, offset} = getPaginationParams(req.query);

      const {scores, count} = await leaderboardQueries.getGameLeaderboard(
        gameId,
        limit,
        offset
      );

      res.json({
        data: scores,
        pagination: {
          total: count,
          pageSize: limit,
          offset,
        },
      });
    } catch (error) {
      res.status(500).json({message: "Failed to get game leaderboard"});
    }
  }
);

leaderboardRouter.get(
  "/classroom/:classroomId",
  //@ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {classroomId} = req.params;
      const {limit, offset} = getPaginationParams(req.query);

      const {scores, count} = await leaderboardQueries.getClassroomLeaderboard(
        classroomId,
        limit,
        offset
      );

      res.json({
        data: scores,
        pagination: {
          total: count,
          pageSize: limit,
          offset,
        },
      });
    } catch (error) {
      res.status(500).json({message: "Failed to get classroom leaderboard"});
    }
  }
);

leaderboardRouter.get(
  "/user/:userId",
  //@ts-ignore
  async (req: AuthRequest, res: Response) => {
    try {
      const {userId} = req.params;
      const {limit, offset} = getPaginationParams(req.query);

      const {scores, count} = await leaderboardQueries.getUserScores(
        userId,
        limit,
        offset
      );

      res.json({
        data: scores,
        pagination: {
          total: count,
          pageSize: limit,
          offset,
        },
      });
    } catch (error) {
      res.status(500).json({message: "Failed to get user scores"});
    }
  }
);

export default leaderboardRouter;
