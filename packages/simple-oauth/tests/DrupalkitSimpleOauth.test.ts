import fetchMock, { enableFetchMocks } from "jest-fetch-mock";
import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";
import { mockNetworkError, mockResponse } from "@drupal-kit/core/test-utils";

import { DrupalkitSimpleOauth } from "../src/index";
import ErrorResponse from "./fixtures/error_response.json";
import TokenResponse from "./fixtures/token_response.json";

enableFetchMocks();

describe("DrupalkitSimpleOauth", () => {
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

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should instanciate", () => {
    const drupalkit = createDrupalkit();

    expect(drupalkit).toHaveProperty("simpleOauth");
  });

  it("should request token with client credentials grant", async () => {
    const drupalkit = createDrupalkit();

    mockResponse(fetchMock, drupalkit, {
      url: "/oauth/token",
      payloadFixture: TokenResponse,
    });

    const result = await drupalkit.simpleOauth.requestToken(
      "client_credentials",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      },
    );

    expect(result.ok).toBeTruthy();

    if (result.ok) {
      expect(result.val).toMatchSnapshot("token-response");
    }

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1].body).toBeInstanceOf(URLSearchParams);

    // @ts-ignore
    const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.toString()).toMatchSnapshot("request-payload");
  });

  it("should request token explicit endpoint", async () => {
    const drupalkit = createDrupalkit({
      baseUrl: BASE_URL,
      oauthTokenEndpoint: "/custom/token",
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/custom/token",
      payloadFixture: TokenResponse,
    });

    const result = await drupalkit.simpleOauth.requestToken(
      "client_credentials",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      },
    );

    expect(result.ok).toBeTruthy();
  });

  it("should handle request errors", async () => {
    const drupalkit = createDrupalkit();

    mockResponse(fetchMock, drupalkit, {
      url: "/oauth/token",
      status: 400,
      payloadFixture: ErrorResponse,
    });

    const result = await drupalkit.simpleOauth.requestToken(
      "client_credentials",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      },
    );

    expect(result.err).toBeTruthy();

    if (result.err) {
      expect(result.val.statusCode).toEqual(400);
    }
  });

  it("should handle network errors when requesting token", async () => {
    const drupalkit = createDrupalkit();

    mockNetworkError(fetchMock);

    const result = await drupalkit.simpleOauth.requestToken(
      "client_credentials",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      },
    );

    expect(result.err).toBeTruthy();
  });
});
