import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Loader2, Send, User, Sparkles, Play, Square } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

type ChatMsg = { role: "user" | "assistant"; content: string };

const stageLabels: Record<string, { label: string; color: string }> = {
  intro: { label: "自我介绍", color: "bg-blue-100 text-blue-700" },
  tech: { label: "技术面试", color: "bg-green-100 text-green-700" },
  project: { label: "项目经验", color: "bg-orange-100 text-orange-700" },
  report: { label: "面试报告", color: "bg-purple-100 text-purple-700" },
};

export default function Interview() {
  const [position, setPosition] = useState("");
  const [activeTab, setActiveTab] = useState("start");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [currentStage, setCurrentStage] = useState("intro");
  const [input, setInput] = useState("");
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: sessionList, refetch } = trpc.interview.list.useQuery();
  const { data: sessionDetail } = trpc.interview.get.useQuery(
    { id: selectedSession! },
    { enabled: !!selectedSession }
  );

  const startMutation = trpc.interview.start.useMutation({
    onSuccess: (data) => {
      if (data.id) {
        setSessionId(data.id);
        setMessages([{ role: "assistant", content: data.message }]);
        setCurrentStage(data.stage);
        setActiveTab("chat");
        toast.success("面试开始！");
      }
    },
    onError: (err) => toast.error("启动失败：" + err.message),
  });

  const chatMutation = trpc.interview.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      setCurrentStage(data.stage);
      if (data.shouldAdvanceStage) {
        toast.info(`进入下一阶段：${stageLabels[data.stage]?.label || data.stage}`);
      }
    },
    onError: (err) => toast.error("发送失败：" + err.message),
  });

  const finishMutation = trpc.interview.finish.useMutation({
    onSuccess: () => {
      toast.success("面试报告已生成！");
      setActiveTab("history");
      refetch();
    },
    onError: (err) => toast.error("生成报告失败：" + err.message),
  });

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (viewport) {
        requestAnimationFrame(() => {
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
        });
      }
    }
  }, [messages]);

  const handleStart = () => {
    if (!position.trim()) {
      toast.error("请输入应聘岗位");
      return;
    }
    startMutation.mutate({ position });
  };

  const handleSend = () => {
    if (!input.trim() || !sessionId) return;
    setMessages(prev => [...prev, { role: "user", content: input }]);
    chatMutation.mutate({ sessionId, message: input });
    setInput("");
  };

  const handleFinish = () => {
    if (!sessionId) return;
    finishMutation.mutate({ sessionId });
  };

  // Parse report data for selected session
  let reportData: any = null;
  let reportRadarData: any[] = [];
  if (sessionDetail?.report) {
    try {
      reportData = JSON.parse(sessionDetail.report);
      reportRadarData = (reportData.dimensions || []).map((d: any) => ({
        dimension: d.name,
        score: d.score,
        fullMark: 100,
      }));
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">模拟面试</h1>
        <p className="text-muted-foreground mt-1">
          四阶段面试流程：自我介绍 → 技术面试 → 项目经验 → 面试报告
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="start">开始面试</TabsTrigger>
          <TabsTrigger value="chat" disabled={!sessionId}>面试进行中</TabsTrigger>
          <TabsTrigger value="history">面试记录</TabsTrigger>
        </TabsList>

        <TabsContent value="start" className="mt-4">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="text-base">开始模拟面试</CardTitle>
              <CardDescription>
                输入你想面试的岗位，AI 面试官将根据岗位要求进行模拟面试
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">应聘岗位</label>
                <Input
                  placeholder="例如：前端开发工程师、Java 后端开发、数据分析师"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>
              <Button
                onClick={handleStart}
                disabled={startMutation.isPending}
                className="w-full"
              >
                {startMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在准备面试...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    开始面试
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <Card className="h-[calc(100vh-14rem)]">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">模拟面试 - {position}</CardTitle>
                  <Badge className={stageLabels[currentStage]?.color || ""}>
                    {stageLabels[currentStage]?.label || currentStage}
                  </Badge>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleFinish}
                  disabled={finishMutation.isPending}
                >
                  {finishMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Square className="h-3.5 w-3.5 mr-1" />
                      结束面试
                    </>
                  )}
                </Button>
              </div>
              {/* Stage Progress */}
              <div className="flex gap-1 mt-2">
                {["intro", "tech", "project", "report"].map((stage, i) => (
                  <div
                    key={stage}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      ["intro", "tech", "project", "report"].indexOf(currentStage) >= i
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-6rem)] p-0">
              <div ref={scrollRef} className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="flex flex-col space-y-4 p-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="size-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="size-4 text-primary" />
                          </div>
                        )}
                        <div className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}>
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <Streamdown>{msg.content}</Streamdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          )}
                        </div>
                        {msg.role === "user" && (
                          <div className="size-8 shrink-0 mt-1 rounded-full bg-secondary flex items-center justify-center">
                            <User className="size-4 text-secondary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {chatMutation.isPending && (
                      <div className="flex items-start gap-3">
                        <div className="size-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
                          <Sparkles className="size-4 text-primary" />
                        </div>
                        <div className="rounded-lg bg-muted px-4 py-2.5">
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2 p-4 border-t bg-background/50"
              >
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="输入你的回答..."
                  className="flex-1 max-h-32 resize-none min-h-9"
                  rows={1}
                />
                <Button type="submit" size="icon" disabled={!input.trim() || chatMutation.isPending} className="shrink-0 h-[38px] w-[38px]">
                  <Send className="size-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Session List */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">面试记录</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sessionList?.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedSession === session.id ? "border-primary bg-primary/5" : "hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{session.position}</span>
                        <Badge variant={session.status === "completed" ? "default" : "secondary"} className="text-xs">
                          {session.status === "completed" ? "已完成" : "进行中"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(session.createdAt).toLocaleString("zh-CN")}
                        </span>
                        {session.overallScore && (
                          <span className="text-xs font-bold">{session.overallScore} 分</span>
                        )}
                      </div>
                    </button>
                  ))}
                  {(!sessionList || sessionList.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">暂无面试记录</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Report Detail */}
            <div className="lg:col-span-2 space-y-4">
              {reportData ? (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">面试评估报告</CardTitle>
                        <Badge variant="outline" className="text-lg font-bold">
                          {reportData.overallScore || 0} 分
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {reportRadarData.length > 0 && (
                        <ResponsiveContainer width="100%" height={300}>
                          <RadarChart data={reportRadarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="dimension" className="text-xs" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            <Radar
                              name="面试评分"
                              dataKey="score"
                              stroke="oklch(0.55 0.18 250)"
                              fill="oklch(0.55 0.18 250)"
                              fillOpacity={0.3}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-green-700">优势</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {reportData.strengths?.map((s: string, i: number) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">+</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-red-700">待改进</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {reportData.weaknesses?.map((w: string, i: number) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-red-500 mt-0.5">-</span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {reportData.summary && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">总体评价</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none">
                          <Streamdown>{reportData.summary}</Streamdown>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {reportData.recommendation && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">建议</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{reportData.recommendation}</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Mic className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>选择一个已完成的面试查看报告</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
