import {
  pgTable,
  uniqueIndex,
  text,
  integer,
  serial,
  pgSchema,
  bigint,
} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";

export const drizzle = pgSchema("drizzle");

export const classroomsTable = pgTable(
  "classrooms_table",
  {
    id: text("id"),
    adminsId: text("admins_id"),
    studentsId: text("students_id"),
    name: text("name"),
  },
  (table) => {
    return {
      pkey: uniqueIndex("classrooms_table_pkey").on(table.id),
    };
  }
);

export const rolesTable = pgTable("roles_table", {
  id: integer("id"),
  name: text("name"),
});

export const usersTable = pgTable(
  "users_table",
  {
    id: serial("id"),
    username: text("username"),
    password: text("password"),
    roleId: integer("role_id"),
    name: text("name"),
    surname: text("surname"),
    classroomId: text("classroom_id"),
  },
  (table) => {
    return {
      pkey: uniqueIndex("users_table_pkey").on(table.id),
    };
  }
);

export const __drizzleMigrationsInDrizzle = drizzle.table(
  "__drizzle_migrations",
  {
    id: serial("id"),
    hash: text("hash"),
    createdAt: bigint("created_at", {mode: "number"}),
  },
  (table) => {
    return {
      pkey: uniqueIndex("__drizzle_migrations_pkey").on(table.id),
    };
  }
);
