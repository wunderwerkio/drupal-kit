import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit, DrupalkitError, DrupalkitOptions } from "@drupal-kit/core";

import {
  DrupalkitSimpleOauth,
  DrupalkitSimpleOauthError,
} from "../src/index.js";
import ErrorResponse from "./fixtures/error_response.js";
import TokenResponse from "./fixtures/token_response.js";
import UserInfoResponse from "./fixtures/userinfo_response.js";

const BASE_URL = "https://my-drupal.com";

const CLIENT_ID = "12345678901234567890123456789012";
const CLIENT_SECRET = "F9w1cM0GQw7GjjQUaZcscWHtxnMOvn4d";

const createDrupalkit = (
  options: DrupalkitOptions = {
    baseUrl: BASE_URL,
  },
) => {
  const EnhancedDrupalkit = Drupalkit.plugin(DrupalkitSimpleOauth);

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

  expect(drupalkit.hasOwnProperty("simpleOauth")).toBeTruthy();
});

test("Request token with client credentials grant", async () => {
  expect.assertions(3);

  const drupalkit = createDrupalkit();

  server.use(
    http.post("*/oauth/token", async ({ request }) => {
      const body = await request.text();

      expect(request.headers.get("content-type")).toBe(
        "application/x-www-form-urlencoded",
      );
      expect(body).toMatchSnapshot();

      return HttpResponse.json(TokenResponse);
    }),
  );

  const result = await drupalkit.simpleOauth.requestToken(
    "client_credentials",
    {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    },
  );

  const res = result.unwrap();

  expect(res).toMatchSnapshot();
});

test("Request token with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.post("*/oauth/token", async ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");

      return HttpResponse.json(TokenResponse);
    }),
  );

  await drupalkit.simpleOauth.requestToken(
    "client_credentials",
    {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    },
    {
      cache: "no-cache",
      headers: {
        "X-Custom": "1",
      },
    },
  );
});

test("Request token authenticated", async () => {
  expect.assertions(3);

  const authinfo = "Bearer abc123";

  const drupalkit = createDrupalkit();
  drupalkit.setAuth(authinfo);

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.post("*/oauth/token", async ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");
      expect(request.headers.get("Authorization")).toBe(authinfo);

      return HttpResponse.json(TokenResponse);
    }),
  );

  await drupalkit.simpleOauth.requestToken(
    "client_credentials",
    {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    },
    {
      cache: "no-cache",
      headers: {
        "X-Custom": "1",
      },
      unauthenticated: false,
    },
  );
});

test("Request token with explicit endpoint", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    oauthTokenEndpoint: "/custom/token",
  });

  server.use(
    http.post("*/custom/token", async () => HttpResponse.json(TokenResponse)),
  );

  const result = await drupalkit.simpleOauth.requestToken(
    "client_credentials",
    {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    },
  );

  expect(result.ok).toBeTruthy();
});

test("Handle request errors", async () => {
  const drupalkit = createDrupalkit();

  server.use(
    http.post("*/oauth/token", async () =>
      HttpResponse.json(ErrorResponse, { status: 400 }),
    ),
  );

  const result = await drupalkit.simpleOauth.requestToken(
    "client_credentials",
    {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    },
  );

  const res = result.expectErr("Expected error");

  expect(res instanceof DrupalkitSimpleOauthError).toBeTruthy();
  expect(res.statusCode).toBe(400);
});

test("Handle network errors", async () => {
  const drupalkit = createDrupalkit();

  server.use(http.post("*/oauth/token", async () => HttpResponse.error()));

  const result = await drupalkit.simpleOauth.requestToken(
    "client_credentials",
    {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    },
  );

  const error = result.expectErr("Expected error");
  expect(error.message.includes("Failed to fetch")).toBeTruthy();
});

test("Do not produce DrupalkitSimpleOauthErrors when not requesting a token", async () => {
  const drupalkit = createDrupalkit();

  server.use(
    http.post("*/not/oauth/related", async () =>
      HttpResponse.text(null, { status: 400 }),
    ),
  );

  const result = await drupalkit.request("/not/oauth/related", {
    method: "POST",
  });

  const error = result.expectErr("Expected error");

  expect(!(error instanceof DrupalkitSimpleOauthError)).toBeTruthy();
});

test("Request user info", async () => {
  const drupalkit = createDrupalkit();

  server.use(
    http.get("*/oauth/userinfo", async () =>
      HttpResponse.json(UserInfoResponse),
    ),
  );

  const result = await drupalkit.simpleOauth.getUserInfo();

  const res = result.unwrap();

  expect(res).toMatchSnapshot();
});

test("Request user info with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.get("*/oauth/userinfo", async ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");

      return HttpResponse.json(UserInfoResponse);
    }),
  );

  await drupalkit.simpleOauth.getUserInfo({
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test("Request user info with explicit endpoint", async () => {
  const endpoint = "/custom/userinfo";

  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    oauthUserInfoEndpoint: endpoint,
  });

  server.use(
    http.get("*/custom/userinfo", async () =>
      HttpResponse.json(UserInfoResponse),
    ),
  );

  const result = await drupalkit.simpleOauth.getUserInfo();

  expect(result.ok).toBeTruthy();
});

test("Handle request errors when requesting user info", async () => {
  const drupalkit = createDrupalkit();

  server.use(
    http.get("*/oauth/userinfo", async () =>
      HttpResponse.json(ErrorResponse, { status: 400 }),
    ),
  );

  const result = await drupalkit.simpleOauth.getUserInfo();

  const error = result.expectErr("Expected error");

  expect(!(error instanceof DrupalkitSimpleOauthError)).toBeTruthy();
  expect(error instanceof DrupalkitError).toBeTruthy();
  expect(error.statusCode).toBe(400);
});
