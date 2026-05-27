import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";

import { DrupalkitConsumers } from "../src/index.js";

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

const BASE_URL = "https://my-drupal.com";
const CONSUMER_ID = "my-consumer-uuid";

const createDrupalkit = (
  options: DrupalkitOptions = {
    baseUrl: BASE_URL,
  },
) => {
  const EnhancedDrupalkit = Drupalkit.plugin(DrupalkitConsumers);

  return new EnhancedDrupalkit({
    locale: "de",
    defaultLocale: "de",
    ...options,
  });
};

test("Add consumer id to request", async () => {
  expect.assertions(2);

  server.use(
    http.get("*", ({ request }) => {
      expect(request.headers.get("X-Consumer-ID")).toBe(CONSUMER_ID);

      return HttpResponse.text();
    }),
  );

  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    consumerId: CONSUMER_ID,
  });

  const result = await drupalkit.request("/", {
    method: "GET",
  });

  expect(result.ok).toBeTruthy();
});

test("Do not add consumer id header if no value is supplied", async () => {
  expect.assertions(1);

  server.use(
    http.get("*", ({ request }) => {
      expect(request.headers.get("X-Consumer-ID")).toBe(null);

      return HttpResponse.text();
    }),
  );

  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
  });

  await drupalkit.request("/", {
    method: "GET",
  });
});

test("Add consumer id with custom header name", async () => {
  expect.assertions(1);

  server.use(
    http.get("*", ({ request }) => {
      expect(request.headers.get("X-Custom-Consumer-ID")).toBe(CONSUMER_ID);

      return HttpResponse.text();
    }),
  );

  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    consumerId: CONSUMER_ID,
    consumerHeaderName: "X-Custom-Consumer-ID",
  });

  await drupalkit.request("/", {
    method: "GET",
  });
});

test("Add consumer id to request - via deprecated consumerUUID", async () => {
  expect.assertions(2);

  server.use(
    http.get("*", ({ request }) => {
      expect(request.headers.get("X-Consumer-ID")).toBe(CONSUMER_ID);

      return HttpResponse.text();
    }),
  );

  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    consumerUUID: CONSUMER_ID,
  });

  const result = await drupalkit.request("/", {
    method: "GET",
  });

  expect(result.ok).toBeTruthy();
});

test("Do not overwrite already existing consumer id header", async () => {
  const otherId = "other";
  expect.assertions(2);

  server.use(
    http.get("*", ({ request }) => {
      expect(request.headers.get("X-Consumer-ID")).toBe(otherId);

      return HttpResponse.text();
    }),
  );

  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    consumerUUID: CONSUMER_ID,
  });

  const result = await drupalkit.request("/", {
    method: "GET",
    headers: {
      "X-Consumer-ID": otherId,
    },
  });

  expect(result.ok).toBeTruthy();
});
