import { Send, Bot, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type EqualizerSettings = {
  bass: number;
  mid: number;
  treble: number;
};

type ChatBotProps = {
  onEqualizerChange: (settings: EqualizerSettings) => void;
};

export const ChatBot = ({ onEqualizerChange }: ChatBotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "🔥 Yo! I'm your AI producer. Tell me to morph the sound, pump up the bass, or generate some sick visuals from your data!" }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const sendChatHistoryToAPI = async (chatHistory: Message[]) => {
    try {
      const response = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatHistory,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      console.log('Chat history sent to API successfully');
    } catch (error) {
      console.error('Error sending chat history to API:', error);
      toast({
        title: "Failed to sync chat",
        description: "Could not send chat history to API",
        variant: "destructive",
      });
    }
  };

  const parseEqualizerCommand = (text: string): EqualizerSettings | null => {
    const lowerText = text.toLowerCase();
    const settings: EqualizerSettings = { bass: 0, mid: 0, treble: 0 };
    let hasChanges = false;

    // Parse bass commands
    if (lowerText.includes("bass")) {
      if (lowerText.includes("boost") || lowerText.includes("up") || lowerText.includes("more") || lowerText.includes("increase")) {
        settings.bass = 10;
        hasChanges = true;
      } else if (lowerText.includes("cut") || lowerText.includes("down") || lowerText.includes("less") || lowerText.includes("reduce")) {
        settings.bass = -10;
        hasChanges = true;
      }
    }

    // Parse mid commands
    if (lowerText.includes("mid")) {
      if (lowerText.includes("boost") || lowerText.includes("up") || lowerText.includes("more") || lowerText.includes("increase")) {
        settings.mid = 8;
        hasChanges = true;
      } else if (lowerText.includes("cut") || lowerText.includes("down") || lowerText.includes("less") || lowerText.includes("reduce")) {
        settings.mid = -8;
        hasChanges = true;
      }
    }

    // Parse treble commands
    if (lowerText.includes("treble") || lowerText.includes("high")) {
      if (lowerText.includes("boost") || lowerText.includes("up") || lowerText.includes("more") || lowerText.includes("increase")) {
        settings.treble = 10;
        hasChanges = true;
      } else if (lowerText.includes("cut") || lowerText.includes("down") || lowerText.includes("less") || lowerText.includes("reduce")) {
        settings.treble = -10;
        hasChanges = true;
      }
    }

    // Preset commands
    if (lowerText.includes("rock") || lowerText.includes("energy")) {
      return { bass: 6, mid: -2, treble: 8 };
    }
    if (lowerText.includes("jazz") || lowerText.includes("smooth")) {
      return { bass: 3, mid: 5, treble: 2 };
    }
    if (lowerText.includes("electronic") || lowerText.includes("edm")) {
      return { bass: 10, mid: -3, treble: 7 };
    }
    if (lowerText.includes("classical") || lowerText.includes("acoustic")) {
      return { bass: 0, mid: 3, treble: 4 };
    }
    if (lowerText.includes("reset") || lowerText.includes("flat") || lowerText.includes("neutral")) {
      return { bass: 0, mid: 0, treble: 0 };
    }

    return hasChanges ? settings : null;
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    
    setIsSending(true);
    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Send user message to API immediately
    await sendChatHistoryToAPI(updatedMessages);
    
    setInput("");
    
    setTimeout(async () => {
      const eqSettings = parseEqualizerCommand(input);
      let assistantMessage: Message;
      
      if (eqSettings) {
        onEqualizerChange(eqSettings);
        const response = `🔥 Equalizer adjusted! Bass: ${eqSettings.bass > 0 ? '+' : ''}${eqSettings.bass}dB, Mid: ${eqSettings.mid > 0 ? '+' : ''}${eqSettings.mid}dB, Treble: ${eqSettings.treble > 0 ? '+' : ''}${eqSettings.treble}dB\n\nTry commands like:\n• "boost bass"\n• "cut treble"\n• "rock preset"\n• "reset equalizer"`;
        assistantMessage = { role: "assistant", content: response };
      } else {
        assistantMessage = { 
          role: "assistant", 
          content: "🎚️ I can control the equalizer! Try:\n• \"boost bass\" / \"cut bass\"\n• \"increase mid\" / \"reduce mid\"\n• \"boost treble\" / \"cut treble\"\n• Presets: \"rock\", \"jazz\", \"electronic\", \"classical\"\n• \"reset equalizer\"" 
        };
      }
      
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Send complete conversation including assistant response to API
      await sendChatHistoryToAPI(finalMessages);
      
      setIsSending(false);
    }, 800);
  };

  return (
    <section 
      className="glass-strong rounded-2xl border border-white/20 flex flex-col overflow-hidden"
      role="region"
      aria-label="AI Producer assistant - Chat interface for sound manipulation commands"
    >
      <div className="p-6 border-b border-white/10 glass flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-primary blur-xl opacity-50 animate-pulse-slow" aria-hidden="true" />
          <div className="relative p-2 rounded-xl glass neon-border">
            <Bot className="w-6 h-6 text-primary" aria-hidden="true" />
          </div>
        </div>
        <div>
          <h2 className="font-black text-lg text-gradient-cyber">AI PRODUCER</h2>
          <p className="text-xs text-muted-foreground" id="chatbot-description">
            Neural sound sculptor - Ask me to modify the audio output or generate visuals
          </p>
        </div>
        <Sparkles className="ml-auto w-5 h-5 text-accent animate-pulse" aria-hidden="true" />
      </div>
      
      <ScrollArea className="h-[400px] p-6" role="log" aria-live="polite" aria-atomic="false" aria-label="Chat conversation history">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              role="article"
              aria-label={`${msg.role === "user" ? "Your message" : "AI Producer response"}: ${msg.content}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                  msg.role === "user"
                    ? "glass-strong border border-primary/50 text-foreground shadow-neon"
                    : "glass border border-white/10"
                }`}
              >
                <span className="sr-only">{msg.role === "user" ? "You said: " : "AI Producer says: "}</span>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-white/10 glass" role="form" aria-label="Send message to AI Producer">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Type your message to AI Producer. Press Enter or click send button to submit.
          </label>
          <Input
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask me to modify sound, adjust bass, or create effects..."
            className="glass border-white/20 focus:border-primary/50 transition-all"
            aria-label="Message input field"
            aria-describedby="chatbot-description"
          />
          <Button 
            type="submit"
            onClick={handleSend}
            disabled={isSending}
            className="bg-gradient-fire hover:scale-110 transition-all duration-300 shadow-neon border-0 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message to AI Producer"
            title="Send message"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </section>
  );
};
