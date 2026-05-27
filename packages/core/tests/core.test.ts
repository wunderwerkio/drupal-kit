import { expect, test } from "vitest";

import { Drupalkit } from "../src/index.js";

test("Instanciate drupalkit", () => {
  new Drupalkit({
    baseUrl: "https://drupal-headless-boilerplate.ddev.site",
  });
});

test("Deep merge plugins", () => {
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

  expect(Object.keys(instance).includes("oneUniq")).toBeTruthy();
  expect(Object.keys(instance).includes("twoUniq")).toBeTruthy();
  expect(Object.keys(instance.shared).includes("propFromOne")).toBeTruthy();
  expect(Object.keys(instance.shared).includes("propFromTwo")).toBeTruthy();
});

test("Set agent", () => {
  const instance = new Drupalkit({
    baseUrl: "https://drupal-headless-boilerplate.ddev.site",
  });

  expect(instance.agent).toBe(`drupal-kit/0.0.0-development`);
});

test("Build url with query", () => {
  const instance = new Drupalkit({
    baseUrl: "https://drupal-headless-boilerplate.ddev.site",
  });

  const url = instance.buildUrl("/api/some-endpoint", {
    query: {
      limit: 10,
      page: 5,
    },
  });

  expect(url).toBe(
    `https://drupal-headless-boilerplate.ddev.site/api/some-endpoint?limit=10&page=5`,
  );
});
