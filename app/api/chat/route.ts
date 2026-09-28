import { handleChatRequest } from "@/lib/glossen/chat"

export const maxDuration = 60

// Demo-only limits for the public site. The installed starter has none.
const maxRequestBytes = 512 * 1024
const maxOutputTokens = 4096

export async function POST(req: Request) {
  const body = await req.text()
  if (new TextEncoder().encode(body).byteLength > maxRequestBytes) {
    return new Response(
      "This conversation is larger than the public demo accepts (512 KB). Remove some passages or start a new chat.",
      { status: 413, headers: { "content-type": "text/plain; charset=utf-8" } }
    )
  }

  return handleChatRequest(
    new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body,
      signal: req.signal,
    }),
    { maxOutputTokens }
  )
}
