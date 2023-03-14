import { Response } from "node-fetch";

/**
 * Get buffer from response.
 *
 * @param response - The response object.
 */
export default function getBufferResponse(response: Response) {
  return response.arrayBuffer();
}
