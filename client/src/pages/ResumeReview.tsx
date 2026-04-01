import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2, ArrowRight, MapPin } from "lucide-react";
import { useState } from "react";
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

export default function ResumeReview() {
  const [resumeText, setResumeText] = useState("");
  const [activeTab, setActiveTab] = useState("submit");
  const [selectedReview, setSelectedReview] = useState<number | null>(null);

  const { data: reviewList, refetch } = trpc.resume.list.useQuery();

  const submitMutation = trpc.resume.submit.useMutation({
    onSuccess: () => {
      toast.success("简历审查完成！");
      setResumeText("");
      setActiveTab("history");
      refetch();
    },
    onError: (err) => {
      toast.error("审查失败：" + err.message);
    },
  });

  const handleSubmit = () => {
    if (!resumeText.trim()) {
      toast.error("请粘贴简历内容");
      return;
    }
    submitMutation.mutate({ resumeText });
  };

  const activeReview = selectedReview !== null
    ? reviewList?.find(r => r.id === selectedReview)
    : reviewList?.[0];

  let radarData: any[] = [];
  let dimensions: any[] = [];
  let suggestions: any = null;

  if (activeReview) {
    try { radarData = JSON.parse(activeReview.radarData || "[]"); } catch {}
    try { dimensions = JSON.parse(activeReview.dimensionScores || "[]"); } catch {}
    try { suggestions = JSON.parse(activeReview.suggestions || "{}"); } catch {}
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">简历审查</h1>
        <p className="text-muted-foreground mt-1">
          六维度精准诊断：工作经历、技能匹配、项目描述、量化数据、格式排版、表达规范
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="submit">提交审查</TabsTrigger>
          <TabsTrigger value="history">审查记录</TabsTrigger>
        </TabsList>

        <TabsContent value="submit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">提交简历审查</CardTitle>
              <CardDescription>
                粘贴简历文本内容，AI 将从六个维度进行精准诊断
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="粘贴简历内容...&#10;&#10;例如：&#10;姓名：张三&#10;教育背景：XX大学 计算机科学与技术&#10;工作经历：...&#10;项目经验：...&#10;技能特长：..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="min-h-[400px] text-sm"
              />
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="w-full"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI 正在审查中...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    开始审查
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {activeReview ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Left: Radar Chart & Scores */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">能力雷达图</CardTitle>
                      <Badge
                        variant="outline"
                        className={`text-lg font-bold ${
                          (activeReview.overallScore || 0) >= 80
                            ? "text-green-600"
                            : (activeReview.overallScore || 0) >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {activeReview.overallScore || 0} 分
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(activeReview.createdAt).toLocaleString("zh-CN")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {radarData.length > 0 && (
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="dimension" className="text-xs" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar
                            name="能力评分"
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

                {/* Dimension Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">维度评分详情</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dimensions.map((dim: any, i: number) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{dim.name}</span>
                            <span className="text-sm font-bold">{dim.score}/{dim.maxScore || 100}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${(dim.score / (dim.maxScore || 100)) * 100}%`,
                                backgroundColor:
                                  dim.score >= 80 ? "oklch(0.65 0.18 150)" :
                                  dim.score >= 60 ? "oklch(0.75 0.15 80)" :
                                  "oklch(0.65 0.2 25)",
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{dim.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Suggestions */}
              <div className="space-y-4">
                {suggestions?.summary && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">总体评价</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <Streamdown>{suggestions.summary}</Streamdown>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">修改建议</CardTitle>
                    <CardDescription>带原文定位的具体修改建议</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {suggestions?.suggestions?.map((s: any, i: number) => (
                        <div key={i} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground">{s.location}</span>
                          </div>
                          {s.original && (
                            <div className="p-2 bg-red-50 rounded text-sm line-through text-red-600">
                              {s.original}
                            </div>
                          )}
                          <div className="p-2 bg-green-50 rounded text-sm text-green-700">
                            <ArrowRight className="h-3 w-3 inline mr-1" />
                            {s.suggestion}
                          </div>
                          <p className="text-xs text-muted-foreground">{s.reason}</p>
                        </div>
                      ))}
                      {(!suggestions?.suggestions || suggestions.suggestions.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">暂无修改建议</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Review List */}
                {reviewList && reviewList.length > 1 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">历史审查</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {reviewList.map((review) => (
                          <button
                            key={review.id}
                            onClick={() => setSelectedReview(review.id)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              (selectedReview || reviewList[0]?.id) === review.id
                                ? "border-primary bg-primary/5"
                                : "hover:bg-accent"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm">
                                {new Date(review.createdAt).toLocaleString("zh-CN")}
                              </span>
                              <Badge variant="outline">{review.overallScore || 0} 分</Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>暂无审查记录</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
