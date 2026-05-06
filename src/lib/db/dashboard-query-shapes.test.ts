import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  dashboardCollectionSelect,
  dashboardCollectionTypeSummarySelect,
  dashboardItemListSelect,
  itemDetailSelect,
} from "./dashboard-query-shapes";

describe("dashboard query shapes", () => {
  it("selects only item fields rendered by dashboard item cards and file lists", () => {
    for (const unusedField of ["content", "url", "fileUrl", "language"]) {
      assert.equal(
        unusedField in dashboardItemListSelect,
        false,
        `dashboard item list select should not fetch ${unusedField}`,
      );
    }

    assert.deepEqual(Object.keys(dashboardItemListSelect).sort(), [
      "collections",
      "createdAt",
      "description",
      "fileName",
      "fileSize",
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

  it("selects full item fields for drawer detail requests", () => {
    assert.deepEqual(Object.keys(itemDetailSelect).sort(), [
      "collections",
      "content",
      "contentType",
      "createdAt",
      "description",
      "fileName",
      "fileSize",
      "fileUrl",
      "id",
      "isFavorite",
      "isPinned",
      "itemType",
      "language",
      "tags",
      "title",
      "updatedAt",
      "url",
    ]);
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
