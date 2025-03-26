"use client";

import { useState } from "react";
import CodeEditor from "../../components/CodeEditor";

export default function HomePage() {
  const [activeFile, setActiveFile] = useState("main.py");

  const runCode = async (code: string, filename: string) => {
    // This function is passed to CodeEditor and invoked there
    // The actual output rendering is inside CodeEditor now
    // So we no longer need `setOutput()` or <pre> block here

    // You can still keep this logic if execution remains here,
    // or move it fully to CodeEditor for better encapsulation.
  };

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Code Playground</h1>

      <CodeEditor
        onRun={(code, filename) => runCode(code, filename)}
        onTabSwitch={(file) => setActiveFile(file)}
      />
    </main>
  );
}