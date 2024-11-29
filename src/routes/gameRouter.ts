import {Router, Response} from "express";
import {
  AuthRequest,
  authMiddleware,
  teacherOnly,
} from "../middleware/authMiddleware";
import {v4 as uuidv4} from "uuid";
import * as gameQueries from "../db/queries/games";

const gameRouter = Router();

gameRouter.use(authMiddleware as any);

/**
 * @swagger
 * components:
 *   schemas:
 *     Game:
 *       type: object
 *       required:
 *         - id
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the game
 *         name:
 *           type: string
 *           description: The name of the game
 */

/**
 * @swagger
 * /games:
 *   get:
 *     summary: Get all games
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of games
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Game'
 *   post:
 *     summary: Create a new game
 *     tags: [Games]
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
 *         description: Game created successfully
 *       403:
 *         description: Only teachers can create games
 */

gameRouter.post(
  "/",
  teacherOnly as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const {name} = req.body;

      if (!name) {
        return res.status(400).json({message: "Game name is required"});
      }

      const newGame = await gameQueries.createGame({
        id: uuidv4(),
        name,
      });

      res.status(201).json(newGame[0]);
    } catch (error) {
      console.error("Create game error:", error);
      res.status(500).json({message: "Failed to create game"});
    }
  }
);

gameRouter.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const games = await gameQueries.getAllGames();

    res.json(games);
  } catch (error) {
    console.error("Get games error:", error);
    res.status(500).json({message: "Failed to get games"});
  }
});

gameRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const {id} = req.params;

    const game = await gameQueries.getGameById(id);

    if (!game.length) {
      return res.status(404).json({message: "Game not found"});
    }

    res.json(game[0]);
  } catch (error) {
    console.error("Get game error:", error);
    res.status(500).json({message: "Failed to get game"});
  }
});

gameRouter.put(
  "/:id",
  teacherOnly as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;
      const {name} = req.body;

      if (!name) {
        return res.status(400).json({message: "Game name is required"});
      }

      const updatedGame = await gameQueries.updateGame(id, {name});

      if (!updatedGame.length) {
        return res.status(404).json({message: "Game not found"});
      }

      res.json(updatedGame[0]);
    } catch (error) {
      console.error("Update game error:", error);
      res.status(500).json({message: "Failed to update game"});
    }
  }
);

gameRouter.delete(
  "/:id",
  teacherOnly as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;

      const deletedGame = await gameQueries.deleteGame(id);

      if (!deletedGame.length) {
        return res.status(404).json({message: "Game not found"});
      }

      res.json({message: "Game deleted successfully"});
    } catch (error) {
      console.error("Delete game error:", error);
      res.status(500).json({message: "Failed to delete game"});
    }
  }
);

export default gameRouter;
