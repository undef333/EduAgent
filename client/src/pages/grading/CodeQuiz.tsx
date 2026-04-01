import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, XCircle, AlertCircle, Lightbulb, RotateCcw, Trophy, Code2, Clock, Database } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
];

type GradingResult = {
  overallScore: number;
  isCorrect: boolean;
  timeComplexity: string;
  spaceComplexity: string;
  dimensions: { name: string; score: number; maxScore: number; comment: string }[];
  syntaxErrors: string[];
  logicErrors: string[];
  improvements: string[];
  summary: string;
};

const DIFFICULTY_MAP: Record<string, { label: string; color: string }> = {
  easy: { label: "简单", color: "bg-green-100 text-green-700" },
  medium: { label: "中等", color: "bg-yellow-100 text-yellow-700" },
  hard: { label: "困难", color: "bg-red-100 text-red-700" },
};
const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  "two-pointer": { label: "双指针", color: "bg-blue-100 text-blue-700" },
  dp: { label: "动态规划", color: "bg-purple-100 text-purple-700" },
  array: { label: "数组", color: "bg-orange-100 text-orange-700" },
};

export default function CodeQuiz({ onBack }: { onBack: () => void }) {
  const { data: questions, isLoading } = trpc.quiz.codeQuestions.useQuery();
  const gradeMutation = trpc.quiz.gradeCode.useMutation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [language, setLanguage] = useState("python");
  const [codes, setCodes] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, GradingResult>>({});
  const [finished, setFinished] = useState(false);
  const [showHints, setShowHints] = useState(false);

  const currentQuestion = questions?.[currentIndex];
  const totalQuestions = questions?.length || 0;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const currentCode = currentQuestion ? (codes[currentQuestion.id] || "") : "";
  const currentResult = currentQuestion ? results[currentQuestion.id] : undefined;
  const isGraded = !!currentResult;

  const handleSubmit = async () => {
    if (!currentQuestion) return;
    if (!currentCode.trim()) { toast.error("请先输入您的代码"); return; }
    if (currentCode.trim().length < 10) { toast.error("代码太短，请完整实现解题逻辑"); return; }
    try {
      const result = await gradeMutation.mutateAsync({ questionId: currentQuestion.id, language, code: currentCode });
      setResults(prev => ({ ...prev, [currentQuestion.id]: result }));
    } catch { toast.error("批改失败，请重试"); }
  };

  const handleNext = () => { if (currentIndex + 1 >= totalQuestions) setFinished(true); else { setCurrentIndex(i => i + 1); setShowHints(false); } };
  const handleRestart = () => { setCurrentIndex(0); setCodes({}); setResults({}); setFinished(false); setShowHints(false); };

  const totalScore = Object.values(results).reduce((sum, r) => sum + r.overallScore, 0);
  const avgScore = Object.keys(results).length > 0 ? Math.round(totalScore / Object.keys(results).length) : 0;

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (finished) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="h-4 w-4 mr-1" />返回</Button>
        <Card className="text-center">
          <CardContent className="pt-10 pb-8">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold mb-2">代码题完成！</h2>
            <p className="text-muted-foreground mb-6">算法编程题</p>
            <div className="text-5xl font-bold text-primary mb-2">{avgScore}<span className="text-2xl text-muted-foreground">/100</span></div>
            <p className="text-muted-foreground mb-6">平均得分</p>
            <div className="max-w-xs mx-auto mb-8"><Progress value={avgScore} className="h-3" /></div>
            <div className="space-y-3 text-left max-w-lg mx-auto mb-8">
              {questions?.map((q, i) => { const r = results[q.id]; if (!r) return null; return (<div key={q.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted"><span className="text-sm font-medium w-16 shrink-0">第 {i + 1} 题</span><Progress value={r.overallScore} className="flex-1 h-2" /><div className="flex items-center gap-2 shrink-0">{r.isCorrect ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-400" />}<span className="text-sm font-bold">{r.overallScore}</span></div></div>); })}
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
  const diff = DIFFICULTY_MAP[currentQuestion.difficulty] || DIFFICULTY_MAP.medium;
  const cat = CATEGORY_MAP[currentQuestion.category] || { label: currentQuestion.categoryLabel, color: "bg-gray-100 text-gray-700" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="h-4 w-4 mr-1" />返回</Button>
        <div className="flex items-center gap-3"><Badge variant="outline" className="text-xs">代码题</Badge><span className="text-sm text-muted-foreground">{currentIndex + 1} / {totalQuestions}</span></div>
      </div>
      <Progress value={progress} className="h-2" />

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5"><span className="text-sm font-bold text-orange-600">{currentIndex + 1}</span></div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge className={cat.color}>{cat.label}</Badge>
                <Badge className={diff.color}>{diff.label}</Badge>
              </div>
              <CardTitle className="text-base font-medium leading-relaxed mb-3">{currentQuestion.title}</CardTitle>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{currentQuestion.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Examples */}
          <div>
            <p className="text-sm font-medium mb-2">示例</p>
            <div className="space-y-2">
              {currentQuestion.examples.map((ex: any, i: number) => (
                <div key={i} className="p-3 bg-muted rounded-lg font-mono text-xs">
                  <div><span className="text-muted-foreground">输入：</span>{ex.input}</div>
                  <div><span className="text-muted-foreground">输出：</span>{ex.output}</div>
                  {ex.explanation && <div className="text-muted-foreground mt-1">解释：{ex.explanation}</div>}
                </div>
              ))}
            </div>
          </div>
          {/* Constraints */}
          <div>
            <p className="text-sm font-medium mb-2">约束条件</p>
            <ul className="space-y-1">{currentQuestion.constraints.map((c: string, i: number) => (<li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="shrink-0 mt-0.5">·</span><span>{c}</span></li>))}</ul>
          </div>
          {/* Hints toggle */}
          {currentQuestion.hints && currentQuestion.hints.length > 0 && (
            <div>
              <Button variant="ghost" size="sm" onClick={() => setShowHints(!showHints)} className="text-blue-600 hover:text-blue-700 px-0">
                <Lightbulb className="h-4 w-4 mr-1" />{showHints ? "隐藏提示" : "查看提示"}
              </Button>
              {showHints && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <ul className="space-y-1">{currentQuestion.hints.map((hint: string, i: number) => (<li key={i} className="text-xs text-blue-600 flex items-start gap-1.5"><span className="shrink-0 font-bold mt-0.5">{i + 1}.</span><span>{hint}</span></li>))}</ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code Editor Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Code2 className="h-4 w-4" />代码编辑区</CardTitle>
            <Select value={language} onValueChange={setLanguage} disabled={isGraded}>
              <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{LANGUAGES.map(l => (<SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder={`// 请用 ${LANGUAGES.find(l => l.value === language)?.label || language} 实现解题代码...\n// 注意：请包含完整的函数定义`}
            value={currentCode}
            onChange={(e) => setCodes(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
            disabled={isGraded}
            className="min-h-[280px] font-mono text-sm leading-relaxed bg-gray-950 text-green-400 border-gray-700 placeholder:text-gray-600"
          />
          {!isGraded && (
            <Button onClick={handleSubmit} disabled={!currentCode.trim() || gradeMutation.isPending} className="w-full">
              {gradeMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI 正在分析代码...</> : "提交代码"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Grading Result */}
      {currentResult && (
        <Card className={cn("border-2", currentResult.isCorrect ? "border-green-200" : "border-orange-200")}>
          <CardContent className="pt-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                {currentResult.isCorrect ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-orange-500" />}
                <span className="font-semibold">AI 代码审查结果</span>
                <Badge className={currentResult.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{currentResult.isCorrect ? "逻辑正确" : "逻辑有误"}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-primary">{currentResult.overallScore}</span>
                <span className="text-muted-foreground">/ 100</span>
              </div>
            </div>
            <Progress value={currentResult.overallScore} className="h-2" />

            {/* Complexity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div><p className="text-xs text-muted-foreground">时间复杂度</p><p className="text-sm font-bold">{currentResult.timeComplexity}</p></div>
              </div>
              <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground shrink-0" />
                <div><p className="text-xs text-muted-foreground">空间复杂度</p><p className="text-sm font-bold">{currentResult.spaceComplexity}</p></div>
              </div>
            </div>

            {/* Dimension Scores */}
            {currentResult.dimensions && currentResult.dimensions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">各维度评分</p>
                <div className="space-y-2">
                  {currentResult.dimensions.map((dim, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{dim.name}</span>
                        <span className="text-muted-foreground">{dim.score}/{dim.maxScore}</span>
                      </div>
                      <Progress value={(dim.score / dim.maxScore) * 100} className="h-1.5" />
                      {dim.comment && <p className="text-xs text-muted-foreground">{dim.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {currentResult.syntaxErrors.length > 0 && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2"><XCircle className="h-4 w-4 text-red-500" /><span className="text-xs font-medium text-red-700">语法错误</span></div>
                <ul className="space-y-1">{currentResult.syntaxErrors.map((e, i) => (<li key={i} className="text-xs text-red-600 flex items-start gap-1.5"><span className="shrink-0 mt-0.5">·</span><span>{e}</span></li>))}</ul>
              </div>
            )}
            {currentResult.logicErrors.length > 0 && (
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2"><AlertCircle className="h-4 w-4 text-orange-500" /><span className="text-xs font-medium text-orange-700">逻辑问题</span></div>
                <ul className="space-y-1">{currentResult.logicErrors.map((e, i) => (<li key={i} className="text-xs text-orange-600 flex items-start gap-1.5"><span className="shrink-0 mt-0.5">·</span><span>{e}</span></li>))}</ul>
              </div>
            )}
            {/* Improvements */}
            {currentResult.improvements.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2"><Lightbulb className="h-4 w-4 text-blue-500" /><span className="text-xs font-medium text-blue-700">优化建议</span></div>
                <ul className="space-y-1">{currentResult.improvements.map((imp, i) => (<li key={i} className="text-xs text-blue-600 flex items-start gap-1.5"><span className="shrink-0 font-bold mt-0.5">{i + 1}.</span><span>{imp}</span></li>))}</ul>
              </div>
            )}
            {/* Summary */}
            {currentResult.summary && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium mb-1.5 text-muted-foreground">总体评价</p>
                <div className="text-sm leading-relaxed"><Streamdown>{currentResult.summary}</Streamdown></div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{Object.keys(results).length > 0 && <>已完成 <span className="font-bold text-primary">{Object.keys(results).length}</span> 题</>}</div>
        {isGraded && (<Button onClick={handleNext} className="min-w-24">{currentIndex + 1 >= totalQuestions ? "查看结果" : "下一题"}<ChevronRight className="h-4 w-4 ml-1" /></Button>)}
      </div>
    </div>
  );
}
