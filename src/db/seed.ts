import {db} from "./index";
import {rolesTable} from "./schema";

async function seed() {
  await db
    .insert(rolesTable)
    .values([
      {id: 1, name: "student"},
      {id: 2, name: "parent"},
      {id: 3, name: "teacher"},
    ])
    .onConflictDoNothing();
}

seed().catch(console.error);
