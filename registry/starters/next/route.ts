import { handleChatRequest } from "@/lib/glossen/chat"

export const maxDuration = 60

export function POST(req: Request) {
  return handleChatRequest(req)
}
