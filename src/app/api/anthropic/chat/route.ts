// @ts-nocheck
import { StreamingTextResponse } from "ai";
import { type Message } from "ai/react";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "edge";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const stream = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 4096,
    messages: messages.map((m: Message) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content
    })),
    system: "You are a helpful AI assistant",
    stream: true
  });

  // Convert Anthropic stream to ReadableStream
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta') {
            const text = chunk.delta?.text;
            if (text) {
              controller.enqueue(text);
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return new StreamingTextResponse(readableStream);
}
