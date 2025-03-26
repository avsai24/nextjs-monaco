"use client";

import { useState } from "react";
import CodeEditor from "../../components/CodeEditor";

export default function HomePage() {
  const [output, setOutput] = useState("");
  const [activeFile, setActiveFile] = useState("main.py");

  const runCode = async (code: string, filename: string) => {
    if (filename.endsWith(".py")) {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      setOutput(data.output);
    } else if (filename.endsWith(".js")) {
      try {
        let logs: string[] = [];
        const originalLog = console.log;

        console.log = (...args) => logs.push(args.join(" "));
        eval(code);
        console.log = originalLog;

        setOutput(logs.join("\n"));
      } catch (err: any) {
        setOutput(err.message);
      } finally {
        console.log = console.log;
      }
    } else {
      setOutput("Unsupported file type.");
    }
  };

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Code Playground</h1>

      <CodeEditor
        onRun={(code, filename) => runCode(code, filename)}
        onTabSwitch={(file) => {
          setActiveFile(file);
          setOutput(""); // ✅ Clear output when file changes
        }}
      />

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Output</h2>
        <pre className="bg-black text-green-400 p-4 rounded whitespace-pre-wrap">
          {output}
        </pre>
      </div>
    </main>
  );
}