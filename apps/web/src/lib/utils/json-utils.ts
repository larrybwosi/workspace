import { NextResponse } from "next/server";

/**
 * Custom JSON serialization that handles BigInt.
 */
export function safeJson(data: any, options: ResponseInit = {}) {
  const json = JSON.stringify(data, (key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );

  const responseOptions = {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
    },
  };

  return new NextResponse(json, responseOptions);
}
