import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { EntryPointClassification } from "@/lib/types";

// Request validation schemas
const EntryPointSchema = z.object({
  file: z.string(),
  function: z.string(),
});

const CallEdgeSchema = z.object({
  from_file: z.string(),
  from_func: z.string(),
  to_file: z.string(),
  to_func: z.string(),
});

const ClassifyRequestSchema = z.object({
  entries: z.array(EntryPointSchema),
  calls: z.array(CallEdgeSchema),
});

// Response validation schema
const EntryPointClassificationSchema = z.object({
  file: z.string(),
  function: z.string(),
  isUserFacing: z.boolean(),
  type: z.enum(["cli-command", "api-endpoint", "main", "event-handler", "export", "internal", "test"]),
  description: z.string(),
  userAction: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

const ClassifyResponseSchema = z.object({
  classifications: z.array(EntryPointClassificationSchema),
});

export interface ClassifyResponse {
  classifications: EntryPointClassification[];
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest): Promise<NextResponse<ClassifyResponse | { error: string }>> {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const parseResult = ClassifyRequestSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: `Invalid request body: ${parseResult.error.message}` },
      { status: 400 }
    );
  }

  const { entries, calls } = parseResult.data;

  // Build context for each entry point
  const entryContexts = entries.map((entry) => {
    const callees = calls
      .filter((c) => c.from_file === entry.file && c.from_func === entry.function)
      .map((c) => `${c.to_func} (${c.to_file})`)
      .slice(0, 10); // Limit to avoid huge prompts

    return {
      ...entry,
      callees,
    };
  });

  const prompt = `You are analyzing a codebase to identify user-facing entry points.

For each function below, classify whether it's a user-facing entry point and what type.

Entry point types:
- cli-command: Handles a CLI command (main, run, execute patterns)
- api-endpoint: HTTP endpoint handler
- main: Application main entry point
- event-handler: Event/callback handler (onClick, onMessage, etc.)
- export: Just an exported function, not a true entry point
- internal: Internal helper that happens to have no callers
- test: Test function or test helper

For each entry, provide:
- isUserFacing: true if a real user would trigger this function
- type: one of the types above
- description: 1-sentence description of what this function does
- userAction: how a user triggers this (e.g., "runs 'clarity run'" or "calls POST /api/foo") or null if not user-facing
- confidence: 0-1 how confident you are

ENTRIES TO CLASSIFY:
${entryContexts.map((e, i) => `
${i + 1}. Function: ${e.function}
   File: ${e.file}
   Calls: ${e.callees.length > 0 ? e.callees.join(", ") : "(none)"}
`).join("\n")}

Respond with a JSON array of classifications in this exact format:
{
  "classifications": [
    {
      "file": "path/to/file.ts",
      "function": "functionName",
      "isUserFacing": true,
      "type": "cli-command",
      "description": "Runs the main pipeline...",
      "userAction": "runs 'clarity run'",
      "confidence": 0.9
    }
  ]
}

Only return the JSON, no other text.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "entry_point_classifications",
            strict: true,
            schema: {
              type: "object",
              properties: {
                classifications: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      file: { type: "string" },
                      function: { type: "string" },
                      isUserFacing: { type: "boolean" },
                      type: {
                        type: "string",
                        enum: ["cli-command", "api-endpoint", "main", "event-handler", "export", "internal", "test"],
                      },
                      description: { type: "string" },
                      userAction: { type: ["string", "null"] },
                      confidence: { type: "number" },
                    },
                    required: ["file", "function", "isUserFacing", "type", "description", "userAction", "confidence"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["classifications"],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter error:", error);
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from LLM" },
        { status: 500 }
      );
    }

    // Parse JSON from response (handle markdown code blocks as fallback if structured output isn't respected)
    let jsonStr = content;
    if (content.includes("```")) {
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonStr = match[1];
      }
    }
    const parsed = JSON.parse(jsonStr.trim());
    const validationResult = ClassifyResponseSchema.safeParse(parsed);

    if (!validationResult.success) {
      console.error("LLM response validation failed:", validationResult.error);
      return NextResponse.json(
        { error: `Invalid LLM response format: ${validationResult.error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(validationResult.data);
  } catch (error) {
    console.error("Classification error:", error);
    return NextResponse.json(
      { error: `Classification failed: ${error}` },
      { status: 500 }
    );
  }
}
