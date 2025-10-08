"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
export default function Page() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!prompt.trim()) return;
    const userMessage = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context: messages }),
      });
      const data = await res.json();
      const botMessage = {
        role: "bot",
        content: data.reply || "No response",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Error: Unable to connect to server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const isEmpty = messages.length === 0;

  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-black text-white overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Chat Section */}
      {!isEmpty && (
        <div className="flex-1 overflow-y-auto w-2/3 max-w-3xl p-6 space-y-4 mt-6 mb-28 rounded-3xl backdrop-blur-2xl bg-gradient-to-b from-white/5 to-transparent shadow-[0_0_40px_rgba(255,255,255,0.03)]">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-md ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-blue-600 to-blue-500/80 text-white ml-auto backdrop-blur-md"
                  : "bg-white/10 text-white/90 mr-auto backdrop-blur-md"
              }`}
            >
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/10 text-white/80 text-sm px-4 py-3 rounded-2xl w-fit backdrop-blur-md"
            >
              Typing...
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input Section */}
      <div
        className={`fixed transition-all duration-500 ${
          isEmpty
            ? "inset-0 flex items-center justify-center"
            : "bottom-6 w-full flex justify-center"
        }`}
      >
        <div className="w-2/3 max-w-3xl flex items-center gap-3 backdrop-blur-xl bg-white/10 rounded-2xl p-3 shadow-[0_0_25px_rgba(255,255,255,0.05)] hover:bg-white/15 transition-all">
          <input
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/60"
            placeholder="Send a message..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-gradient-to-br from-blue-600 to-indigo-600 hover:opacity-90 transition-all p-2.5 rounded-xl shadow-lg"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
