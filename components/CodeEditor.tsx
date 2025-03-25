"use client";

import Editor from "@monaco-editor/react";
import { useState } from "react";

interface CodeEditorProps {
  language?: string;
  onRun: (code: string) => void;
}

export default function CodeEditor({ language = "python", onRun }: CodeEditorProps) {
  const [code, setCode] = useState(`# Write your Python code here\nprint("Hello from Monaco!")`);

  return (
    <div className="flex flex-col gap-4">
      <Editor
        height="300px"
        defaultLanguage={language}
        defaultValue={code}
        theme="vs-dark"
        onChange={(value) => setCode(value || "")}
      />
      <button
        onClick={() => onRun(code)}
        className="bg-blue-600 text-white px-4 py-2 rounded w-fit"
      >
        Run Code
      </button>
    </div>
  );
}