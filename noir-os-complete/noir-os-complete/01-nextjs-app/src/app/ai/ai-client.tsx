"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Wand2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const PROMPTS = [
  "Write 3 Instagram captions for a sunrise summit reel",
  "Generate on-brand hashtags for a winter base-layer launch",
  "What should we publish this week, based on my pipeline?",
  "Draft a content brief for the Q3 thought-leadership campaign",
  "Rewrite this to match our brand voice: “Our advanced tech guarantees you stay dry.”",
];

export function AIWorkspaceClient({ workspaceName }: { workspaceName: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, streaming]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        setMessages((m) => [...m, { role: "assistant", content: errText || "Something went wrong. Please try again." }]);
        setStreaming(false);
        return;
      }

      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + chunk };
          return copy;
        });
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Couldn't reach the assistant. Check your connection and try again." }]);
    } finally {
      setStreaming(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="afa-orb mb-4 h-14 w-14"><Sparkles size={26} /></div>
            <h2 className="text-[20px] font-semibold tracking-tight">Afuera AI</h2>
            <p className="mt-1.5 max-w-sm text-[13.5px] text-[var(--afa-ink-2)]">
              Brand-voice aware, and it can see {workspaceName}&apos;s live pipeline and campaigns. Ask it to create, rewrite, or plan.
            </p>
            <div className="mt-6 grid w-full max-w-lg gap-2">
              {PROMPTS.map((p) => (
                <button key={p} className="afa-prompt" onClick={() => send(p)}>{p}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="max-w-[85%] self-end">
                  <div className="afa-bubble-u">{m.content}</div>
                </div>
              ) : (
                <div key={i} className="flex max-w-[92%] gap-2.5 self-start">
                  <div className="afa-orb mt-0.5 h-7 w-7"><Sparkles size={14} /></div>
                  <div className="afa-bubble-a">
                    {m.content}
                    {streaming && i === messages.length - 1 && <span className="afa-cursor" />}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--afa-line)] px-5 py-4">
        <div className="afa-ai-input">
          <textarea
            ref={taRef}
            rows={1}
            value={input}
            placeholder="Ask Afuera to create, rewrite, or plan…"
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 160) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button className="afa-ai-send" disabled={!input.trim() || streaming} onClick={() => send()} aria-label="Send">
            <Send size={16} />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-1.5 px-1 text-[11px] text-[var(--afa-ink-3)]">
          <Wand2 size={11} /> Responses follow your Brand Kit and reference your live workspace data.
        </div>
      </div>
    </div>
  );
}
