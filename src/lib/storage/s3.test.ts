import { describe, expect, test } from "vitest";

import {
  defaultS3BucketName,
  defaultS3UploadPrefix,
  getS3Config,
  getS3ObjectKey,
} from "./s3";

describe("getS3Config", () => {
  test("uses the DevStash S3 bucket and upload prefix by default", () => {
    expect(
      getS3Config({
        AWS_REGION: "us-east-1",
      } as unknown as NodeJS.ProcessEnv),
    ).toEqual({
      bucketName: defaultS3BucketName,
      region: "us-east-1",
      uploadPrefix: defaultS3UploadPrefix,
    });
  });

  test("allows bucket, prefix, and default region overrides from the environment", () => {
    expect(
      getS3Config({
        AWS_DEFAULT_REGION: "us-west-2",
        S3_BUCKET_NAME: "custom-bucket",
        S3_UPLOAD_PREFIX: "/custom/uploads/",
      } as unknown as NodeJS.ProcessEnv),
    ).toEqual({
      bucketName: "custom-bucket",
      region: "us-west-2",
      uploadPrefix: "custom/uploads",
    });
  });
});

describe("getS3ObjectKey", () => {
  test("accepts stored DevStash S3 object keys", () => {
    expect(
      getS3ObjectKey(
        "devstash/api/uploads/dm/demo_user/upload_123-architecture.png",
        {} as unknown as NodeJS.ProcessEnv,
      ),
    ).toBe("devstash/api/uploads/dm/demo_user/upload_123-architecture.png");
  });

  test("ignores values outside the configured upload prefix", () => {
    expect(
      getS3ObjectKey(
        "uploads/demo_user/legacy-file.md",
        {} as unknown as NodeJS.ProcessEnv,
      ),
    ).toBeNull();
  });
});
