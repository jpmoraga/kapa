import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

export const FRIENDS_FAMILY_ACCESS_COOKIE = "kapa21_ff_access";

const DEFAULT_ACCESS_KEY = "KapaFF2026";

export function getFriendsFamilyAccessKey() {
  return process.env.FRIENDS_FAMILY_ACCESS_KEY?.trim() || DEFAULT_ACCESS_KEY;
}

function createAccessDigest(value: string) {
  return createHash("sha256").update(`kapa21-friends-family:${value}`).digest("hex");
}

export function isValidAccessKey(input: string) {
  const normalizedInput = input.trim();
  const accessKey = getFriendsFamilyAccessKey();

  const inputBuffer = Buffer.from(normalizedInput);
  const accessKeyBuffer = Buffer.from(accessKey);

  if (inputBuffer.length !== accessKeyBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, accessKeyBuffer);
}

export function createAccessCookieValue() {
  return createAccessDigest(getFriendsFamilyAccessKey());
}

export function hasValidAccessCookie(value: string | undefined) {
  if (!value) return false;

  const expectedBuffer = Buffer.from(createAccessCookieValue());
  const actualBuffer = Buffer.from(value);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
