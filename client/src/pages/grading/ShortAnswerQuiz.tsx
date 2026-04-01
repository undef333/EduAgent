import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, XCircle, AlertCircle, Lightbulb, RotateCcw, Trophy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

type GradingResult = { score: number; maxScore: number; feedback: string; correctPoints: string[]; missedPoints: string[]; suggestion: string; };

export default function ShortAnswerQuiz({ onBack }: { onBack: () => void }) {
  const { data: questions, isLoading } = trpc.quiz.shortAnswerQuestions.useQuery();
  const gradeMutation = trpc.quiz.gradeShortAnswer.useMutation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, GradingResult>>({});
  const [finished, setFinished] = useState(false);

  const currentQuestion = questions?.[currentIndex];
  const totalQuestions = questions?.length || 0;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const currentAnswer = currentQuestion ? (answers[currentQuestion.id] || "") : "";
  const currentResult = currentQuestion ? results[currentQuestion.id] : undefined;
  const isGraded = !!currentResult;
  const totalScore = Object.values(results).reduce((sum, r) => sum + r.score, 0);
  const totalMaxScore = Object.values(results).reduce((sum, r) => sum + r.maxScore, 0);

  const handleSubmit = async () => {
    if (!currentQuestion) return;
    if (!currentAnswer.trim()) { toast.error("请先输入您的答案"); return; }
    if (currentAnswer.trim().length < 20) { toast.error("答案太短，请详细作答（至少 20 个字）"); return; }
    try {
      const result = await gradeMutation.mutateAsync({ questionId: currentQuestion.id, userAnswer: currentAnswer });
      setResults(prev => ({ ...prev, [currentQuestion.id]: result }));
    } catch { toast.error("批改失败，请重试"); }
  };

  const handleNext = () => { if (currentIndex + 1 >= totalQuestions) setFinished(true); else setCurrentIndex(i => i + 1); };
  const handleRestart = () => { setCurrentIndex(0); setAnswers({}); setResults({}); setFinished(false); };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (finished) {
    const percentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="h-4 w-4 mr-1" />返回</Button>
        <Card className="text-center">
          <CardContent className="pt-10 pb-8">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold mb-2">简答题完成！</h2>
            <p className="text-muted-foreground mb-6">Python 进阶知识简答题</p>
            <div className="text-5xl font-bold text-primary mb-2">{totalScore}/{totalMaxScore}</div>
            <p className="text-muted-foreground mb-6">得分率 {percentage}%</p>
            <div className="max-w-xs mx-auto mb-8"><Progress value={percentage} className="h-3" /></div>
            <div className="space-y-3 text-left max-w-lg mx-auto mb-8">
              {questions?.map((q, i) => { const r = results[q.id]; if (!r) return null; const pct = Math.round((r.score / r.maxScore) * 100); return (<div key={q.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted"><span className="text-sm font-medium w-16 shrink-0">第 {i + 1} 题</span><Progress value={pct} className="flex-1 h-2" /><span className="text-sm font-bold shrink-0">{r.score}/{r.maxScore}</span></div>); })}
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRestart} variant="outline"><RotateCcw className="h-4 w-4 mr-2" />重新答题</Button>
              <Button onClick={onBack}>返回试卷批改</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="h-4 w-4 mr-1" />返回</Button>
        <div className="flex items-center gap-3"><Badge variant="outline" className="text-xs">简答题</Badge><span className="text-sm text-muted-foreground">{currentIndex + 1} / {totalQuestions}</span></div>
      </div>
      <Progress value={progress} className="h-2" />
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5"><span className="text-sm font-bold text-green-600">{currentIndex + 1}</span></div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3"><Badge className="bg-green-100 text-green-700">简答题</Badge><Badge variant="secondary" className="text-xs">满分 {currentQuestion.maxScore} 分</Badge></div>
              <CardTitle className="text-base font-medium leading-relaxed">{currentQuestion.question}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2"><Lightbulb className="h-4 w-4 text-blue-500" /><span className="text-xs font-medium text-blue-700">评分要点（共 {currentQuestion.scoringPoints.length} 点）</span></div>
            <ul className="space-y-1">{currentQuestion.scoringPoints.map((point: string, i: number) => (<li key={i} className="text-xs text-blue-600 flex items-start gap-1.5"><span className="shrink-0 mt-0.5">·</span><span>{point}</span></li>))}</ul>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">您的答案</label>
            <Textarea placeholder="请在此输入您的答案，尽量详细、结构清晰..." value={currentAnswer} onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))} disabled={isGraded} className="min-h-[200px] text-sm leading-relaxed" />
            <div className="text-xs text-muted-foreground mt-1 text-right">{currentAnswer.length} 字</div>
          </div>
          {!isGraded && (<Button onClick={handleSubmit} disabled={!currentAnswer.trim() || gradeMutation.isPending} className="w-full">{gradeMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI 正在批改中...</> : "提交答案"}</Button>)}
        </CardContent>
      </Card>
      {currentResult && (
        <Card className={cn("border-2", currentResult.score >= currentResult.maxScore * 0.7 ? "border-green-200" : "border-orange-200")}>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">{currentResult.score >= currentResult.maxScore * 0.7 ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-orange-500" />}<span className="font-semibold">AI 批改结果</span></div>
              <div className="flex items-center gap-2"><span className="text-2xl font-bold text-primary">{currentResult.score}</span><span className="text-muted-foreground">/ {currentResult.maxScore} 分</span></div>
            </div>
            <Progress value={(currentResult.score / currentResult.maxScore) * 100} className="h-2" />
            <div className="p-3 bg-muted rounded-lg"><p className="text-xs font-medium mb-1.5 text-muted-foreground">综合评语</p><div className="text-sm leading-relaxed"><Streamdown>{currentResult.feedback}</Streamdown></div></div>
            {currentResult.correctPoints.length > 0 && (<div className="p-3 bg-green-50 rounded-lg"><div className="flex items-center gap-2 mb-2"><CheckCircle2 className="h-4 w-4 text-green-600" /><span className="text-xs font-medium text-green-700">答对的要点</span></div><ul className="space-y-1">{currentResult.correctPoints.map((point, i) => (<li key={i} className="text-xs text-green-700 flex items-start gap-1.5"><span className="shrink-0 mt-0.5">✓</span><span>{point}</span></li>))}</ul></div>)}
            {currentResult.missedPoints.length > 0 && (<div className="p-3 bg-red-50 rounded-lg"><div className="flex items-center gap-2 mb-2"><XCircle className="h-4 w-4 text-red-500" /><span className="text-xs font-medium text-red-700">遗漏的要点</span></div><ul className="space-y-1">{currentResult.missedPoints.map((point, i) => (<li key={i} className="text-xs text-red-600 flex items-start gap-1.5"><span className="shrink-0 mt-0.5">✗</span><span>{point}</span></li>))}</ul></div>)}
            {currentResult.suggestion && (<div className="p-3 bg-blue-50 rounded-lg"><div className="flex items-center gap-2 mb-1"><Lightbulb className="h-4 w-4 text-blue-500" /><span className="text-xs font-medium text-blue-700">改进建议</span></div><p className="text-xs text-blue-600 leading-relaxed">{currentResult.suggestion}</p></div>)}
          </CardContent>
        </Card>
      )}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{Object.keys(results).length > 0 && <>已批改 <span className="font-bold text-primary">{Object.keys(results).length}</span> 题</>}</div>
        {isGraded && (<Button onClick={handleNext} className="min-w-24">{currentIndex + 1 >= totalQuestions ? "查看结果" : "下一题"}<ChevronRight className="h-4 w-4 ml-1" /></Button>)}
      </div>
    </div>
  );
}
