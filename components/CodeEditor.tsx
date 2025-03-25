"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";

interface CodeEditorProps {
  language: string;
  onRun: (code: string) => void;
  onLanguageChange: (lang: string) => void;
}

const DEFAULT_CODE: Record<string, string> = {
  python: `# Write Python code\nprint("Hello from Python!")`,
  javascript: `// Write JavaScript code\nconsole.log("Hello from JavaScript!");`,
};

export default function CodeEditor({ language, onRun, onLanguageChange }: CodeEditorProps) {
  const [code, setCode] = useState(DEFAULT_CODE[language]);

  // ⬅️ Reset editor code when language changes
  useEffect(() => {
    setCode(DEFAULT_CODE[language]);
  }, [language]);

  return (
    <div className="flex flex-col gap-4">
      {/* Language Selector */}
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="border p-2 rounded w-fit"
      >
        <option value="python">Python</option>
        <option value="javascript">JavaScript</option>
      </select>

      {/* Monaco Editor */}
      <Editor
        height="500px"
        language={language}
        value={code}
        theme="vs-dark"
        onChange={(value) => setCode(value || "")}
        options={{
          fontSize: 16,
          minimap: { enabled: false },
          wordWrap: "on",
        }}
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