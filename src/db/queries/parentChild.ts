import {db} from "../index";
import {parentChildTable} from "../schema";
import {eq, inArray, and} from "drizzle-orm";

export async function addChildToParent(data: {
  id: string;
  parentId: string;
  childId: string;
}) {
  return db.insert(parentChildTable).values(data).returning();
}

export async function removeChildFromParent(parentId: string, childId: string) {
  return db
    .delete(parentChildTable)
    .where(
      and(
        eq(parentChildTable.parentId, parentId),
        eq(parentChildTable.childId, childId)
      )
    )
    .returning();
}

export async function getParentChildren(parentId: string) {
  return db
    .select({
      childId: parentChildTable.childId,
    })
    .from(parentChildTable)
    .where(eq(parentChildTable.parentId, parentId));
}

export async function getChildParents(childId: string) {
  return db
    .select({
      parentId: parentChildTable.parentId,
    })
    .from(parentChildTable)
    .where(eq(parentChildTable.childId, childId));
}

export async function isParentOfChild(parentId: string, childId: string) {
  const result = await db
    .select()
    .from(parentChildTable)
    .where(
      and(
        eq(parentChildTable.parentId, parentId),
        eq(parentChildTable.childId, childId)
      )
    );

  return result.length > 0;
}
