import fetchMock, { enableFetchMocks } from "jest-fetch-mock";
import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";
import { mockNetworkError, mockResponse } from "@drupal-kit/core/test-utils";

import { DrupalkitVerification } from "../src/index";
import { hashVerification, magicCodeVerification } from "../src/verification";

enableFetchMocks();

describe("DrupalkitVerification", () => {
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

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should instanciate", async () => {
    const drupalkit = createDrupalkit();

    expect(drupalkit).toHaveProperty("verification");
  });

  it("should add hash verification to a request once", async () => {
    const drupalkit = createDrupalkit();

    const hash = "0123456789abcdef";

    mockResponse(fetchMock, drupalkit, {
      url: "/",
    });

    drupalkit.addVerification(hashVerification(hash));
    const result = await drupalkit.request("/", {
      method: "GET",
    });

    expect(result.ok).toBe(true);

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: {
        "x-verification-hash": hash,
      },
    });
  });

  it("should add magic code verification to a request once", async () => {
    const drupalkit = createDrupalkit();

    const code = "5ZL-KD2";

    mockResponse(fetchMock, drupalkit, {
      url: "/",
    });

    drupalkit.addVerification(magicCodeVerification(code));

    // First request.
    let result = await drupalkit.request("/", {
      method: "GET",
    });

    expect(result.ok).toBe(true);

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: {
        "x-verification-magic-code": code,
      },
    });

    // Second request.
    result = await drupalkit.request("/", {
      method: "GET",
    });

    expect(result.ok).toBe(true);

    // @ts-ignore
    expect(fetchMock.mock.calls[1][1]).not.toMatchObject({
      headers: {
        "x-verification-magic-code": code,
      },
    });
  });
});
