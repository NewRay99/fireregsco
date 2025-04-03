// @ts-nocheck
import OpenAI from "openai";
import { StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  const openai = new OpenAI({
    apiKey: apiKey
  });

  try {
    const { messages } = await req.json();
    
    const stream = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      stream: true
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat completion" },
      { status: 500 }
    );
  }
}
