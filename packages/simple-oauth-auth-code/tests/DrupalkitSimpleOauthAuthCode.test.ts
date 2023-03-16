import fetchMock, { enableFetchMocks } from "jest-fetch-mock";
import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";
import { mockNetworkError, mockResponse } from "@drupal-kit/core/test-utils";

import { DrupalkitSimpleOauthAuthCode } from "../src/index";
import AuthCodeResponse from "./fixtures/auth_code_response.json";

enableFetchMocks();

describe("DrupalkitSimpleOauthAuthCode", () => {
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

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should request auth code", async () => {
    const drupalkit = createDrupalkit();

    const operation = "register";
    const email = "F3f6Z@example.com";

    mockResponse(fetchMock, drupalkit, {
      url: "/simple-oauth/auth-code",
      payloadFixture: AuthCodeResponse,
    });

    const result = await drupalkit.simpleOauth.requestAuthCode(
      operation,
      email,
    );

    expect(result.ok).toBeTruthy();

    if (result.ok) {
      expect(result.val).toEqual(AuthCodeResponse);
    }
  });

  it("should request auth code with explicit endpoint", async () => {
    const endpoint = "/custom/auth-code";
    const drupalkit = createDrupalkit({
      baseUrl: BASE_URL,
      authCodeEndpoint: endpoint,
    });

    const operation = "register";
    const email = "F3f6Z@example.com";

    mockResponse(fetchMock, drupalkit, {
      url: endpoint,
      payloadFixture: AuthCodeResponse,
    });

    const result = await drupalkit.simpleOauth.requestAuthCode(
      operation,
      email,
    );

    expect(result.ok).toBeTruthy();
  });

  it("should handle network error", async () => {
    const drupalkit = createDrupalkit();

    const operation = "register";
    const email = "F3f6Z@example.com";

    mockNetworkError(fetchMock);

    const result = await drupalkit.simpleOauth.requestAuthCode(
      operation,
      email,
    );

    expect(result.err).toBeTruthy();
  });
});
