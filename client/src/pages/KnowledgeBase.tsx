import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Plus, Check, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState("list");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: knowledgeList, refetch } = trpc.knowledge.list.useQuery();
  const { data: lowConfidenceList, refetch: refetchLow } = trpc.knowledge.lowConfidence.useQuery();

  const createMutation = trpc.knowledge.create.useMutation({
    onSuccess: () => {
      toast.success("知识条目已创建");
      setTitle(""); setContent(""); setCategory(""); setTags("");
      setDialogOpen(false);
      refetch();
    },
    onError: (err) => toast.error("创建失败：" + err.message),
  });

  const approveMutation = trpc.knowledge.approve.useMutation({
    onSuccess: () => { toast.success("已审核通过"); refetch(); },
  });

  const resolveMutation = trpc.knowledge.resolveLowConfidence.useMutation({
    onSuccess: () => { toast.success("已处理"); refetchLow(); },
  });

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) { toast.error("请填写标题和内容"); return; }
    createMutation.mutate({ title, content, category, tags });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">知识库管理</h1>
          <p className="text-muted-foreground mt-1">管理课程资料、知识点标注和低置信度问题</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />添加知识</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>添加知识条目</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">标题</label>
                <Input placeholder="知识点标题" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">内容</label>
                <Textarea placeholder="知识点详细内容..." value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[200px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">分类</label>
                  <Input placeholder="例如：Python基础" value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">标签</label>
                  <Input placeholder="用逗号分隔" value={tags} onChange={(e) => setTags(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                创建
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">知识库列表</TabsTrigger>
          <TabsTrigger value="lowConfidence">
            低置信度问题
            {lowConfidenceList && lowConfidenceList.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs px-1.5">{lowConfidenceList.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <div className="space-y-3">
            {knowledgeList?.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      {item.category && <Badge variant="secondary" className="text-xs">{item.category}</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.isApproved ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">已审核</Badge>
                      ) : (
                        <>
                          <Badge className="bg-yellow-100 text-yellow-700 text-xs">待审核</Badge>
                          <Button size="sm" variant="outline" onClick={() => approveMutation.mutate({ id: item.id })}>
                            <Check className="h-3.5 w-3.5 mr-1" />审核通过
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{item.content}</p>
                  {item.tags && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {item.tags.split(",").map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{tag.trim()}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {(!knowledgeList || knowledgeList.length === 0) && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>知识库为空，点击右上角添加知识</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="lowConfidence" className="mt-4">
          <div className="space-y-3">
            {lowConfidenceList?.map((item) => (
              <Card key={item.id} className="border-l-4 border-l-yellow-400">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <CardTitle className="text-sm">低置信度问题</CardTitle>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => resolveMutation.mutate({ id: item.id })}>
                      标记已处理
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground mb-1">用户问题</p>
                      <p className="text-sm">{item.question}</p>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded">
                      <p className="text-xs text-yellow-600 mb-1">AI 回答（低置信度）</p>
                      <p className="text-sm">{item.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!lowConfidenceList || lowConfidenceList.length === 0) && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>暂无低置信度问题</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
