import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ChevronRight, ChevronLeft, Trophy, RotateCcw, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

type QuizState = "answering" | "correct" | "wrong";

export default function ObjectiveQuiz({ onBack }: { onBack: () => void }) {
  const { data: questions, isLoading } = trpc.quiz.objectiveQuestions.useQuery();
  const checkMutation = trpc.quiz.checkObjective.useMutation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [quizState, setQuizState] = useState<QuizState>("answering");
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctAnswer: string | string[]; explanation: string } | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const currentQuestion = questions?.[currentIndex];
  const isMultiple = currentQuestion?.type === "multiple";
  const totalQuestions = questions?.length || 0;
  const progress = (currentIndex / totalQuestions) * 100;

  const handleOptionClick = (key: string) => {
    if (quizState !== "answering") return;
    if (isMultiple) {
      setSelectedOptions(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    } else {
      setSelectedOptions([key]);
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion || selectedOptions.length === 0) { toast.error("请先选择答案"); return; }
    const answer = isMultiple ? selectedOptions.sort() : selectedOptions[0];
    try {
      const result = await checkMutation.mutateAsync({ questionId: currentQuestion.id, answer });
      setFeedback(result);
      setQuizState(result.isCorrect ? "correct" : "wrong");
      if (result.isCorrect) setScore(s => s + 1);
      setResults(prev => [...prev, result.isCorrect]);
    } catch { toast.error("提交失败，请重试"); }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalQuestions) { setFinished(true); }
    else { setCurrentIndex(i => i + 1); setSelectedOptions([]); setQuizState("answering"); setFeedback(null); }
  };

  const handleRestart = () => {
    setCurrentIndex(0); setSelectedOptions([]); setQuizState("answering");
    setFeedback(null); setScore(0); setFinished(false); setResults([]);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (finished) {
    const percentage = Math.round((score / totalQuestions) * 100);
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="h-4 w-4 mr-1" />返回</Button>
        <Card className="text-center">
          <CardContent className="pt-10 pb-8">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold mb-2">答题完成！</h2>
            <p className="text-muted-foreground mb-6">Python 基础知识测验</p>
            <div className="text-5xl font-bold text-primary mb-2">{score}/{totalQuestions}</div>
            <p className="text-muted-foreground mb-6">正确率 {percentage}%</p>
            <div className="max-w-xs mx-auto mb-6"><Progress value={percentage} className="h-3" /></div>
            <div className="flex justify-center gap-2 flex-wrap mb-8">
              {results.map((correct, i) => (
                <div key={i} className={cn("size-8 rounded-full flex items-center justify-center text-xs font-bold text-white", correct ? "bg-green-500" : "bg-red-400")}>{i + 1}</div>
              ))}
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
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">{currentQuestion.type === "single" ? "单选题" : "多选题"}</Badge>
          <span className="text-sm text-muted-foreground">{currentIndex + 1} / {totalQuestions}</span>
        </div>
      </div>
      <Progress value={progress} className="h-2" />
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-sm font-bold text-primary">{currentIndex + 1}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={currentQuestion.type === "single" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}>
                  {currentQuestion.type === "single" ? "单选题" : "多选题（可多选）"}
                </Badge>
                {currentQuestion.tags.map((tag: string) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
              </div>
              <CardTitle className="text-base font-medium leading-relaxed whitespace-pre-wrap">{currentQuestion.question}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option: { key: string; text: string }) => {
            const isSelected = selectedOptions.includes(option.key);
            const isCorrectOption = feedback ? (Array.isArray(feedback.correctAnswer) ? feedback.correctAnswer.includes(option.key) : feedback.correctAnswer === option.key) : false;
            let optionStyle = "border-border bg-background hover:bg-muted/50";
            if (quizState !== "answering") {
              if (isCorrectOption) optionStyle = "border-green-500 bg-green-50 text-green-800";
              else if (isSelected && !isCorrectOption) optionStyle = "border-red-400 bg-red-50 text-red-700";
            } else if (isSelected) optionStyle = "border-primary bg-primary/5";
            return (
              <button key={option.key} onClick={() => handleOptionClick(option.key)} disabled={quizState !== "answering"}
                className={cn("w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-start gap-3", optionStyle, quizState === "answering" && "cursor-pointer", quizState !== "answering" && "cursor-default")}>
                <span className={cn("size-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                  isSelected && quizState === "answering" ? "border-primary bg-primary text-white" : "border-current",
                  quizState !== "answering" && isCorrectOption ? "border-green-500 bg-green-500 text-white" : "",
                  quizState !== "answering" && isSelected && !isCorrectOption ? "border-red-400 bg-red-400 text-white" : "")}>
                  {option.key}
                </span>
                <span className="text-sm leading-relaxed">{option.text}</span>
                {quizState !== "answering" && isCorrectOption && <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto shrink-0 mt-0.5" />}
                {quizState !== "answering" && isSelected && !isCorrectOption && <XCircle className="h-5 w-5 text-red-400 ml-auto shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </CardContent>
      </Card>
      {feedback && (
        <Card className={cn("border-2", feedback.isCorrect ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50")}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              {feedback.isCorrect ? <><CheckCircle2 className="h-5 w-5 text-green-600" /><span className="font-semibold text-green-700 text-base">🎉 恭喜答对！</span></> : <><XCircle className="h-5 w-5 text-orange-600" /><span className="font-semibold text-orange-700 text-base">答错了，看看解析吧</span></>}
            </div>
            <div className="text-sm leading-relaxed text-gray-700">
              <p className="font-medium mb-1">解析：</p>
              <Streamdown>{feedback.explanation}</Streamdown>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">当前得分：<span className="font-bold text-primary">{score}</span> / {currentIndex + (quizState !== "answering" ? 1 : 0)}</div>
        <div className="flex gap-2">
          {quizState === "answering" ? (
            <Button onClick={handleSubmit} disabled={selectedOptions.length === 0 || checkMutation.isPending} className="min-w-24">
              {checkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "提交答案"}
            </Button>
          ) : (
            <Button onClick={handleNext} className="min-w-24">
              {currentIndex + 1 >= totalQuestions ? "查看结果" : "下一题"}<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
