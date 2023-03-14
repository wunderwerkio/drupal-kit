import { DrupalkitError } from "@drupalkit/error";

import { Drupalkit } from "../src";

describe("request", () => {
  const baseUrl = "https://drupal-headless-boilerplate.ddev.site";

  it("should request", async () => {
    const drupalkit = new Drupalkit({
      baseUrl,
    });

    const result = await drupalkit.request("/jsonapi", {
      method: "GET",
      headers: {},
    });

    expect(result.ok).toBeTruthy();

    const response = result.unwrap();

    expect(response.status).toBe(200);
    expect(response.url).toContain("/jsonapi");
    expect(response.url).toContain(baseUrl);
    expect(response.data).not.toBeNull();
    expect(response.headers).toHaveProperty("content-type");
  });

  it("should return drupalkit errors", async () => {
    const drupalkit = new Drupalkit({
      baseUrl,
    });

    const result = await drupalkit.request("/not-found", {
      method: "GET",
      headers: {},
    });

    expect(result.err).toBeTruthy();

    if (result.err) {
      const error = result.val;

      expect(error).toBeInstanceOf(DrupalkitError);
      expect(error.status).toBe(404);
    }
  });

  it("should append locale to url", async () => {
    const drupalkit = new Drupalkit({
      baseUrl,
      locale: "en",
      defaultLocale: "de",
    });

    const result = await drupalkit.request("/jsonapi", {
      method: "GET",
      headers: {},
    });

    expect(result.ok).toBeTruthy();
    const response = result.unwrap();

    expect(response.url).toContain("/en/jsonapi");
  });

  it("should append locale override to url", async () => {
    const drupalkit = new Drupalkit({
      baseUrl,
      locale: "en",
      defaultLocale: "de",
    });

    const result = await drupalkit.request("/jsonapi", {
      method: "GET",
      headers: {},
      locale: "de",
    });

    expect(result.ok).toBeTruthy();
    const response = result.unwrap();

    expect(response.url).not.toContain("/en/jsonapi");
  });

  it("should execute hooks", async () => {
    const drupalkit = new Drupalkit({
      baseUrl,
    });

    const beforeHook = jest.fn();
    const afterHook = jest.fn();

    drupalkit.hook.before("request", beforeHook);
    drupalkit.hook.after("request", afterHook);

    await drupalkit.request("/jsonapi", {
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
