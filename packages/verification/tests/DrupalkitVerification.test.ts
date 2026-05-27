import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";

import { DrupalkitVerification } from "../src/index.js";
import {
  hashVerification,
  magicCodeVerification,
} from "../src/verification.js";

const BASE_URL = "https://my-drupal.com";

const createDrupalkit = (
  options: DrupalkitOptions = {
    baseUrl: BASE_URL,
  },
) => {
  const EnhancedDrupalkit = Drupalkit.plugin(DrupalkitVerification);

  return new EnhancedDrupalkit({
    locale: "de",
    defaultLocale: "de",
    ...options,
  });
};

const server = setupServer();

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

test("Instanciate with plugin", () => {
  const drupalkit = createDrupalkit();

  expect(drupalkit.hasOwnProperty("verification")).toBeTruthy();
});

test("Add Hash verification to a request once", async () => {
  expect.assertions(4);
  let first = true;

  const drupalkit = createDrupalkit();
  const hash = "0123456789abcdef";

  server.use(
    http.get("*/", async ({ request }) => {
      if (first) {
        expect(request.headers.get("x-verification-hash")).toBe(hash);
        first = false;
      } else {
        expect(request.headers.get("x-verification-hash")).not.toBe(hash);
      }

      return HttpResponse.text();
    }),
  );

  // First request.
  drupalkit.addVerification(hashVerification(hash));
  let result = await drupalkit.request("/", {
    method: "GET",
  });

  expect(result.ok).toBeTruthy();

  // Second request.
  result = await drupalkit.request("/", {
    method: "GET",
  });

  expect(result.ok).toBeTruthy();
});

test("Add Magic code verification to a request once", async () => {
  expect.assertions(4);
  let first = true;

  const drupalkit = createDrupalkit();
  const code = "5ZL-KD2";

  server.use(
    http.get("*/", async ({ request }) => {
      if (first) {
        expect(request.headers.get("x-verification-magic-code")).toBe(code);
        first = false;
      } else {
        expect(request.headers.get("x-verification-magic-code")).not.toBe(code);
      }

      return HttpResponse.text();
    }),
  );

  drupalkit.addVerification(magicCodeVerification(code));

  // First request.
  let result = await drupalkit.request("/", {
    method: "GET",
  });

  expect(result.ok).toBeTruthy();

  // Second request.
  result = await drupalkit.request("/", {
    method: "GET",
  });

  expect(result.ok).toBeTruthy();
});
