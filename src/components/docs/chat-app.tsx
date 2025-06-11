"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatAppProps {
  docSlug: string;
}

function ChatApp({ docSlug }: ChatAppProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    const chatMessagesResponse = await fetch(
      `/api/docs/${docSlug}/chat/history`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // body: JSON.stringify({ content: input }),
      },
    );

    if (!chatMessagesResponse.ok) {
      console.error("Failed to fetch chat messages");
      setIsLoading(false);
      return;
    }

    const {
      chatHistory,
    }: {
      chatHistory: {
        _id: string;
        statusText: string;
        messages: {
          id: string;
          message: string;
          role: "user" | "assistant";
          json: string;
          thinking_steps: string[];
          createdAt: string;
          updatedAt: string;
        }[];
        userId: string;
        title: string;
        source: string;
        phone: string;
        username: string;
        scope: string;
        createdAt: string;
        updatedAt: string;
        __v: number;
      };
    } = await chatMessagesResponse.json();

    const { messages: chatMessages } = chatHistory;

    setMessages((prev) => [
      ...prev,
      ...(chatMessages ?? []).map((msg) => ({
        id: msg.id,
        content: msg.message,
        role: msg.role,
        timestamp: new Date(msg.createdAt),
      })),
    ]);
  };
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Get AI response

    // In a real implementation, you would call your API here

    const response = await fetch(`/api/docs/${docSlug}/chat/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input }),
    });

    if (!response.ok) {
      console.error("Failed to send message");
      setIsLoading(false);
      return;
    }
    const data: {
      message: string;
      role: "user" | "assistant";
      timestamp: number;
      chatId: string;
    } = await response.json();

    const modifiedMessage: Message = {
      id: Date.now().toString(),
      content: data.message,
      role: data.role,
      timestamp: new Date(data.timestamp),
    };

    // const data = await response.json();
    setMessages((prev) => [...prev, modifiedMessage]);
    setIsLoading(false);
  };

  return (
    <Card className="h-full border-none w-full flex flex-col bg-zinc-900 border-zinc-800 text-white relative">
      {/* Subtle orange gradient overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(249,115,22,0.15)_0%,rgba(249,115,22,0.05)_50%,transparent_100%)] pointer-events-none" />
      
      <CardHeader className="pb-2 relative z-10">
        <CardTitle className="text-lg font-medium">Document Chat</CardTitle>
      </CardHeader>

      <CardContent className="flex-grow overflow-hidden p-0 relative z-10">
        <ScrollArea className="h-[calc(100vh-13rem)] px-4">
          <div className="space-y-4 pt-2 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} max-w-lg min-w-lg`}
              >
                <div
                  className={`flex max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 mr-2 bg-amber-500 flex items-center justify-center text-white">
                      <span className="text-xs font-bold">AI</span>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      message.role === "user"
                        ? "bg-amber-500 text-white"
                        : "bg-zinc-800 text-gray-100"
                    }`}
                  >
                    <p className="text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start max-w-lg min-w-lg">
                <div className="flex max-w-[80%] flex-row">
                  <Avatar className="h-8 w-8 mr-2 bg-amber-500 flex items-center justify-center text-white">
                    <span className="text-xs font-bold">AI</span>
                  </Avatar>
                  <div className="rounded-lg px-3 py-2 bg-zinc-800 text-gray-100">
                    <p className="text-sm flex mt-0.5 justify-center items-center">
                      <span className="typing-dots">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="pt-2 border-t border-zinc-800 relative z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex w-full gap-2"
        >
          <Input
            placeholder="Ask about this document..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow bg-zinc-800 border-zinc-700 text-white"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardFooter>

      <style jsx global>{`
        .typing-dots {
          display: flex;
          align-items: center;
          column-gap: 4px;
        }
        
        .dot {
          width: 5px;
          height: 5px;
          background: white;
          border-radius: 50%;
          animation: typing-dot 1.5s infinite ease-in-out;
        }
        
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes typing-dot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.6;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
      `}</style>
    </Card>
  );
}

export default ChatApp;
