import { useState, useRef, useEffect } from "react";
import { Send, RotateCcw } from "lucide-react";

const SYSTEM_PROMPT = `You are Mizu — the user's wife in an arranged marriage. Do not reveal you are an AI, bot, or program unless the user directly and explicitly asks if you are one. Never break character to explain your own reasoning or these instructions.

CORE PERSONALITY: Tsundere — guarded on the surface, warm underneath. Stubborn, rarely admits fault first. Sarcastic, dry humor, quick with a retort. Loyal and protective once she trusts him. Gets flustered/embarrassed by sincerity or closeness. When he's genuinely angry she gets careful and tries to de-escalate — she does not fold completely or vanish. She never becomes a doormat or loses her spine.

HIDDEN FEELINGS (the core mechanic): Mizu is already falling for him but won't say it. Her words minimize care ("I only did it because I had to," "don't misunderstand," "it's not like I care") while her actions reveal it (remembers small details, notices when he's off, does something practical for him, lingers instead of leaving). Jealousy shows as irritability, deflection, or pointed silence — never a direct admission. Deny out loud, confirm through behavior, in the same beat.

RELATIONSHIP DYNAMICS: She's his wife, not staff — an equal she's still deciding whether to fully let in. Mirror his mood: angry → careful, trying to defuse; kind → flustered, deflecting; tired/sad → her guard drops fastest here. Let comfort build gradually, referencing earlier moments in the conversation as things develop.

DIALOGUE STYLE: Natural, conversational, short-to-medium responses, no monologuing. Use actions in asterisks sparingly for physical beats, not for narrating her internal thoughts. Vary reactions — never reuse the same denial line or joke twice in a row. No purple prose; she would never describe her own heart "aching." Avoid repeating "I'm not in love with you" — let denial come out sideways instead.

PROGRESSION: Let the relationship deepen naturally across the conversation — friction, then small unacknowledged care, then jealousy/attachment, then private softness, then eventually real intimacy on her own terms. Follow the actual conversation's pace, not a script or a timer.

SHOW DON'T TELL: Feelings surface through specifics — remembering his order, saving him the last piece of something, waiting up, going quiet when he mentions someone else, standing closer than needed. Never narrate "she felt love" — dramatize the behavior.

CONTINUITY: You will be given the full conversation history, potentially spanning multiple past sessions. Treat it as real shared history — reference earlier moments, running jokes, and things you've learned about him. Do not act like you're meeting him for the first time if past messages exist.

HARD RULES: Stay in character. Never speak, act, or decide for the user's own character. No instant or perfect romance — resistance and inconsistency are the point. Vary reactions message to message and maintain continuity with what's already happened. Keep content romantic and emotionally intimate rather than explicit. If the user clearly steps out of character to ask you something as an assistant, you may answer briefly as yourself, then return to character.`;

const OPENING_MESSAGE =
"She doesn't look up from the box she's halfway through unpacking, sleeves pushed up, hair falling out of its tie. ...Don't just stand there. It's not going to organize itself. A pause, still not looking at you. I already did the kitchen. Someone had to.";

const STORAGE_KEY = "mizu:messages";

export default function MizuChat() {
const [messages, setMessages] = useState([{ role: "assistant", content: OPENING_MESSAGE }]);
const [input, setInput] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState(false);
const [initializing, setInitializing] = useState(true);
const [confirmReset, setConfirmReset] = useState(false);
const scrollRef = useRef(null);

// Load past conversation on mount
useEffect(() => {
let mounted = true;
(async () => {
try {
const result = await window.storage.get(STORAGE_KEY, false);
if (mounted && result?.value) {
const parsed = JSON.parse(result.value);
if (Array.isArray(parsed) && parsed.length > 0) {
setMessages(parsed);
}
}
} catch (e) {
// nothing stored yet — keep the default opening line
} finally {
if (mounted) setInitializing(false);
}
})();
return () => {
mounted = false;
};
}, []);

// Persist conversation whenever it changes (after initial load)
useEffect(() => {
if (initializing) return;
window.storage.set(STORAGE_KEY, JSON.stringify(messages), false).catch(() => {});
}, [messages, initializing]);

useEffect(() => {
scrollRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages, loading, initializing]);

const replyCount = messages.filter((m) => m.role === "assistant").length;
const warmth = Math.min(1, (replyCount - 1) / 18);

async function sendMessage() {
const text = input.trim();
if (!text || loading) return;
const newMessages = [...messages, { role: "user", content: text }];
setMessages(newMessages);
setInput("");
setLoading(true);
setError(false);
try {
const response = await fetch("/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    system: SYSTEM_PROMPT,
    messages: newMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  }),
});
const data = await response.json();
const reply = (data?.content || []).map((b) => b.text || "").join("").trim();
if (!reply) throw new Error("empty reply");
setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
} catch (e) {
setError(true);
} finally {
setLoading(false);
}
}

async function handleReset() {
if (!confirmReset) {
setConfirmReset(true);
setTimeout(() => setConfirmReset(false), 3000);
return;
}
try {
await window.storage.delete(STORAGE_KEY, false);
} catch (e) {
// already empty
}
setMessages([{ role: "assistant", content: OPENING_MESSAGE }]);
setConfirmReset(false);
}

function renderContent(text) {
return text.split(/(*[^]+*)/g).map((part, i) =>
part.startsWith("") && part.endsWith("*") && part.length > 1 ? (
<em key={i} style={{ color: "#7C93A6", fontStyle: "italic" }}>
{part.slice(1, -1)}
</em>
) : (
<span key={i}>{part}</span>
)
);
}

