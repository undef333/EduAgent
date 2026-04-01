import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, FileCheck, FileText, Mic, Clock } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function History() {
  const [activeTab, setActiveTab] = useState("conversations");
  const [, setLocation] = useLocation();

  const { data: conversations } = trpc.qa.conversations.useQuery();
  const { data: gradings } = trpc.grading.list.useQuery();
  const { data: resumes } = trpc.resume.list.useQuery();
  const { data: interviews } = trpc.interview.list.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">历史记录</h1>
        <p className="text-muted-foreground mt-1">查看所有智能体使用记录</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="conversations">
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />问答记录
          </TabsTrigger>
          <TabsTrigger value="gradings">
            <FileCheck className="h-3.5 w-3.5 mr-1.5" />批改记录
          </TabsTrigger>
          <TabsTrigger value="resumes">
            <FileText className="h-3.5 w-3.5 mr-1.5" />简历审查
          </TabsTrigger>
          <TabsTrigger value="interviews">
            <Mic className="h-3.5 w-3.5 mr-1.5" />面试记录
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="mt-4">
          <div className="space-y-2">
            {conversations?.map((conv) => (
              <Card key={conv.id} className="cursor-pointer hover:shadow-sm transition-all" onClick={() => setLocation("/qa")}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-sm">{conv.title || "新对话"}</CardTitle>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(conv.createdAt).toLocaleString("zh-CN")}
                    </span>
                  </div>
                </CardHeader>
              </Card>
            ))}
            {(!conversations || conversations.length === 0) && (
              <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">暂无问答记录</CardContent></Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="gradings" className="mt-4">
          <div className="space-y-2">
            {gradings?.map((g) => (
              <Card key={g.id} className="cursor-pointer hover:shadow-sm transition-all" onClick={() => setLocation("/grading")}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-green-500" />
                      <CardTitle className="text-sm">{g.examTitle}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {g.totalScore !== null && (
                        <Badge variant="outline" className="text-xs">{g.totalScore}/{g.maxScore}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(g.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
            {(!gradings || gradings.length === 0) && (
              <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">暂无批改记录</CardContent></Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resumes" className="mt-4">
          <div className="space-y-2">
            {resumes?.map((r) => (
              <Card key={r.id} className="cursor-pointer hover:shadow-sm transition-all" onClick={() => setLocation("/resume")}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-500" />
                      <CardTitle className="text-sm">简历审查 #{r.id}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.overallScore && (
                        <Badge variant="outline" className="text-xs">{r.overallScore} 分</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
            {(!resumes || resumes.length === 0) && (
              <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">暂无简历审查记录</CardContent></Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="interviews" className="mt-4">
          <div className="space-y-2">
            {interviews?.map((i) => (
              <Card key={i.id} className="cursor-pointer hover:shadow-sm transition-all" onClick={() => setLocation("/interview")}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-purple-500" />
                      <CardTitle className="text-sm">{i.position}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={i.status === "completed" ? "default" : "secondary"} className="text-xs">
                        {i.status === "completed" ? "已完成" : "进行中"}
                      </Badge>
                      {i.overallScore && (
                        <Badge variant="outline" className="text-xs">{i.overallScore} 分</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(i.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
            {(!interviews || interviews.length === 0) && (
              <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">暂无面试记录</CardContent></Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
