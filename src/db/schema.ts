import {
  pgTable,
  uniqueIndex,
  text,
  pgSchema,
  bigint,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";

export const drizzle = pgSchema("drizzle");

export const classroomsTable = pgTable("classrooms_table", {
  id: text("id").primaryKey(),
  adminsId: text("admins_id"),
  studentsId: text("students_id"),
  name: text("name"),
});

export const rolesTable = pgTable("roles_table", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name"),
});

export const usersTable = pgTable("users_table", {
  id: text("id").primaryKey(),
  username: text("username"),
  password: text("password"),
  roleId: integer("role_id").references(() => rolesTable.id),
  name: text("name"),
  surname: text("surname"),
  classroomId: text("classroom_id").references(() => classroomsTable.id),
});

export const gamesTable = pgTable("games_table", {
  id: text("id").primaryKey(),
  name: text("name"),
});

export const leaderboardTable = pgTable("leaderboard_table", {
  id: text("id").primaryKey(),
  gameId: text("game_id").references(() => gamesTable.id),
  userId: text("user_id").references(() => usersTable.id),
  classroomId: text("classroom_id").references(() => classroomsTable.id),
  value: integer("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const __drizzleMigrationsInDrizzle = drizzle.table(
  "__drizzle_migrations",
  {
    id: text("id").primaryKey(),
    hash: text("hash"),
    createdAt: bigint("created_at", {mode: "number"}),
  }
);
