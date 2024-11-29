import {eq} from "drizzle-orm";
import {db} from "../index";
import {postsTable, SelectPost} from "../schema";

export async function deletePost(id: SelectPost["id"]) {
  await db.delete(postsTable).where(eq(postsTable.id, id));
}
