import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Feed() {
  const [activeTab, setActiveTab] = useState("articles");

  // Queries
  const articlesQuery = trpc.feed.articles.useQuery({ limit: 5 });
  const jobsQuery = trpc.feed.jobs.useQuery({ limit: 20 });
  const companiesQuery = trpc.feed.companies.useQuery();
  const followedCompaniesQuery = trpc.feed.followedCompanies.useQuery();

  // Mutations
  const addFollowedCompanyMutation = trpc.feed.addFollowedCompany.useMutation({
    onSuccess: () => {
      followedCompaniesQuery.refetch();
      toast.success("已关注公司");
    },
    onError: () => {
      toast.error("关注失败");
    },
  });

  const removeFollowedCompanyMutation = trpc.feed.removeFollowedCompany.useMutation({
    onSuccess: () => {
      followedCompaniesQuery.refetch();
      toast.success("已取消关注");
    },
    onError: () => {
      toast.error("取消关注失败");
    },
  });

  const handleFollowCompany = (companyId: number) => {
    addFollowedCompanyMutation.mutate({ companyId });
  };

  const handleUnfollowCompany = (followedId: number) => {
    removeFollowedCompanyMutation.mutate({ followedId });
  };

  const isFollowing = (companyId: number) => {
    return followedCompaniesQuery.data?.some((fc) => fc.companyId === companyId);
  };

  const getFollowedId = (companyId: number) => {
    return followedCompaniesQuery.data?.find((fc) => fc.companyId === companyId)?.id;
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      quantum_bit: "量子位",
      machine_heart: "机器之心",
      mind_element: "心智元",
    };
    return labels[source] || source;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      research: "研究员",
      product: "产品经理",
      operations: "运营",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      research: "bg-blue-100 text-blue-800",
      product: "bg-purple-100 text-purple-800",
      operations: "bg-green-100 text-green-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">信息速递</h1>
          <p className="text-gray-600 mt-1">行业资讯 · 岗位机会 · 公司关注</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="articles">行业资讯</TabsTrigger>
          <TabsTrigger value="jobs">岗位推荐</TabsTrigger>
          <TabsTrigger value="followed">我的关注</TabsTrigger>
        </TabsList>

        {/* 行业资讯标签页 */}
        <TabsContent value="articles" className="space-y-4">
          {articlesQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : articlesQuery.data?.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                暂无资讯
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {articlesQuery.data?.map((article) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      {article.imageUrl && (
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base line-clamp-2 mb-2">
                              {article.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {article.summary}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {getSourceLabel(article.source)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDate(article.publishedAt)}
                            </span>
                          </div>
                          <a
                            href={article.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            阅读原文
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 岗位推荐标签页 */}
        <TabsContent value="jobs" className="space-y-4">
          {jobsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : jobsQuery.data?.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                暂无岗位
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {jobsQuery.data?.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {companiesQuery.data?.find((c) => c.id === job.companyId)?.name}
                        </CardDescription>
                      </div>
                      <Badge className={getCategoryColor(job.category)}>
                        {getCategoryLabel(job.category)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">工作地点:</span>
                        <p className="font-medium">{job.location}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">薪资范围:</span>
                        <p className="font-medium">
                          {job.salaryMin}k-{job.salaryMax}k
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">工作经验:</span>
                        <p className="font-medium">{job.experience}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">学历要求:</span>
                        <p className="font-medium">{job.education}</p>
                      </div>
                    </div>

                    {job.description && (
                      <div>
                        <span className="text-sm text-gray-600">职位描述:</span>
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                          {job.description}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(job.publishedAt)}
                      </span>
                      <Button size="sm" variant="outline">
                        查看详情
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 我的关注标签页 */}
        <TabsContent value="followed" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {companiesQuery.data?.map((company) => {
              const isFollowed = isFollowing(company.id);
              const followedId = getFollowedId(company.id);

              return (
                <Card key={company.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      {company.logo && (
                        <img
                          src={company.logo}
                          alt={company.name}
                          className="w-16 h-16 mx-auto rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">{company.name}</h3>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {company.description}
                        </p>
                      </div>

                      {isFollowed ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (followedId) {
                              handleUnfollowCompany(followedId);
                            }
                          }}
                          disabled={removeFollowedCompanyMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          已关注
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleFollowCompany(company.id)}
                          disabled={addFollowedCompanyMutation.isPending}
                        >
                          <Heart className="w-4 h-4 mr-1" />
                          关注
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {companiesQuery.data?.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                暂无公司
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
