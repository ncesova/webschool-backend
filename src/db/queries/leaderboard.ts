import {db} from "../index";
import {leaderboardTable, usersTable} from "../schema";
import {eq, desc, sql} from "drizzle-orm";

export async function getUserWithClassroom(userId: string) {
  return db.select().from(usersTable).where(eq(usersTable.id, userId));
}

export async function createLeaderboardEntry(data: {
  id: string;
  gameId: string;
  userId: string;
  classroomId: string;
  value: number;
}) {
  return db.insert(leaderboardTable).values(data).returning();
}

export async function getGameLeaderboard(
  gameId: string,
  limit: number,
  offset: number
) {
  const scores = await db
    .select({
      score: leaderboardTable.value,
      username: usersTable.username,
      name: usersTable.name,
      surname: usersTable.surname,
      createdAt: leaderboardTable.createdAt,
    })
    .from(leaderboardTable)
    .innerJoin(usersTable, eq(leaderboardTable.userId, usersTable.id))
    .where(eq(leaderboardTable.gameId, gameId))
    .orderBy(desc(leaderboardTable.value))
    .limit(limit)
    .offset(offset);

  const [{count}] = await db
    .select({count: sql<number>`count(*)`})
    .from(leaderboardTable)
    .where(eq(leaderboardTable.gameId, gameId));

  return {scores, count: Number(count)};
}

export async function getClassroomLeaderboard(
  classroomId: string,
  limit: number,
  offset: number
) {
  const scores = await db
    .select({
      score: leaderboardTable.value,
      username: usersTable.username,
      name: usersTable.name,
      surname: usersTable.surname,
      gameId: leaderboardTable.gameId,
      createdAt: leaderboardTable.createdAt,
    })
    .from(leaderboardTable)
    .innerJoin(usersTable, eq(leaderboardTable.userId, usersTable.id))
    .where(eq(leaderboardTable.classroomId, classroomId))
    .orderBy(desc(leaderboardTable.value))
    .limit(limit)
    .offset(offset);

  const [{count}] = await db
    .select({count: sql<number>`count(*)`})
    .from(leaderboardTable)
    .where(eq(leaderboardTable.classroomId, classroomId));

  return {scores, count: Number(count)};
}

export async function getUserScores(
  userId: string,
  limit: number,
  offset: number
) {
  const scores = await db
    .select({
      score: leaderboardTable.value,
      gameId: leaderboardTable.gameId,
      classroomId: leaderboardTable.classroomId,
      createdAt: leaderboardTable.createdAt,
    })
    .from(leaderboardTable)
    .where(eq(leaderboardTable.userId, userId))
    .orderBy(desc(leaderboardTable.value))
    .limit(limit)
    .offset(offset);

  const [{count}] = await db
    .select({count: sql<number>`count(*)`})
    .from(leaderboardTable)
    .where(eq(leaderboardTable.userId, userId));

  return {scores, count: Number(count)};
}
