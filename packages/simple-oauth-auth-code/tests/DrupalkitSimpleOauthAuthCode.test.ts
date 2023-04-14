import test from "ava";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";

import { DrupalkitSimpleOauthAuthCode } from "../src/index.js";
import AuthCodeResponse from "./fixtures/auth_code_response.json" assert { type: "json" };

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
    rest.post("*/simple-oauth/auth-code", async (req, res, ctx) =>
      res(ctx.json(AuthCodeResponse)),
    ),
  );

  const result = await drupalkit.simpleOauth.requestAuthCode(operation, email);

  const res = result.unwrap();
  t.deepEqual(res, AuthCodeResponse);
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
    rest.post("*/custom/auth-code", async (_req, res, ctx) =>
      res(ctx.json(AuthCodeResponse)),
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
    rest.post("*/simple-oauth/auth-code", async (_req, res) =>
      res.networkError("Network Error"),
    ),
  );

  const result = await drupalkit.simpleOauth.requestAuthCode(operation, email);

  t.assert(result.err);
});
