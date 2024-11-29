import {db} from "../index";
import {gamesTable} from "../schema";
import {eq} from "drizzle-orm";

export async function createGame(data: {id: string; name: string}) {
  return db.insert(gamesTable).values(data).returning();
}

export async function getAllGames() {
  return db.select().from(gamesTable).orderBy(gamesTable.name);
}

export async function getGameById(id: string) {
  return db.select().from(gamesTable).where(eq(gamesTable.id, id));
}

export async function updateGame(id: string, data: {name: string}) {
  return db
    .update(gamesTable)
    .set(data)
    .where(eq(gamesTable.id, id))
    .returning();
}

export async function deleteGame(id: string) {
  return db.delete(gamesTable).where(eq(gamesTable.id, id)).returning();
}
