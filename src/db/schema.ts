import {
  pgTable,
  uniqueIndex,
  text,
  pgSchema,
  bigint,
  timestamp,
  integer,
  json,
  varchar,
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

export const tagsTable = pgTable("tags_table", {
  id: text("id").primaryKey(),
  name: text("name").unique(),
});

export const teacherMetaTable = pgTable("teacher_meta_table", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => usersTable.id)
    .notNull(),
  tagsId: text("tags_id").references(() => tagsTable.id),
  aboutTeacher: text("about_teacher"),
  canHelpWith: text("can_help_with"),
  resume: text("resume"),
});

export const __drizzleMigrationsInDrizzle = drizzle.table(
  "__drizzle_migrations",
  {
    id: text("id").primaryKey(),
    hash: text("hash"),
    createdAt: bigint("created_at", {mode: "number"}),
  }
);

export const parentChildTable = pgTable(
  "parent_child_table",
  {
    id: text("id").primaryKey(),
    parentId: text("parent_id")
      .references(() => usersTable.id)
      .notNull(),
    childId: text("child_id")
      .references(() => usersTable.id)
      .notNull(),
  },
  (table) => ({
    parentChildUnique: uniqueIndex("parent_child_unique_idx").on(
      table.parentId,
      table.childId
    ),
  })
);

export const lessonsTable = pgTable("lessons_table", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  classroomId: text("classroom_id")
    .references(() => classroomsTable.id)
    .notNull(),
  gameIds: json("game_ids").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lessonSummariesTable = pgTable("lesson_summaries_table", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id")
    .references(() => lessonsTable.id)
    .notNull(),
  fileName: varchar("file_name", {length: 255}).notNull(),
  fileKey: varchar("file_key", {length: 255}).notNull(),
  fileType: varchar("file_type", {length: 100}).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
