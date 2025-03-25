"use client";

import { useState } from "react";
import CodeEditor from "../../components/CodeEditor";

export default function HomePage() {
  const [output, setOutput] = useState("");

  const runCode = async (code: string) => {
    const res = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();
    setOutput(data.output);
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧠 Python Monaco Editor</h1>
      <CodeEditor language="python" onRun={runCode} />
      <div className="mt-6">
        <h2 className="text-xl font-semibold">🔽 Output</h2>
        <pre className="bg-gray-900 text-green-400 p-4 rounded mt-2 whitespace-pre-wrap">
          {output}
        </pre>
      </div>
    </main>
  );
}