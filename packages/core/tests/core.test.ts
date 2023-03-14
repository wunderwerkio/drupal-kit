import { Drupalkit } from "../src";

describe("core", () => {
  it("should instanciate", () => {
    new Drupalkit({
      baseUrl: "https://drupal-headless-boilerplate.ddev.site",
    });
  });
});
