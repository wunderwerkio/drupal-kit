import fetchMock, { enableFetchMocks } from "jest-fetch-mock";
import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";
import { mockNetworkError, mockResponse } from "@drupal-kit/core/test-utils";

import { DrupalkitConsumers } from "../src/index";

enableFetchMocks();

describe("DrupalkitConsumers", () => {
  const BASE_URL = "https://my-drupal.com";
  const CONSUMER_UUID = "my-consumer-uuid";

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

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should add consumer id to request", async () => {
    const drupalkit = createDrupalkit({
      baseUrl: BASE_URL,
      consumerUUID: CONSUMER_UUID,
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/",
    });

    const result = await drupalkit.request("/", {
      method: "GET",
    });

    expect(result.ok).toBeTruthy();

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: {
        "X-Consumer-ID": CONSUMER_UUID,
      },
    });
  });

  it("should not add consumer id header to request if no value is supplied", async () => {
    const drupalkit = createDrupalkit({
      baseUrl: BASE_URL,
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/",
    });

    await drupalkit.request("/", {
      method: "GET",
    });

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty(
      "X-Consumer-ID",
    );
  });

  it("should add consumer id with custom header name", async () => {
    const drupalkit = createDrupalkit({
      baseUrl: BASE_URL,
      consumerUUID: CONSUMER_UUID,
      consumerHeaderName: "X-Custom-Consumer-ID",
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/",
    });

    await drupalkit.request("/", {
      method: "GET",
    });

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({
      "X-Custom-Consumer-ID": CONSUMER_UUID,
    });
  });
});
