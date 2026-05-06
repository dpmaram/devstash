import assert from "node:assert/strict";
import { describe, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("upload route", () => {
  it("exports a POST handler", async () => {
    const route = await import("./app/api/uploads/route");

    assert.equal(typeof route.POST, "function");
  });

  it("returns 401 when the user is not signed in", async () => {
    const route = (await import("./app/api/uploads/route-handler")) as unknown as {
      handleUploadFile: (
        request: Request,
        deps: {
          auth: () => Promise<null>;
          createUploadId: () => string;
          getDashboardUserForSession: () => Promise<never>;
          putStoredFile: () => Promise<never>;
        },
      ) => Promise<Response>;
    };

    const response = await route.handleUploadFile(
      createUploadRequest("file", createFile("notes.md", "text/markdown")),
      {
        auth: async () => null,
        createUploadId: () => "upload_123",
        getDashboardUserForSession: async () => {
          throw new Error("getDashboardUserForSession should not be called");
        },
        putStoredFile: async () => {
          throw new Error("putStoredFile should not be called");
        },
      },
    );

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "You must be signed in.",
    });
  });

  it("validates the uploaded file before storage writes", async () => {
    const route = (await import("./app/api/uploads/route-handler")) as unknown as {
      handleUploadFile: (
        request: Request,
        deps: {
          auth: () => Promise<{ user: { id: string } }>;
          createUploadId: () => string;
          getDashboardUserForSession: (sessionUser: {
            id: string;
          }) => Promise<{ id: string }>;
          putStoredFile: () => Promise<never>;
        },
      ) => Promise<Response>;
    };

    const response = await route.handleUploadFile(
      createUploadRequest("file", createFile("virus.exe", "application/octet-stream")),
      {
        auth: async () => ({
          user: {
            id: "user_123",
          },
        }),
        createUploadId: () => "upload_123",
        getDashboardUserForSession: async () => ({
          id: "user_123",
        }),
        putStoredFile: async () => {
          throw new Error("putStoredFile should not be called");
        },
      },
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "That file type is not supported.",
    });
  });

  it("returns a JSON error when storage rejects the upload", async () => {
    const route = (await import("./app/api/uploads/route-handler")) as unknown as {
      handleUploadFile: (
        request: Request,
        deps: {
          auth: () => Promise<{ user: { id: string } }>;
          createUploadId: () => string;
          getDashboardUserForSession: (sessionUser: {
            id: string;
          }) => Promise<{ id: string }>;
          putStoredFile: () => Promise<never>;
        },
      ) => Promise<Response>;
    };
    const consoleErrors: unknown[][] = [];
    const originalConsoleError = console.error;

    console.error = (...args: unknown[]) => {
      consoleErrors.push(args);
    };

    try {
      const response = await route.handleUploadFile(
        createUploadRequest("file", createFile("notes.md", "text/markdown")),
        {
          auth: async () => ({
            user: {
              id: "user_123",
            },
          }),
          createUploadId: () => "upload_123",
          getDashboardUserForSession: async () => ({
            id: "user_123",
          }),
          putStoredFile: async () => {
            throw new Error("Forbidden");
          },
        },
      );

      assert.equal(response.status, 502);
      assert.deepEqual(await response.json(), {
        success: false,
        error: "Unable to upload file. Check S3 bucket permissions.",
      });
      assert.equal(consoleErrors.length, 1);
    } finally {
      console.error = originalConsoleError;
    }
  });

  it("stores a valid upload under a dashboard-user scoped key", async () => {
    const route = (await import("./app/api/uploads/route-handler")) as unknown as {
      handleUploadFile: (
        request: Request,
        deps: {
          auth: () => Promise<{ user: { id: string } }>;
          createUploadId: () => string;
          getDashboardUserForSession: (sessionUser: {
            id: string;
          }) => Promise<{ id: string }>;
          putStoredFile: (input: {
            body: Uint8Array;
            contentLength: number;
            contentType: string;
            key: string;
          }) => Promise<void>;
        },
      ) => Promise<Response>;
    };
    const storedKeys: string[] = [];

    const response = await route.handleUploadFile(
      createUploadRequest("image", createFile("Screen Shot.PNG", "image/png")),
      {
        auth: async () => ({
          user: {
            id: "signed_in_user",
          },
        }),
        createUploadId: () => "upload_123",
        getDashboardUserForSession: async (sessionUser) => {
          assert.deepEqual(sessionUser, {
            id: "signed_in_user",
          });
          return {
            id: "demo_user",
          };
        },
        putStoredFile: async (input) => {
          storedKeys.push(input.key);
          assert.equal(input.contentType, "image/png");
          assert.equal(input.contentLength, 11);
          assert.equal(new TextDecoder().decode(input.body), "hello world");
        },
      },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(storedKeys, [
      "devstash/api/uploads/dm/demo_user/upload_123-screen-shot.png",
    ]);
    assert.deepEqual(await response.json(), {
      success: true,
      file: {
        contentType: "image/png",
        fileName: "Screen Shot.PNG",
        fileSize: 11,
        fileUrl: "devstash/api/uploads/dm/demo_user/upload_123-screen-shot.png",
      },
    });
  });
});

function createUploadRequest(typeSlug: string, file: File) {
  const formData = new FormData();
  formData.set("typeSlug", typeSlug);
  formData.set("file", file);

  return new Request("http://localhost/api/uploads", {
    body: formData,
    method: "POST",
  });
}

function createFile(name: string, type: string) {
  return new File(["hello world"], name, { type });
}
