import { Drupalkit } from "@drupal-kit/core";

import { DrupalkitJsonApi } from "../src/index";

describe("core", () => {
  it("should instanciate", () => {
    const EnhancedDrupalkit = Drupalkit.plugin(DrupalkitJsonApi);

    const drupalkit = new EnhancedDrupalkit({
      baseUrl: "https://example.com",
    });

    expect(drupalkit).toHaveProperty("jsonApi");
  });
});
