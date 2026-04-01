import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import QAChat from "./pages/QAChat";
import Grading from "./pages/Grading";
import ResumeReview from "./pages/ResumeReview";
import Interview from "./pages/Interview";
import KnowledgeBase from "./pages/KnowledgeBase";
import GradingReview from "./pages/GradingReview";
import AdminUsers from "./pages/AdminUsers";
import History from "./pages/History";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/qa" component={QAChat} />
        <Route path="/grading" component={Grading} />
        <Route path="/resume" component={ResumeReview} />
        <Route path="/interview" component={Interview} />
        <Route path="/knowledge" component={KnowledgeBase} />
        <Route path="/grading-review" component={GradingReview} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/history" component={History} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
