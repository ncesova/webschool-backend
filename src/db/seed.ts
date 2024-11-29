import {db} from "./index";
import {rolesTable} from "./schema";

const ROLES = {
  STUDENT: 1,
  PARENT: 2,
  TEACHER: 3,
} as const;

async function seed() {
  await db
    .insert(rolesTable)
    .values([{name: "student"}, {name: "parent"}, {name: "teacher"}])
    .onConflictDoNothing();
}

export {ROLES};
seed().catch(console.error);
