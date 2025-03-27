"use client";

import { useState } from "react";
import CodeEditor from "../../components/CodeEditor";

export default function HomePage() {
  const [activeFile, setActiveFile] = useState("main.py");

  const runCode = async (code: string, filename: string) => {
    
  };

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">CaptenAI Cødex </h1>

      <CodeEditor
        onRun={(code, filename) => runCode(code, filename)}
        onTabSwitch={(file) => setActiveFile(file)}
      />
    </main>
  );
}