import {asc, count, eq, getTableColumns} from "drizzle-orm";
import {db} from "../index";
import {SelectUser, postsTable, usersTable} from "../schema";

export async function getUserById(
  id: SelectUser["id"]
): Promise<Array<{id: number; username: string; password: string}>> {
  return db.select().from(usersTable).where(eq(usersTable.id, id));
}

export async function getUserByUsername(
  username: SelectUser["username"]
): Promise<Array<{id: number; username: string; password: string}>> {
  return db.select().from(usersTable).where(eq(usersTable.username, username));
}

export async function getUsersWithPostsCount(
  page = 1,
  pageSize = 5
): Promise<
  Array<{
    postsCount: number;
    id: number;
    username: string;
  }>
> {
  return db
    .select({
      ...getTableColumns(usersTable),
      postsCount: count(postsTable.id),
    })
    .from(usersTable)
    .leftJoin(postsTable, eq(usersTable.id, postsTable.userId))
    .groupBy(usersTable.id)
    .orderBy(asc(usersTable.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}

export async function getAllPosts(
  page = 1,
  pageSize = 10
): Promise<Array<{message: string; username: string | null; createdAt: Date}>> {
  return db
    .select({
      message: postsTable.message,
      username: usersTable.username,
      createdAt: postsTable.createdAt,
    })
    .from(postsTable)
    .leftJoin(usersTable, eq(postsTable.userId, usersTable.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}
