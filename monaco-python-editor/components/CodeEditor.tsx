"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Editor, { DiffEditor } from "@monaco-editor/react";

interface CodeEditorProps {
  onRun: (code: string, filename: string) => void;
  onTabSwitch: (filename: string) => void;
}

const LOCAL_FILES_KEY = "code-editor-files";
const LOCAL_ACTIVE_KEY = "code-editor-active-file";

export default function CodeEditor({ onRun, onTabSwitch }: CodeEditorProps) {
  const [files, setFiles] = useState<Record<string, string>>({
    "main.py": `# main.py\nprint("Hello from main.py")`,
  });
  const [originalFiles, setOriginalFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState("main.py");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [showDiff, setShowDiff] = useState(false);

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
      setOriginalFiles((prev) => ({ ...prev, [file.name]: content }));
      setActiveFile(file.name);
      onTabSwitch(file.name);
    };
    reader.readAsText(file);
  };

  const handleRun = async () => {
    try {
      setOutput("");
      const code = files[activeFile];
      const lang = getLanguage(activeFile);

      if (lang === "python") {
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();
        setOutput(data.output);
        setStatus("success");
      } else if (lang === "javascript") {
        let logs: string[] = [];
        const originalLog = console.log;

        console.log = (...args) => logs.push(args.join(" "));
        eval(code);
        console.log = originalLog;

        setOutput(logs.join("\n"));
        setStatus("success");
      } else {
        setOutput("Unsupported file type.");
        setStatus("error");
      }
    } catch (err: any) {
      setOutput(err.message);
      setStatus("error");
    }
  };

  useEffect(() => {
    const savedFiles = localStorage.getItem(LOCAL_FILES_KEY);
    const savedActive = localStorage.getItem(LOCAL_ACTIVE_KEY);

    if (savedFiles) setFiles(JSON.parse(savedFiles));
    if (savedActive) setActiveFile(savedActive);
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_FILES_KEY, JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem(LOCAL_ACTIVE_KEY, activeFile);
  }, [activeFile]);

  return (
    <div className="flex flex-col gap-4">
      {/* File Tabs and Reset Workspace */}
      <div className="flex items-center justify-between border-b pb-1">
        <div className="flex gap-1 flex-wrap items-center">
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
                  onTabSwitch(file);
                  setOutput("");
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
                    const fallback = remaining[0];
                    setActiveFile(fallback);
                    onTabSwitch(fallback);
                    setOutput("");
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
                onTabSwitch(name);
                setOutput("");
              } else if (name && !name.endsWith(".py") && !name.endsWith(".js")) {
                alert("Please use .py or .js extension.");
              }
            }}
            className="px-3 text-lg font-bold bg-gray-300 text-black rounded"
            title="New File"
          >
            +
          </button>
        </div>

        {/* Upload + Reset */}
        <div className="flex gap-2 items-center">
          <label className="bg-purple-600 text-white px-3 py-1 text-sm rounded cursor-pointer">
            Upload
            <input
              type="file"
              accept=".py,.js"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (confirm("Are you sure you want to reset your workspace?")) {
                localStorage.removeItem(LOCAL_FILES_KEY);
                localStorage.removeItem(LOCAL_ACTIVE_KEY);
                window.location.reload();
              }
            }}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded"
          >
            Reset Workspace
          </button>
        </div>
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
  onMount={(editor, monaco) => {
    console.log("🖊️ Monaco editor mounted");

    const language = getLanguage(activeFile);

    monaco.languages.registerInlineCompletionsProvider(language, {
      async provideInlineCompletions(model, position) {
        const codeUntilCursor = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const res = await fetch("/api/suggest-inline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: codeUntilCursor, language }),
        });

        const { suggestion } = await res.json();

        return {
          items: suggestion
            ? [
                {
                  insertText: suggestion,
                  range: {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column,
                  },
                },
              ]
            : [],
          dispose: () => {},
        };
      },
      freeInlineCompletions() {},
    });
  }}
  options={{
    fontSize: 16,
    minimap: { enabled: false },
    wordWrap: "on",
    inlineSuggest: {
      enabled: true,
    },
  }}
/>

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between mt-2">
        <button
          onClick={handleRun}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Run
        </button>

        <div className="flex gap-2">
          <button
            onClick={() =>
              setShowDiff((prev) => !prev)
            }
            className="bg-yellow-500 text-black px-4 py-2 rounded"
          >
            {showDiff ? "Hide Changes" : "Show Changes"}
          </button>

          <button
            onClick={() =>
              downloadFile(activeFile, files[activeFile])
            }
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>

      {/* Diff Viewer */}
      {showDiff && originalFiles[activeFile] && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Code Changes</h3>
          <DiffEditor
            height="400px"
            theme="vs-dark"
            language={getLanguage(activeFile)}
            original={originalFiles[activeFile] || ""}
            modified={files[activeFile]}
            options={{
              readOnly: true,
              renderSideBySide: true,
            }}
          />
        </div>
      )}

      {/* Output Block */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Output</h3>
          {output && (
            <span
              className={`text-xs px-2 py-1 rounded ${
                status === "error"
                  ? "bg-red-800 text-red-200"
                  : "bg-green-800 text-green-200"
              }`}
            >
              {status === "error" ? "Error" : "Success"}
            </span>
          )}
        </div>

        <AnimatePresence>
          {output && (
            <motion.pre
              key={output}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`p-4 rounded whitespace-pre-wrap overflow-auto text-sm ${
                status === "error"
                  ? "bg-red-900 text-red-200"
                  : "bg-gray-900 text-green-400"
              }`}
            >
              {output}
            </motion.pre>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}