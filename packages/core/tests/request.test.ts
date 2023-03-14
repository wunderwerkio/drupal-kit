import fetchMock, { enableFetchMocks } from "jest-fetch-mock";
import { DrupalkitError } from "@drupalkit/error";

import { Drupalkit } from "../src";
import { mockResponse } from "../test-utils";
import DemoEndpointResponse from "./fixtures/demo-endpoint.json";

enableFetchMocks();

describe("request", () => {
  const BASE_URL = "https://my-drupal.com";

  it("should request", async () => {
    const drupalkit = new Drupalkit({
      baseUrl: BASE_URL,
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/demo-endpoint",
      payloadFixture: DemoEndpointResponse,
    });

    const result = await drupalkit.request("/demo-endpoint", {
      method: "GET",
      headers: {},
    });

    expect(result.ok).toBeTruthy();

    const response = result.unwrap();

    expect(response.status).toBe(200);
    expect(response.url).toContain("/demo-endpoint");
    expect(response.url).toContain(BASE_URL);
    expect(response.data).toEqual(DemoEndpointResponse);
    expect(response.headers).toHaveProperty("content-type");
  });

  it("should return drupalkit errors", async () => {
    const drupalkit = new Drupalkit({
      baseUrl: BASE_URL,
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/not-found",
      status: 404,
    });

    const result = await drupalkit.request("/not-found", {
      method: "GET",
      headers: {},
    });

    expect(result.err).toBeTruthy();

    if (result.err) {
      const error = result.val;

      expect(error).toBeInstanceOf(DrupalkitError);
      expect(error.statusCode).toBe(404);
    }
  });

  it("should append locale to url", async () => {
    const drupalkit = new Drupalkit({
      baseUrl: BASE_URL,
      locale: "en",
      defaultLocale: "de",
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/demo-endpoint",
      payloadFixture: DemoEndpointResponse,
      locale: "en",
    });

    const result = await drupalkit.request("/demo-endpoint", {
      method: "GET",
      headers: {},
    });

    expect(result.ok).toBeTruthy();
    const response = result.unwrap();

    expect(response.url).toContain("/en/demo-endpoint");
  });

  it("should append locale override to url", async () => {
    const drupalkit = new Drupalkit({
      baseUrl: BASE_URL,
      locale: "en",
      defaultLocale: "de",
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/demo-endpoint",
      locale: "de",
    });

    const result = await drupalkit.request("/demo-endpoint", {
      method: "GET",
      headers: {},
      locale: "de",
    });

    expect(result.ok).toBeTruthy();
    const response = result.unwrap();

    expect(response.url).not.toContain("/en/demo-endpoint");
  });

  it("should execute hooks", async () => {
    const drupalkit = new Drupalkit({
      baseUrl: BASE_URL,
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/demo-endpoint",
    });

    const beforeHook = jest.fn();
    const afterHook = jest.fn();

    drupalkit.hook.before("request", beforeHook);
    drupalkit.hook.after("request", afterHook);

    await drupalkit.request("/demo-endpoint", {
      method: "GET",
      headers: {},
    });

    expect(beforeHook.mock.calls).toHaveLength(1);
    expect(beforeHook.mock.calls[0][0]).toHaveProperty("baseUrl");
    expect(afterHook.mock.calls).toHaveLength(1);
    expect(afterHook.mock.calls[0][0]).toHaveProperty("status");
    expect(afterHook.mock.calls[0][0]).toHaveProperty("data");
    expect(afterHook.mock.calls[0][0]).toHaveProperty("headers");
  });
});
