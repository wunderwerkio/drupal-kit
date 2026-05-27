import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";

import { DrupalkitSimpleOauthAuthCode } from "../src/index.js";
import AuthCodeResponse from "./fixtures/auth_code_response.js";

const BASE_URL = "https://my-drupal.com";

const createDrupalkit = (
  options: DrupalkitOptions = {
    baseUrl: BASE_URL,
  },
) => {
  const EnhancedDrupalkit = Drupalkit.plugin(DrupalkitSimpleOauthAuthCode);

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

test("Request auth code", async () => {
  const drupalkit = createDrupalkit();

  const operation = "register";
  const email = "F3f6Z@example.com";

  server.use(
    http.post("*/simple-oauth/auth-code", async ({ request }) =>
      HttpResponse.json(AuthCodeResponse),
    ),
  );

  const result = await drupalkit.simpleOauth.requestAuthCode(operation, email);

  const res = result.unwrap();
  expect(res).toEqual(AuthCodeResponse);
});

test("Request auth code with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  const operation = "register";
  const email = "F3f6Z@example.com";

  server.use(
    http.post("*/simple-oauth/auth-code", async ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");

      return HttpResponse.json(AuthCodeResponse);
    }),
  );

  await drupalkit.simpleOauth.requestAuthCode(operation, email, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test("Request auth code with explicit endpoint", async () => {
  const endpoint = "/custom/auth-code";
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    authCodeEndpoint: endpoint,
  });

  const operation = "register";
  const email = "F3f6Z@example.com";

  server.use(
    http.post("*/custom/auth-code", async () =>
      HttpResponse.json(AuthCodeResponse),
    ),
  );

  const result = await drupalkit.simpleOauth.requestAuthCode(operation, email);

  expect(result.ok).toBeTruthy();
});

test("Handle network error", async () => {
  const drupalkit = createDrupalkit();

  const operation = "register";
  const email = "F3f6Z@example.com";

  server.use(
    http.post("*/simple-oauth/auth-code", async () => HttpResponse.error()),
  );

  const result = await drupalkit.simpleOauth.requestAuthCode(operation, email);

  expect(result.err).toBeTruthy();
});
