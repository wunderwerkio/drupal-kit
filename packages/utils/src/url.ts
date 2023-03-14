/**
 * Trim slashes at start / end from given segment.
 *
 * @param segment - The segment or url.
 */
export const trimSlashesFromSegment = (segment: string) => {
  return segment.replace(/^\/+|(?<!\/)\/+$/g, "");
};
