"use client";

import Editor from "@monaco-editor/react";
import { useState } from "react";

interface CodeEditorProps {
  onRun: (code: string, filename: string) => void;
  onTabSwitch: (filename: string) => void; 
}

export default function CodeEditor({ onRun, onTabSwitch }: CodeEditorProps) {
  const [files, setFiles] = useState<Record<string, string>>({
    "main.py": `# main.py\nprint("Hello from main.py")`,
  });
  const [activeFile, setActiveFile] = useState("main.py");

  const getLanguage = (filename: string) =>
    filename.endsWith(".js") ? "javascript" : "python";

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFiles((prev) => ({
        ...prev,
        [file.name]: content,
      }));
      setActiveFile(file.name);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* File Tabs */}
      <div className="flex gap-1 items-center flex-wrap border-b">
        {Object.keys(files).map((file) => (
          <div
            key={file}
            className={`flex items-center px-3 py-1 text-sm border-t border-l border-r rounded-t ${
              file === activeFile
                ? "bg-gray-800 text-white"
                : "bg-gray-200 text-black"
            }`}
          >
            <span
            onClick={() => {
              setActiveFile(file);
              onTabSwitch(file); // 👈 Trigger tab switch logic in parent
            }}
            className="cursor-pointer pr-2"
          >
            {file}
          </span>
            <button
              onClick={() => {
                if (Object.keys(files).length === 1) {
                  alert("You must have at least one file open.");
                  return;
                }

                const updated = { ...files };
                delete updated[file];

                setFiles(updated);

                if (file === activeFile) {
                  const remaining = Object.keys(updated);
                  setActiveFile(remaining[0]);
                }
              }}
              className="ml-auto text-xs text-gray-400 hover:text-red-500"
              title={`Close ${file}`}
            >
              ×
            </button>
          </div>
        ))}

        {/* New File */}
        <button
          onClick={() => {
            const name = prompt("Enter new file name (e.g., utils.py)");
            if (
              name &&
              (name.endsWith(".py") || name.endsWith(".js")) &&
              !files[name]
            ) {
              setFiles({ ...files, [name]: "" });
              setActiveFile(name);
            } else if (name && !name.endsWith(".py") && !name.endsWith(".js")) {
              alert("Please use .py or .js extension.");
            }
          }}
          className="px-2 py-1 text-sm bg-green-600 text-white rounded"
        >
          New File
        </button>

        {/* Upload File */}
        <label className="bg-purple-600 text-white px-2 py-1 text-sm rounded cursor-pointer">
          Upload
          <input
            type="file"
            accept=".py,.js"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Monaco Editor */}
      <Editor
        height="500px"
        language={getLanguage(activeFile)}
        value={files[activeFile]}
        theme="vs-dark"
        onChange={(value) =>
          setFiles((prev) => ({
            ...prev,
            [activeFile]: value || "",
          }))
        }
        options={{
          fontSize: 16,
          minimap: { enabled: false },
          wordWrap: "on",
        }}
      />

      {/* Action Buttons */}
      <div className="flex gap-3 mt-2">
        <button
          onClick={() => onRun(files[activeFile], activeFile)} // ✅ Pass filename too
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Run
        </button>

        <button
          onClick={() => downloadFile(activeFile, files[activeFile])}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
}