import { Drupalkit } from "../src";

describe("core", () => {
  it("should instanciate", () => {
    new Drupalkit({
      baseUrl: "https://drupal-headless-boilerplate.ddev.site",
    });
  });

  it("should allow deep merge plugins", async () => {
    const pluginOne = () => {
      return {
        oneUniq: true,
        shared: {
          propFromOne: "one",
        },
      };
    };

    const pluginTwo = () => {
      return {
        twoUniq: true,
        shared: {
          propFromTwo: "two",
        },
      };
    };

    const EnhancedDrupalkit = Drupalkit.plugin(pluginOne, pluginTwo);

    const instance = new EnhancedDrupalkit({ baseUrl: "some-url" });

    expect(instance).toHaveProperty("oneUniq");
    expect(instance).toHaveProperty("twoUniq");
    expect(instance.shared).toHaveProperty("propFromOne");
    expect(instance.shared).toHaveProperty("propFromTwo");
  });
});
