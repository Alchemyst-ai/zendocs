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
import { Send } from "lucide-react";
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
    <Card className="h-full flex flex-col bg-zinc-900 border-zinc-800 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Document Chat</CardTitle>
      </CardHeader>

      <CardContent className="flex-grow overflow-hidden p-0">
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
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="pt-2 border-t border-zinc-800">
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
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

export default ChatApp;
