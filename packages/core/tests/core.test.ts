import test from "ava";

import { Drupalkit } from "../src/index.js";

test("Instanciate drupalkit", (t) => {
  new Drupalkit({
    baseUrl: "https://drupal-headless-boilerplate.ddev.site",
  });

  t.pass();
});

test("Deep merge plugins", (t) => {
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

  t.assert(Object.keys(instance).includes("oneUniq"));
  t.assert(Object.keys(instance).includes("twoUniq"));
  t.assert(Object.keys(instance.shared).includes("propFromOne"));
  t.assert(Object.keys(instance.shared).includes("propFromTwo"));
});

test("Set agent", (t) => {
  const instance = new Drupalkit({
    baseUrl: "https://drupal-headless-boilerplate.ddev.site",
  });

  t.is(instance.agent, `drupal-kit/0.0.0-development`);
});

test("Build url with query", (t) => {
  const instance = new Drupalkit({
    baseUrl: "https://drupal-headless-boilerplate.ddev.site",
  });

  const url = instance.buildUrl("/api/some-endpoint", {
    query: {
      limit: 10,
      page: 5,
    },
  });

  t.is(
    url,
    `https://drupal-headless-boilerplate.ddev.site/api/some-endpoint?limit=10&page=5`,
  );
});
