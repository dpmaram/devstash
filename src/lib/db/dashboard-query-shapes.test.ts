import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  dashboardCollectionSelect,
  dashboardCollectionTypeSummarySelect,
  dashboardItemListSelect,
} from "./dashboard-query-shapes";

describe("dashboard query shapes", () => {
  it("selects only item fields rendered by dashboard item cards", () => {
    for (const unusedField of ["content", "url", "fileName", "fileUrl", "language"]) {
      assert.equal(
        unusedField in dashboardItemListSelect,
        false,
        `dashboard item list select should not fetch ${unusedField}`,
      );
    }

    assert.deepEqual(Object.keys(dashboardItemListSelect).sort(), [
      "collections",
      "description",
      "id",
      "isFavorite",
      "isPinned",
      "itemType",
      "tags",
      "title",
      "updatedAt",
    ]);
  });

  it("selects collection counts without loading every collection item relation", () => {
    assert.equal(
      "items" in dashboardCollectionSelect,
      false,
      "dashboard collection select should not load nested items",
    );
    assert.deepEqual(dashboardCollectionSelect._count, {
      select: {
        items: true,
      },
    });
  });

  it("uses a separate slim collection type summary select", () => {
    assert.deepEqual(dashboardCollectionTypeSummarySelect, {
      collectionId: true,
      item: {
        select: {
          itemType: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
              color: true,
            },
          },
        },
      },
    });
  });
});
