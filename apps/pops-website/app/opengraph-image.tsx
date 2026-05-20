import {
  createShareImageResponse,
  OG_ALT,
  OG_CONTENT_TYPE,
  OG_SIZE,
} from "../lib/og/create-share-image-response";

export const runtime = "nodejs";
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OpenGraphImage() {
  return createShareImageResponse();
}
