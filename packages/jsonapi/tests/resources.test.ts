import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import fetchMock, { enableFetchMocks } from "jest-fetch-mock";
import { Drupalkit } from "@drupalkit/core";
import { DrupalkitError } from "@drupalkit/error";

import { DrupalkitJsonApi } from "../src/index";
import JsonApiIndex from "./fixtures/jsonapi_index.json";
import JsonApiIndexError from "./fixtures/jsonapi_index_error.json";

enableFetchMocks();

describe("resources", () => {
  const BASE_URL = "https://my-drupal.com";

  const createDrupalkit = ({
    baseUrl = BASE_URL,
  }: { baseUrl?: string } = {}) => {
    const EnhancedDrupalkit = Drupalkit.plugin(DrupalkitJsonApi);

    return new EnhancedDrupalkit({
      baseUrl,
      locale: "de",
      defaultLocale: "de",
    });
  };

  it("should build json api url", () => {
    const drupalkit = createDrupalkit();
    const queryParams = new DrupalJsonApiParams();
    queryParams
      .addGroup("group")
      .addFilter("status", "1", "=", "test")
      .addSort("name", "ASC")
      .addInclude(["one", "two"])
      .addCustomParam({
        revision: "5",
      });

    // Simple url.
    let url = drupalkit.jsonApi.buildJsonApiUrl("node/article");
    expect(url).toMatchSnapshot("simple");

    // With query.
    url = drupalkit.jsonApi.buildJsonApiUrl("node/article", {
      query: queryParams.getQueryObject(),
    });
    expect(url).toMatchSnapshot("with-query");

    // With locale.
    url = drupalkit.jsonApi.buildJsonApiUrl("node/article", {
      localeOverride: "es",
    });
    expect(url).toMatchSnapshot("with-locale");

    // With base locale.
    url = drupalkit.jsonApi.buildJsonApiUrl("node/article", {
      localeOverride: "es",
      defaultLocaleOverride: "es",
    });
    expect(url).toMatchSnapshot("with-base-locale");

    // With locale and query.
    url = drupalkit.jsonApi.buildJsonApiUrl("node/article", {
      localeOverride: "es",
      query: queryParams.getQueryObject(),
    });
    expect(url).toMatchSnapshot("with-locale-and-query");
  });

  it("should get jsonapi index", async () => {
    const drupalkit = createDrupalkit();

    fetchMock.mockResponseOnce(() =>
      Promise.resolve({
        body: JSON.stringify(JsonApiIndex),
        headers: {
          "content-type": "application/vnd.api+json",
        },
      }),
    );

    let index = await drupalkit.jsonApi.getIndex();

    expect(index.ok).toBeTruthy();

    if (index.ok) {
      expect(JSON.stringify(index.val)).toMatchSnapshot("jsonapi-index");

      expect(index.val).toHaveProperty("jsonapi");
      expect(index.val).toHaveProperty("data");
      expect(index.val).toHaveProperty("links");
    }

    // With error
    fetchMock.mockResponseOnce(() =>
      Promise.resolve({
        body: JSON.stringify(JsonApiIndexError),
        status: 500,
        headers: {
          "content-type": "application/vnd.api+json",
        },
      }),
    );

    index = await drupalkit.jsonApi.getIndex();

    expect(index.err).toBeTruthy();

    if (index.err) {
      expect(index.val).toBeInstanceOf(DrupalkitError);
    }
  });
});
