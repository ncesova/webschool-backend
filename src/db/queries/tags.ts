import {db} from "../index";
import {tagsTable} from "../schema";
import {eq} from "drizzle-orm";

export async function getAllTags() {
  return db.select().from(tagsTable).orderBy(tagsTable.name);
}

export async function createTag(data: {id: string; name: string}) {
  return db.insert(tagsTable).values(data).returning();
}

export async function getTagByName(name: string) {
  return db.select().from(tagsTable).where(eq(tagsTable.name, name));
}
