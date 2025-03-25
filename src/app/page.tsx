"use client";

import { useState } from "react";
import CodeEditor from "../../components/CodeEditor";


export default function HomePage() {
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");

  const runCode = async (code: string) => {
    if (language === "python") {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      setOutput(data.output);
    } else if (language === "javascript") {
      try {
        // Capture console.log output
        let capturedLogs: string[] = [];
        const originalLog = console.log;

        console.log = (...args: any[]) => {
          capturedLogs.push(args.join(" "));
        };

        const result = eval(code);

        console.log = originalLog; // Restore original log

        // If result is not undefined, add it to output
        if (result !== undefined) {
          capturedLogs.push(String(result));
        }

        setOutput(capturedLogs.join("\n"));
      } catch (err: any) {
        setOutput(err.message);
      } finally {
        console.log = console.log; // Make sure it's always restored
      }
    }
  };
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Monaco Code Editor</h1>

      <CodeEditor
        language={language}
        onRun={runCode}
        onLanguageChange={setLanguage}
      />

      <div className="mt-6">
        <h2 className="text-xl font-semibold">🔽 Output</h2>
        <pre className="bg-gray-900 text-green-400 p-4 rounded mt-2 whitespace-pre-wrap">
          {output}
        </pre>
      </div>
    </main>
  );
}