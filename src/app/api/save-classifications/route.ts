import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

interface ClassificationsData {
  classifications: unknown[];
  analyzedAt: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  try {
    const body = await request.json() as ClassificationsData;

    // Save to public/data/clarity/classifications.json
    const dir = join(process.cwd(), "public", "data", "clarity");
    await mkdir(dir, { recursive: true });

    const filePath = join(dir, "classifications.json");
    await writeFile(filePath, JSON.stringify(body, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save classifications error:", error);
    return NextResponse.json(
      { error: `Failed to save: ${error}` },
      { status: 500 }
    );
  }
}
