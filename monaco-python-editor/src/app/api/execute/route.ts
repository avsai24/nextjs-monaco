import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { exec } from "child_process";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    const filePath = path.join(process.cwd(), "temp_code.py");
    await writeFile(filePath, code);

    return new Promise((resolve) => {
      exec(`python3 ${filePath}`, async (err, stdout, stderr) => {
        await unlink(filePath); // Clean up temp file

        if (err || stderr) {
          resolve(NextResponse.json({ output: stderr || err.message }));
        } else {
          resolve(NextResponse.json({ output: stdout }));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ output: error.message });
  }
}