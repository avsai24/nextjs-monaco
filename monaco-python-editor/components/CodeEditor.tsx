"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
  const [activeFile, setActiveFile] = useState("main.py");
  const [output, setOutput] = useState(""); // ✅ Local output for animation
  const [status, setStatus] = useState<"success" | "error" | null>(null);

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

  // Load from localStorage
  useEffect(() => {
    const savedFiles = localStorage.getItem(LOCAL_FILES_KEY);
    const savedActive = localStorage.getItem(LOCAL_ACTIVE_KEY);

    if (savedFiles) setFiles(JSON.parse(savedFiles));
    if (savedActive) setActiveFile(savedActive);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_FILES_KEY, JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem(LOCAL_ACTIVE_KEY, activeFile);
  }, [activeFile]);

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
                onTabSwitch(file);
                setOutput(""); // Clear output on switch
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

        {/* Reset Button */}
        <button
          onClick={() => {
            if (confirm("Are you sure you want to reset your workspace?")) {
              localStorage.removeItem(LOCAL_FILES_KEY);
              localStorage.removeItem(LOCAL_ACTIVE_KEY);
              window.location.reload();
            }
          }}
          className="px-2 py-1 text-sm bg-red-600 text-white rounded"
        >
          Reset Workspace
        </button>
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
          onClick={handleRun}
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

      {/* Output */}
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