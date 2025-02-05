import test from "ava";

import { trimSlashesFromSegment } from "../src/utils.js";

test("Trim slashes from segment", (t) => {
  t.is(trimSlashesFromSegment("/"), "");
  t.is(trimSlashesFromSegment("/test"), "test");
  t.is(trimSlashesFromSegment("test/"), "test");
  t.is(trimSlashesFromSegment("test/test"), "test/test");
  t.is(trimSlashesFromSegment("//test"), "test");
  t.is(trimSlashesFromSegment("///test"), "test");
  t.is(trimSlashesFromSegment("///test/"), "test");
  t.is(trimSlashesFromSegment("test//"), "test");
  t.is(trimSlashesFromSegment("test//test"), "test//test");
});
