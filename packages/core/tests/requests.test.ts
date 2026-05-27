import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { Drupalkit, DrupalkitError } from "../src/index.js";

const { default: DemoEndpointResponse } = await import(
  "./fixtures/demo-endpoint.json",
  { with: { type: "json" } }
);

const BASE_URL = "https://my-drupal.com";

const server = setupServer(
  http.get("*/demo-endpoint", () => {
    return HttpResponse.json(DemoEndpointResponse);
  }),
  http.get("*/not-found", () => HttpResponse.text("", { status: 404 })),
  http.get("*/network-error", () => HttpResponse.error()),
);

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

test("Make simple GET request", async () => {
  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request("/demo-endpoint", {
    method: "GET",
    headers: {},
  });

  expect(result.ok).toBeTruthy();

  const response = result.unwrap();

  expect(response.status).toBe(200);
  expect(response.url.includes("/demo-endpoint")).toBeTruthy();
  expect(response.url.startsWith(BASE_URL)).toBeTruthy();
  expect(response.data).toEqual(DemoEndpointResponse);
  expect("content-type" in response.headers).toBeTruthy();
});

test("Make request with payload", async () => {
  expect.assertions(3);

  const headers = {
    "X-Custom": "value",
  };
  const body = {
    hello: "world",
  };

  server.use(
    http.post("*/demo-endpoint", async ({ request }) => {
      const payload = await request.json();
      expect(payload).toEqual(body);
      expect(request.headers.get("X-Custom")).toEqual(headers["X-Custom"]);

      return HttpResponse.text();
    }),
  );

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request("/demo-endpoint", {
    method: "POST",
    headers,
    body,
  });

  expect(result.ok).toBeTruthy();
});

test("Add response data to result", async () => {
  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request("/demo-endpoint", {
    method: "GET",
  });

  const { headers } = result.unwrap();

  expect(headers["content-type"]).toBe("application/json");
});

test("Do not add response data for 204 and 205 responses", async () => {
  server.use(
    http.get("*/demo-endpoint-204", async () => {
      return HttpResponse.text(null, { status: 204 });
    }),
  );

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request("/demo-endpoint-204", {
    method: "GET",
  });

  expect(result.unwrap().data).toBe(undefined);
});

test("Return drupalkit errors", async () => {
  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request("/not-found", {
    method: "GET",
    headers: {},
  });

  expect(result.err).toBeTruthy();

  const err = result.expectErr("Must be error");

  expect(err instanceof DrupalkitError).toBeTruthy();
  expect(err.statusCode).toBe(404);
});

test("Append locale to url", async () => {
  http.get("*/en/demo-endpoint", () => {
    return HttpResponse.json(DemoEndpointResponse);
  });

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
    locale: "en",
    defaultLocale: "de",
  });

  const result = await drupalkit.request("/demo-endpoint", {
    method: "GET",
    headers: {},
  });

  const response = result.unwrap();

  expect(response.url.includes("/en/demo-endpoint")).toBeTruthy();
});

test("Append overwritten locale to url", async () => {
  http.get("*/en/demo-endpoint", () => {
    return HttpResponse.json(DemoEndpointResponse);
  });

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
    defaultLocale: "de",
  });

  const result = await drupalkit.request("/demo-endpoint", {
    method: "GET",
    headers: {},
    locale: "en",
  });

  const response = result.unwrap();

  expect(response.url.includes("/en/demo-endpoint")).toBeTruthy();
});

test("Execute hooks", async () => {
  expect.assertions(5);

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  drupalkit.hook.before("request", (options) => {
    expect(options.baseUrl).toBe(BASE_URL);
  });

  drupalkit.hook.after("request", (result, options) => {
    expect(options.baseUrl).toBe(BASE_URL);

    expect(result.status).toBe(200);
    expect(result.data).toEqual(DemoEndpointResponse);
    expect(result.headers["content-type"]).toBe("application/json");
  });

  await drupalkit.request("/demo-endpoint", {
    method: "GET",
    headers: {},
  });
});

test("Add auth header if present", async () => {
  expect.assertions(3);
  const authHeaderValue = "Bearer 00000";

  server.use(
    http.get(
      "*/demo-endpoint",
      ({ request }) => {
        expect(request.headers.get("authorization")).toBe(authHeaderValue);

        return HttpResponse.text();
      },
      { once: true },
    ),
  );

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  drupalkit.setAuth(authHeaderValue);

  await drupalkit.request("/demo-endpoint", {
    method: "GET",
  });

  // With explicit unauthenticated.

  server.resetHandlers();
  server.use(
    http.get(
      "*/demo-endpoint",
      ({ request }) => {
        expect(request.headers.get("authorization")).toBe(null);

        return HttpResponse.text();
      },
      { once: true },
    ),
  );

  await drupalkit.request("/demo-endpoint", {
    method: "GET",
    unauthenticated: true,
  });

  // Unset auth.
  drupalkit.unsetAuth();

  server.resetHandlers();
  server.use(
    http.get(
      "*/demo-endpoint",
      ({ request }) => {
        expect(request.headers.get("authorization")).toBe(null);

        return HttpResponse.text();
      },
      { once: true },
    ),
  );

  await drupalkit.request("/demo-endpoint", {
    method: "GET",
  });
});

test("Handle network errors", async () => {
  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request("/network-error", {
    method: "GET",
  });

  expect(result.err).toBeTruthy();
  const error = result.expectErr("Must be error");

  expect(error instanceof DrupalkitError).toBeTruthy();
  expect(error.response).toBe(undefined);
});

test("Allow options overrides", async () => {
  expect.assertions(3);

  server.use(
    http.get("*/en/demo-endpoint", () => {
      return HttpResponse.json(DemoEndpointResponse);
    }),
  );

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
    defaultLocale: "de",
  });

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("force-cache");
    expect(options.next).toEqual({
      revalidate: 5,
      tags: ["tag1", "user:3"],
    });
  });

  const result = await drupalkit.request(
    "/demo-endpoint",
    {
      method: "GET",
      headers: {},
      locale: "de",
    },
    {
      locale: "en",
      cache: "force-cache",
      // @ts-ignore
      next: {
        revalidate: 5,
        tags: ["tag1", "user:3"],
      },
    },
  );

  const response = result.unwrap();

  expect(response.url.includes("/en/demo-endpoint")).toBeTruthy();
});
