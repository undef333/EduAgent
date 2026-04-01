import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Shield, GraduationCap, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  student: "学员",
  teacher: "教师",
  admin: "管理员",
};

const roleColors: Record<string, string> = {
  student: "bg-blue-100 text-blue-700",
  teacher: "bg-green-100 text-green-700",
  admin: "bg-purple-100 text-purple-700",
};

const roleIcons: Record<string, any> = {
  student: GraduationCap,
  teacher: BookOpen,
  admin: Shield,
};

export default function AdminUsers() {
  const { data: userList, refetch } = trpc.user.list.useQuery();

  const updateRoleMutation = trpc.user.updateRole.useMutation({
    onSuccess: () => {
      toast.success("角色已更新");
      refetch();
    },
    onError: (err) => toast.error("更新失败：" + err.message),
  });

  const handleRoleChange = (userId: number, newRole: string) => {
    updateRoleMutation.mutate({ userId, eduRole: newRole as "student" | "teacher" | "admin" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">用户管理</h1>
        <p className="text-muted-foreground mt-1">管理系统用户和角色权限</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总用户数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userList?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">教师数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userList?.filter(u => u.eduRole === "teacher").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">管理员数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userList?.filter(u => u.eduRole === "admin").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 text-sm font-medium">用户</th>
                  <th className="text-left p-4 text-sm font-medium">邮箱</th>
                  <th className="text-left p-4 text-sm font-medium">当前角色</th>
                  <th className="text-left p-4 text-sm font-medium">注册时间</th>
                  <th className="text-left p-4 text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {userList?.map((user) => {
                  const role = user.eduRole || "student";
                  const RoleIcon = roleIcons[role] || GraduationCap;
                  return (
                    <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {user.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                          <span className="text-sm font-medium">{user.name || "未命名"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{user.email || "-"}</td>
                      <td className="p-4">
                        <Badge className={`${roleColors[role]} text-xs`}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleLabels[role]}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="p-4">
                        <Select
                          value={role}
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">学员</SelectItem>
                            <SelectItem value="teacher">教师</SelectItem>
                            <SelectItem value="admin">管理员</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {(!userList || userList.length === 0) && (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>暂无用户</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