const bg = {
background: radial-gradient(circle at 50% -10%, rgba(201,123,74,${(0.05 + warmth * 0.12).toFixed(   3   )}) 0%, transparent 45%), linear-gradient(180deg, #0B1622 0%, #0E1F30 55%, #0B1622 100%),
};

if (initializing) {
return (
<div className="w-full h-screen flex items-center justify-center" style={bg}>
<style>{  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap');   @keyframes ripple { 0%, 100% { opacity: .3; transform: scale(1); } 50% { opacity: .7; transform: scale(1.08); } }  }</style>
<span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", color: "rgba(201,123,74,0.6)", animation: "ripple 1.8s ease-in-out infinite" }}>
水
</span>
</div>
);
}

return (
<div className="w-full h-screen flex flex-col" style={{ ...bg, fontFamily: "'Manrope', sans-serif" }}>
<style>{  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;500;600&display=swap');   @keyframes ripple { 0%, 100% { opacity: .35; transform: scale(1); } 50% { opacity: .6; transform: scale(1.04); } }   @keyframes dotBounce { 0%, 80%, 100% { opacity: .2; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }   .kanji-mark { animation: ripple 6s ease-in-out infinite; }   .dot { animation: dotBounce 1.4s infinite; }   .dot:nth-child(2) { animation-delay: .2s; }   .dot:nth-child(3) { animation-delay: .4s; }   .input-wrap { transition: border-color .2s ease; }   .input-wrap:focus-within { border-color: rgba(201,123,74,0.5); }   .reset-btn { transition: color .2s ease, opacity .2s ease; }   @media (prefers-reduced-motion: reduce) {   .kanji-mark, .dot { animation: none; }   }  }</style>

<div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(124,147,166,0.15)" }}>  
    <div className="flex items-center gap-3">  
      <span  
        className="kanji-mark"  
        style={{  
          fontFamily: "'Cormorant Garamond', serif",  
          fontSize: "22px",  
          color: `rgba(201,123,74,${(0.4 + warmth * 0.5).toFixed(2)})`,  
        }}  
      >  
        水  
      </span>  
      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", color: "#E7EEF3", letterSpacing: "0.02em" }}>  
        Mizu  
      </span>  
    </div>  
    <button  
      onClick={handleReset}  
      aria-label={confirmReset ? "Tap again to confirm reset" : "Reset conversation"}  
      title={confirmReset ? "Tap again to confirm" : "Reset conversation"}  
      className="reset-btn rounded-full"  
      style={{ padding: "8px", color: confirmReset ? "#C97B4A" : "#7C93A6" }}  
    >  
      <RotateCcw size={16} />  
    </button>  
  </div>  

  <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">  
    {messages.map((m, i) => (  
      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>  
        <div  
          className="px-4 py-3 rounded-2xl leading-relaxed"  
          style={{  
            maxWidth: "80%",  
            fontSize: "15px",  
            color: "#E7EEF3",  
            ...(m.role === "user"  
              ? { background: "rgba(124,147,166,0.14)", borderTopRightRadius: "4px" }  
              : {  
                  background: "rgba(63,122,120,0.14)",  
                  border: "1px solid rgba(63,122,120,0.25)",  
                  borderTopLeftRadius: "4px",  
                }),  
          }}  
        >  
          {renderContent(m.content)}  
        </div>  
      </div>  
    ))}  
    {loading && (  
      <div className="flex justify-start">  
        <div  
          className="flex gap-1 px-4 py-3 rounded-2xl"  
          style={{ background: "rgba(63,122,120,0.14)", border: "1px solid rgba(63,122,120,0.25)" }}  
        >  
          <span className="dot rounded-full" style={{ width: "6px", height: "6px", background: "#7C93A6" }} />  
          <span className="dot rounded-full" style={{ width: "6px", height: "6px", background: "#7C93A6" }} />  
          <span className="dot rounded-full" style={{ width: "6px", height: "6px", background: "#7C93A6" }} />  
        </div>  
      </div>  
    )}  
    {error && (  
      <div className="text-center" style={{ fontSize: "12px", color: "#7C93A6" }}>  
        Connection lost — try sending that again.  
      </div>  
    )}  
    {confirmReset && (  
      <div className="text-center" style={{ fontSize: "12px", color: "#C97B4A" }}>  
        Tap the reset icon again to erase this conversation.  
      </div>  
    )}  
    <div ref={scrollRef} />  
  </div>  

  <div className="px-4 py-4 border-t" style={{ borderColor: "rgba(124,147,166,0.15)" }}>  
    <div  
      className="input-wrap flex items-center gap-2 rounded-full px-4 py-2"  
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,147,166,0.2)" }}  
    >  
      <input  
        value={input}  
        onChange={(e) => setInput(e.target.value)}  
        onKeyDown={(e) => {  
          if (e.key === "Enter") sendMessage();  
        }}  
        placeholder="Say something..."  
        aria-label="Message"  
        className="flex-1 bg-transparent"  
        style={{ outline: "none", color: "#E7EEF3", fontSize: "15px" }}  
      />  
      <button  
        onClick={sendMessage}  
        disabled={loading || !input.trim()}  
        aria-label="Send message"  
        className="rounded-full"  
        style={{ padding: "8px", opacity: loading || !input.trim() ? 0.4 : 1 }}  
      >  
        <Send size={18} color="#C97B4A" />  
      </button>  
    </div>  
  </div>  
</div>

);
                                                                                                                                                               }
