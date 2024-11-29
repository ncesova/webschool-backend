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
