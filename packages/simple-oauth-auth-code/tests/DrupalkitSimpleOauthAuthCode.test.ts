import test from "ava";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";

import { DrupalkitSimpleOauthAuthCode } from "../src/index.js";
import AuthCodeResponse from "./fixtures/auth_code_response.json" with { type: "json" };

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

test.before(() => {
  server.listen();
});

test.afterEach(() => {
  server.resetHandlers();
});

test.after(() => {
  server.close();
});

test.serial("Request auth code", async (t) => {
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
  t.deepEqual(res, AuthCodeResponse);
});

test.serial("Request auth code with custom request options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  const operation = "register";
  const email = "F3f6Z@example.com";

  server.use(
    http.post("*/simple-oauth/auth-code", async ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");

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

test.serial("Request auth code with explicit endpoint", async (t) => {
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

  t.assert(result.ok);
});

test.serial("Handle network error", async (t) => {
  const drupalkit = createDrupalkit();

  const operation = "register";
  const email = "F3f6Z@example.com";

  server.use(
    http.post("*/simple-oauth/auth-code", async () =>
      HttpResponse.error()
    ),
  );

  const result = await drupalkit.simpleOauth.requestAuthCode(operation, email);

  t.assert(result.err);
});
