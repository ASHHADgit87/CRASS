import { FolderOpen, Shield, AlertTriangle, Zap, Upload, Search, FileText } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const { user } = useAuth();

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("users").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: scans = [] } = useQuery({
    queryKey: ["allScans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("scans")
        .select("*, projects!inner(project_name, user_id)")
        .order("scan_date", { ascending: false })
        .limit(10);
      return (data ?? []).filter((s: any) => s.projects?.user_id === user!.id);
    },
    enabled: !!user,
  });

  const totalProjects = projects.length;
  const avgSecurity = scans.length > 0
    ? Math.round(scans.reduce((a: number, s: any) => a + (s.security_score ?? 0), 0) / scans.length)
    : 0;

  const { data: allSuggestions = [] } = useQuery({
    queryKey: ["openIssues"],
    queryFn: async () => {
      const { data } = await supabase.from("ai_suggestions").select("*, scans!inner(project_id, projects!inner(user_id))").eq("status", "pending");
      return (data ?? []).filter((s: any) => s.scans?.projects?.user_id === user!.id);
    },
    enabled: !!user,
  });

  const recentScans = scans.slice(0, 4).map((s: any) => {
    const score = s.security_score ?? 0;
    return {
      name: s.projects?.project_name ?? "Unknown",
      date: s.scan_date ? new Date(s.scan_date).toLocaleDateString() : "–",
      issues: 0,
      score,
      status: (score >= 80 ? "success" : score >= 60 ? "warning" : "danger") as "success" | "warning" | "danger",
      scanId: s.id,
    };
  });

  return (
    <div className="space-y-8 animate-slide-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Welcome back, {userProfile?.full_name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's an overview of your code health and security.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Projects Scanned" value={totalProjects} icon={<FolderOpen className="w-4 h-4" />} />
        <StatCard title="Open Issues" value={allSuggestions.length} icon={<AlertTriangle className="w-4 h-4" />} />
        <StatCard title="Security Score" value={`${avgSecurity}%`} icon={<Shield className="w-4 h-4" />} subtitle="across all projects" />
        <StatCard title="Total Scans" value={scans.length} icon={<Zap className="w-4 h-4" />} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/projects"><Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"><Upload className="w-4 h-4" /> Upload Project</Button></Link>
        <Link to="/editor"><Button variant="outline" className="gap-2 border-border hover:bg-secondary"><Search className="w-4 h-4" /> New Scan</Button></Link>
        <Link to="/report"><Button variant="outline" className="gap-2 border-border hover:bg-secondary"><FileText className="w-4 h-4" /> View Reports</Button></Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Scans 📊</h2>
        {recentScans.length === 0 ? (
          <p className="text-muted-foreground text-sm">No scans yet. Run your first scan!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentScans.map((scan) => (
              <div key={scan.scanId} className="glass-card p-4 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{scan.name}</p>
                      <p className="text-xs text-muted-foreground">{scan.date}</p>
                    </div>
                  </div>
                  <StatusBadge status={scan.status} label={scan.status === "success" ? "Passed" : `${scan.score}%`} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Security Score</span>
                      <span className="text-foreground font-medium">{scan.score}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${scan.score >= 90 ? "bg-success" : scan.score >= 70 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${scan.score}%` }} />
                    </div>
                  </div>
                  <Link to={`/report/${scan.scanId}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/10">View →</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
