import fs from "fs";
import path from "path";

const DECLARATION_FILE = path.resolve("./dist/index.d.ts");

fs.readFile(DECLARATION_FILE, (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  const content = data.toString("utf-8");
  const newContent = content
    .replaceAll("<Type extends never", "<Type extends keyof JsonApiResources")
    .replaceAll(
      "<TResourceType extends never",
      "<TResourceType extends keyof JsonApiResources",
    )
    .replaceAll(
      "<TResourceType_1 extends never",
      "<TResourceType_1 extends keyof JsonApiResources",
    );

  fs.writeFile(DECLARATION_FILE, newContent, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
});
