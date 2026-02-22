import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { StatCard } from "@/components/StatCard";
import { Shield, Bug, Zap, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

const tooltipStyle = { background: "hsl(232, 22%, 14%)", border: "1px solid hsl(232, 15%, 22%)", borderRadius: 8, color: "#e0e0e0" };

const Analytics = () => {
  const { user } = useAuth();

  const { data: scans = [] } = useQuery({
    queryKey: ["analyticsScans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("scans")
        .select("*, projects!inner(project_name, user_id)")
        .order("scan_date", { ascending: true });
      return (data ?? []).filter((s: any) => s.projects?.user_id === user!.id);
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

  const { data: openIssues = 0 } = useQuery({
    queryKey: ["openIssuesCount"],
    queryFn: async () => {
      const { count } = await supabase
        .from("ai_suggestions")
        .select("*, scans!inner(project_id, projects!inner(user_id))", { count: "exact", head: true })
        .eq("status", "pending");
      return count ?? 0;
    },
    enabled: !!user,
  });

  const avgQuality = scans.length > 0 ? Math.round(scans.reduce((a: number, s: any) => a + (s.code_quality_score ?? 0), 0) / scans.length) : 0;
  const avgSecurity = scans.length > 0 ? Math.round(scans.reduce((a: number, s: any) => a + (s.security_score ?? 0), 0) / scans.length) : 0;

  // Build trend data from real scans
  const trendData = scans.map((s: any) => ({
    date: s.scan_date ? new Date(s.scan_date).toLocaleDateString("en", { month: "short", day: "numeric" }) : "–",
    quality: s.code_quality_score ?? 0,
    security: s.security_score ?? 0,
  }));

  // Top projects by latest scan score
  const projectScores = projects.map((p: any) => {
    const projectScans = scans.filter((s: any) => s.project_id === p.id);
    const latest = projectScans[projectScans.length - 1];
    return { name: p.project_name, score: latest?.security_score ?? 0 };
  }).sort((a: any, b: any) => b.score - a.score);

  return (
    <div className="space-y-8 animate-slide-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Analytics 📈</h1>
        <p className="text-muted-foreground mt-1">Track your code health trends over time.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Avg. Quality Score" value={`${avgQuality}%`} icon={<TrendingUp className="w-4 h-4" />} />
        <StatCard title="Security Score" value={`${avgSecurity}%`} icon={<Shield className="w-4 h-4" />} />
        <StatCard title="Open Issues" value={openIssues} icon={<Bug className="w-4 h-4" />} />
        <StatCard title="Scans Performed" value={scans.length} icon={<Zap className="w-4 h-4" />} />
      </div>

      {trendData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Quality & Security Trends</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gQuality" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217, 90%, 64%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(217, 90%, 64%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSecurity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(155, 65%, 55%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(155, 65%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(232, 15%, 22%)" />
              <XAxis dataKey="date" tick={{ fill: "hsl(220, 8%, 65%)", fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: "hsl(220, 8%, 65%)", fontSize: 11 }} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="quality" stroke="hsl(217, 90%, 64%)" fill="url(#gQuality)" strokeWidth={2} />
              <Area type="monotone" dataKey="security" stroke="hsl(155, 65%, 55%)" fill="url(#gSecurity)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="w-2.5 h-2.5 rounded-full bg-primary" /> Quality</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="w-2.5 h-2.5 rounded-full bg-accent" /> Security</div>
          </div>
        </div>
      )}

      {projectScores.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Top Projects ⚡</h3>
          <div className="space-y-3">
            {projectScores.map((p: any, i: number) => (
              <div key={p.name} className="flex items-center gap-4">
                <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    <span className="text-sm text-foreground font-semibold">{p.score}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.score >= 90 ? "bg-success" : p.score >= 75 ? "bg-primary" : "bg-warning"}`} style={{ width: `${p.score}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
