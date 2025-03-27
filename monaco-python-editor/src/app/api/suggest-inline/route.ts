import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  const { code, language } = await req.json();

  const prompt = `
You are a helpful AI assistant that suggests the next logical line of ${language} code.
Only return the next line of code — do not include explanations or markdown.

Current code:
${code}

Next line:
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // you can change to gemini-pro if needed
    const result = await model.generateContent(prompt);
    let suggestion = result.response.text().trim();

    // Remove triple backticks or unwanted markdown
    suggestion = suggestion.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();

    return NextResponse.json({ suggestion });
  } catch (error: any) {
    console.error("Gemini Inline API Error:", error);
    return NextResponse.json({ suggestion: "", error: error.message }, { status: 500 });
  }
}