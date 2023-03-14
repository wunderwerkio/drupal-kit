import { Drupalkit } from "../src";

describe("core", () => {
  it("should instanciate", () => {
    const drupalkit = new Drupalkit({
      baseUrl: "https://drupal-headless-boilerplate.ddev.site",
    });
  });
});
