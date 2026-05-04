import { describe, expect, test } from "vitest";

import {
  createInitialNewItemDraft,
  isCreateItemTypeSlug,
  resolveCreateItemTypeSlug,
} from "./create-item-types";

describe("isCreateItemTypeSlug", () => {
  test("allows only item types supported by the create dialog", () => {
    expect(isCreateItemTypeSlug("snippet")).toBe(true);
    expect(isCreateItemTypeSlug("prompt")).toBe(true);
    expect(isCreateItemTypeSlug("command")).toBe(true);
    expect(isCreateItemTypeSlug("note")).toBe(true);
    expect(isCreateItemTypeSlug("link")).toBe(true);
    expect(isCreateItemTypeSlug("file")).toBe(false);
    expect(isCreateItemTypeSlug("image")).toBe(false);
  });
});

describe("resolveCreateItemTypeSlug", () => {
  test("uses a supported requested type as the dialog initial type", () => {
    expect(resolveCreateItemTypeSlug("command")).toBe("command");
    expect(resolveCreateItemTypeSlug("link")).toBe("link");
  });

  test("falls back to snippet when no supported type is requested", () => {
    expect(resolveCreateItemTypeSlug("file")).toBe("snippet");
    expect(resolveCreateItemTypeSlug("image")).toBe("snippet");
    expect(resolveCreateItemTypeSlug("snippets")).toBe("snippet");
    expect(resolveCreateItemTypeSlug(null)).toBe("snippet");
  });
});

describe("createInitialNewItemDraft", () => {
  test("creates an empty draft with the requested supported type selected", () => {
    expect(createInitialNewItemDraft("note")).toEqual({
      content: "",
      description: "",
      language: "",
      tagsText: "",
      title: "",
      typeSlug: "note",
      url: "",
    });
  });
});
