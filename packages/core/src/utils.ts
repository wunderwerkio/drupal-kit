/**
 * Trim slashes at start / end from given segment.
 *
 * @param segment - The segment or url.
 */
export const trimSlashesFromSegment = (segment: string) => {
  // return segment.replace(/^\/+/, "").replace(/\/+$/, "");
  let start = 0;
  let end = segment.length;

  while (start < end && segment[start] === "/") {
    start++;
  }

  while (end > start && segment[end - 1] === "/") {
    end--;
  }

  return segment.substring(start, end);
};
