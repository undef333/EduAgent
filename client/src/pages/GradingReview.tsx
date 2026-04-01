import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileCheck, CheckCircle, Loader2, Eye } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function GradingReview() {
  const [reviewNote, setReviewNote] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: gradingList, refetch } = trpc.grading.listAll.useQuery();

  const reviewMutation = trpc.grading.review.useMutation({
    onSuccess: () => {
      toast.success("审核完成");
      setReviewNote("");
      setDialogOpen(false);
      refetch();
    },
    onError: (err) => toast.error("审核失败：" + err.message),
  });

  const handleReview = (status: "reviewed" | "published") => {
    if (!selectedId) return;
    reviewMutation.mutate({ id: selectedId, reviewNote, status });
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: "待批改", color: "bg-yellow-100 text-yellow-700" },
    graded: { label: "待审核", color: "bg-blue-100 text-blue-700" },
    reviewed: { label: "已审核", color: "bg-green-100 text-green-700" },
    published: { label: "已发布", color: "bg-purple-100 text-purple-700" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">批改审核</h1>
        <p className="text-muted-foreground mt-1">审核 AI 批改结果，添加教师评语后发布</p>
      </div>

      <div className="space-y-3">
        {gradingList?.map((grading) => {
          const status = statusMap[grading.status] || statusMap.pending;
          let parsedResult: any = null;
          try { parsedResult = grading.gradingResult ? JSON.parse(grading.gradingResult) : null; } catch {}

          return (
            <Card key={grading.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{grading.examTitle}</CardTitle>
                    <CardDescription>
                      学员 ID: {grading.userId} · {new Date(grading.createdAt).toLocaleString("zh-CN")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {grading.totalScore !== null && (
                      <Badge variant="outline" className="text-base font-bold">
                        {grading.totalScore}/{grading.maxScore}
                      </Badge>
                    )}
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {parsedResult?.summary && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">AI 批改摘要</p>
                      <p className="text-sm text-muted-foreground">{parsedResult.summary}</p>
                    </div>
                  )}

                  {grading.reviewNote && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-700 mb-1">教师评语</p>
                      <p className="text-sm text-green-600">{grading.reviewNote}</p>
                    </div>
                  )}

                  {(grading.status === "graded" || grading.status === "reviewed") && (
                    <div className="flex gap-2">
                      <Dialog open={dialogOpen && selectedId === grading.id} onOpenChange={(open) => { setDialogOpen(open); if (open) setSelectedId(grading.id); }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedId(grading.id)}>
                            <Eye className="h-3.5 w-3.5 mr-1" />审核
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>审核批改结果</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <label className="text-sm font-medium mb-1.5 block">教师评语（可选）</label>
                              <Textarea
                                placeholder="添加评语或修改意见..."
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                                className="min-h-[100px]"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => handleReview("reviewed")} disabled={reviewMutation.isPending} variant="outline" className="flex-1">
                                {reviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" />确认审核</>}
                              </Button>
                              <Button onClick={() => handleReview("published")} disabled={reviewMutation.isPending} className="flex-1">
                                {reviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "审核并发布"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(!gradingList || gradingList.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>暂无待审核的批改记录</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
