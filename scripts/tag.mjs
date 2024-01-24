import path from "node:path";
import { getPackages } from "@manypkg/get-packages";
import { tag as gitTag, getAllTags } from "@changesets/git";

(async () => {
  const cwd = path.resolve(".");

  const { packages } = await getPackages(cwd);

  const corePackage = packages.find(
    (pkg) => pkg.packageJson.name === "@drupal-kit/core",
  );
  if (!corePackage) {
    throw new Error("Git tag failed: could not get core package!");
  }

  const tag = `v${corePackage.packageJson.version}`;

  const allExistingTags = await getAllTags(cwd);

  if (allExistingTags.has(tag)) {
    console.log("Skipping tag (already exists): ", tag);
  } else {
    console.log("New tag: ", tag);
    await gitTag(tag, cwd);
  }
})();
