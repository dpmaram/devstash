import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  defaultDemoUserEmail,
  formatDeleteNonDemoUsersReport,
  planNonDemoUserDeletion,
} from "./delete-non-demo-users";

describe("planNonDemoUserDeletion", () => {
  it("keeps the demo user and selects every other user for deletion", () => {
    const plan = planNonDemoUserDeletion({
      users: [
        {
          id: "user_demo",
          email: "demo@devstash.io",
          name: "Demo User",
        },
        {
          id: "user_ada",
          email: "ada@example.com",
          name: "Ada",
        },
        {
          id: "user_no_email",
          email: null,
          name: "No Email",
        },
      ],
      verificationTokenIdentifiers: [
        "demo@devstash.io",
        "ada@example.com",
        "orphan@example.com",
      ],
    });

    assert.equal(plan.keepUser.id, "user_demo");
    assert.deepEqual(
      plan.usersToDelete.map((user) => user.id),
      ["user_ada", "user_no_email"],
    );
    assert.deepEqual(plan.verificationTokenIdentifiersToDelete, [
      "ada@example.com",
      "orphan@example.com",
    ]);
  });

  it("matches the demo email case-insensitively", () => {
    const plan = planNonDemoUserDeletion({
      users: [
        {
          id: "user_demo",
          email: "DEMO@DevStash.IO",
          name: "Demo User",
        },
      ],
      verificationTokenIdentifiers: ["demo@devstash.io"],
    });

    assert.equal(plan.keepUser.id, "user_demo");
    assert.deepEqual(plan.usersToDelete, []);
  });

  it("rejects a database without the demo user", () => {
    assert.throws(
      () =>
        planNonDemoUserDeletion({
          users: [
            {
              id: "user_ada",
              email: "ada@example.com",
              name: "Ada",
            },
          ],
          verificationTokenIdentifiers: [],
        }),
      /Demo user demo@devstash.io was not found/,
    );
  });

  it("rejects ambiguous demo user matches", () => {
    assert.throws(
      () =>
        planNonDemoUserDeletion({
          users: [
            {
              id: "user_demo_1",
              email: "demo@devstash.io",
              name: "Demo One",
            },
            {
              id: "user_demo_2",
              email: "DEMO@DEVSTASH.IO",
              name: "Demo Two",
            },
          ],
          verificationTokenIdentifiers: [],
        }),
      /Multiple users matched demo@devstash.io/,
    );
  });
});

describe("formatDeleteNonDemoUsersReport", () => {
  it("shows dry-run instructions and deletion counts", () => {
    const plan = planNonDemoUserDeletion({
      users: [
        {
          id: "user_demo",
          email: defaultDemoUserEmail,
          name: "Demo User",
        },
        {
          id: "user_ada",
          email: "ada@example.com",
          name: "Ada",
        },
      ],
      verificationTokenIdentifiers: ["ada@example.com"],
    });

    const report = formatDeleteNonDemoUsersReport({
      plan,
      counts: {
        users: 1,
        accounts: 2,
        sessions: 3,
        itemTypes: 4,
        collections: 5,
        items: 6,
        tags: 7,
        verificationTokens: 1,
      },
      database: {
        host: "localhost:5433",
        name: "devstash",
      },
      mode: "dry-run",
    });

    assert.match(report, /Mode: dry-run/);
    assert.match(report, /Keeping: Demo User <demo@devstash.io>/);
    assert.match(report, /Users: 1/);
    assert.match(
      report,
      /No records were deleted. To execute, rerun with `--run` and `CONFIRM_DELETE_NON_DEMO_USERS=demo@devstash.io`./,
    );
  });
});
