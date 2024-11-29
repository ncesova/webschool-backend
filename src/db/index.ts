import {drizzle} from "drizzle-orm/node-postgres";
import {config} from "dotenv";
import {Pool} from "pg";

config({path: ".env"});

export const db = drizzle(
  new Pool({
    connectionString: process.env.DATABASE_URL!,
  })
);
