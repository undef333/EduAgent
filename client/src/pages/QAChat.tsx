import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

export default function QAChat() {
  const { user } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const { data: conversationList, refetch: refetchConversations } = trpc.qa.conversations.useQuery();

  const { data: conversationMessages } = trpc.qa.getMessages.useQuery(
    { conversationId: activeConversationId! },
    { enabled: !!activeConversationId }
  );

  const createConversation = trpc.qa.createConversation.useMutation({
    onSuccess: (data) => {
      if (data.id) {
        setActiveConversationId(data.id);
        setMessages([]);
        refetchConversations();
      }
    },
  });

  const chatMutation = trpc.qa.chat.useMutation({
    onSuccess: (data) => {
      const confidenceBadge = data.confidence === "high" ? " [高置信度]" : data.confidence === "low" ? " [低置信度]" : " [中置信度]";
      const sourcesInfo = data.sources && data.sources.length > 0
        ? `\n\n---\n**参考来源：** ${data.sources.join("、")}`
        : "";
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.content + sourcesInfo },
      ]);
    },
  });

  // Sync messages when conversation changes
  useEffect(() => {
    if (conversationMessages) {
      setMessages(
        conversationMessages
          .filter(m => m.role !== "system")
          .map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
      );
    }
  }, [conversationMessages]);

  const handleSendMessage = (content: string) => {
    if (!activeConversationId) {
      // Create new conversation first
      createConversation.mutate({ title: content.slice(0, 50) }, {
        onSuccess: (data) => {
          if (data.id) {
            setMessages(prev => [...prev, { role: "user", content }]);
            chatMutation.mutate({ conversationId: data.id, message: content });
          }
        },
      });
    } else {
      setMessages(prev => [...prev, { role: "user", content }]);
      chatMutation.mutate({ conversationId: activeConversationId, message: content });
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  const suggestedPrompts = useMemo(() => [
    "什么是机器学习中的过拟合？如何避免？",
    "请解释 TCP 三次握手的过程",
    "Python 中列表和元组的区别是什么？",
    "数据库索引的原理和类型有哪些？",
  ], []);

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Conversation List */}
      <Card className="w-64 shrink-0 hidden md:flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">对话列表</CardTitle>
            <Button size="sm" variant="ghost" onClick={handleNewConversation}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full px-3 pb-3">
            <div className="space-y-1">
              {conversationList?.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeConversationId === conv.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-accent text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{conv.title || "新对话"}</span>
                  </div>
                </button>
              ))}
              {(!conversationList || conversationList.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  暂无对话记录
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <div className="flex-1">
        <AIChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={chatMutation.isPending || createConversation.isPending}
          placeholder="输入你的问题，支持课程知识问答..."
          height="100%"
          emptyStateMessage="开始一段智能问答对话"
          suggestedPrompts={suggestedPrompts}
        />
      </div>
    </div>
  );
}
