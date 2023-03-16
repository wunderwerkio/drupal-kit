import fetchMock, { enableFetchMocks } from "jest-fetch-mock";

import { Drupalkit, DrupalkitError } from "..";
import { mockNetworkError, mockResponse } from "../test-utils";
import DemoEndpointResponse from "./fixtures/demo-endpoint.json";

enableFetchMocks();

describe("request", () => {
  const BASE_URL = "https://my-drupal.com";

  beforeEach(() => {
    fetchMock.resetMocks();
  });

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

  it("should request with payload", async () => {
    const drupalkit = new Drupalkit({
      baseUrl: BASE_URL,
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/demo-endpoint",
    });

    const headers = {
      "X-Custom": "value",
    };
    const body = {
      hello: "world",
    };

    const result = await drupalkit.request("/demo-endpoint", {
      method: "POST",
      headers,
      body,
    });

    expect(result.ok).toBeTruthy();

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  });

  it("should add response data to custom response", async () => {
    const drupalkit = new Drupalkit({
      baseUrl: BASE_URL,
    });

    const headers = {
      "x-custom": "value",
    };

    mockResponse(fetchMock, drupalkit, {
      url: "/demo-endpoint",
      headers,
    });

    const result = await drupalkit.request("/demo-endpoint", {
      method: "GET",
    });

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.val.headers).toMatchObject(headers);
    }
  });

  it("should not add response body for 204 and 205 response", async () => {
    const drupalkit = new Drupalkit({
      baseUrl: BASE_URL,
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/demo-endpoint",
      status: 204,
    });

    const result = await drupalkit.request("/demo-endpoint", {
      method: "GET",
    });

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.val.data).toBeUndefined();
    }
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

  it("should add auth header if present", async () => {
    const drupalkit = new Drupalkit({
      baseUrl: BASE_URL,
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/demo-endpoint",
    });

    const authHeaderValue = "Bearer 00000";

    drupalkit.setAuth(authHeaderValue);

    await drupalkit.request("/demo-endpoint", {
      method: "GET",
    });

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: authHeaderValue,
      },
    });
  });

  it("should not add auth header if anonymous", async () => {
    const drupalkit = new Drupalkit({
      baseUrl: BASE_URL,
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/demo-endpoint",
    });

    const authHeaderValue = "Bearer 00000";

    drupalkit.setAuth(authHeaderValue);

    await drupalkit.request("/demo-endpoint", {
      method: "GET",
      unauthenticated: true,
    });

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).not.toMatchObject({
      headers: {
        authorization: authHeaderValue,
      },
    });
  });

  /**
   * Handle network errors.
   */
  it("should handle network errors", async () => {
    const drupalkit = new Drupalkit({
      baseUrl: BASE_URL,
    });

    mockNetworkError(fetchMock);

    const result = await drupalkit.request("/demo-endpoint", {
      method: "GET",
    });

    expect(result.err).toBeTruthy();
    if (result.err) {
      expect(result.val.message).toBe("Network Error");
      expect(result.val.response).toBeUndefined();
    }
  });
});
