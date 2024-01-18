import coreDeprecate from "util-deprecate";

/**
 * Wrapper arround the util-deprecate deprecate function.
 *
 * Generates the deprecation proper message.
 *
 * @param fn - The function to deprecate.
 * @param deprecatedFuncName - The name of the deprecated function.
 */
// eslint-disable-next-line
export function deprecate(fn: Function, deprecatedFuncName: string) {
  return coreDeprecate(
    fn,
    `drupalkit.userApi.${deprecatedFuncName}() is deprecated, use drupalkit.userApi.${fn.name}() instead.`,
  );
}
