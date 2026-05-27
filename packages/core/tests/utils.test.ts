import { expect, test } from "vitest";

import { trimSlashesFromSegment } from "../src/utils.js";

test("Trim slashes from segment", () => {
  expect(trimSlashesFromSegment("/")).toBe("");
  expect(trimSlashesFromSegment("/test")).toBe("test");
  expect(trimSlashesFromSegment("test/")).toBe("test");
  expect(trimSlashesFromSegment("test/test")).toBe("test/test");
  expect(trimSlashesFromSegment("//test")).toBe("test");
  expect(trimSlashesFromSegment("///test")).toBe("test");
  expect(trimSlashesFromSegment("///test/")).toBe("test");
  expect(trimSlashesFromSegment("test//")).toBe("test");
  expect(trimSlashesFromSegment("test//test")).toBe("test//test");
});
