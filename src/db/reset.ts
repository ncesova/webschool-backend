import {db} from "./index";
import {sql} from "drizzle-orm";

async function reset() {
  console.log("Dropping all tables...");

  await db.execute(sql`
    DROP SCHEMA IF EXISTS drizzle CASCADE;
    CREATE SCHEMA drizzle;
  `);

  console.log("Tables dropped successfully");
}

reset()
  .then(() => {
    console.log("Database reset complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error resetting database:", error);
    process.exit(1);
  });
