import { Download, Shield, Bug, Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

const severityConfig = {
  danger: { icon: <AlertTriangle className="w-3.5 h-3.5" />, className: "text-destructive" },
  error: { icon: <AlertTriangle className="w-3.5 h-3.5" />, className: "text-destructive" },
  critical: { icon: <AlertTriangle className="w-3.5 h-3.5" />, className: "text-destructive" },
  warning: { icon: <AlertTriangle className="w-3.5 h-3.5" />, className: "text-warning" },
  info: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, className: "text-info" },
};

const vulnColors = ["hsl(0, 72%, 55%)", "hsl(40, 92%, 55%)", "hsl(217, 90%, 64%)", "hsl(155, 65%, 55%)", "hsl(280, 65%, 60%)"];

const ScanReport = () => {
  const { scanId } = useParams();
  const { user } = useAuth();

  // Fetch latest scan if no scanId provided
  const { data: scan, isLoading } = useQuery({
    queryKey: ["scan", scanId],
    queryFn: async () => {
      let query = supabase.from("scans").select("*, projects!inner(project_name, user_id)");
      if (scanId) {
        query = query.eq("id", scanId);
      } else {
        query = query.order("scan_date", { ascending: false }).limit(1);
      }
      const { data, error } = await query;
      if (error) throw error;
      const filtered = (data ?? []).filter((s: any) => s.projects?.user_id === user!.id);
      return filtered[0] ?? null;
    },
    enabled: !!user,
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ["scanSuggestions", scan?.id],
    queryFn: async () => {
      const { data } = await supabase.from("ai_suggestions").select("*").eq("scan_id", scan!.id);
      return data ?? [];
    },
    enabled: !!scan?.id,
  });

  if (isLoading) return <div className="text-center text-muted-foreground py-12">Loading report...</div>;
  if (!scan) return <div className="text-center text-muted-foreground py-12">No scan data available. Run a scan first!</div>;

  const securityScore = scan.security_score ?? 0;
  const codeQuality = scan.code_quality_score ?? 0;
  const overall = Math.round((securityScore + codeQuality) / 2);

  // Group suggestions by severity
  const bySeverity: Record<string, typeof suggestions> = {};
  suggestions.forEach((s: any) => {
    const sev = s.severity ?? "info";
    if (!bySeverity[sev]) bySeverity[sev] = [];
    bySeverity[sev].push(s);
  });

  const vulnTypes = Object.entries(bySeverity).map(([name, items], i) => ({
    name,
    value: items.length,
    color: vulnColors[i % vulnColors.length],
  }));

  const sections = [
    { title: "Security Vulnerabilities", emoji: "🔒", icon: <Shield className="w-4 h-4" />, items: suggestions.filter((s: any) => ["danger", "error", "critical"].includes(s.severity)) },
    { title: "Warnings", emoji: "⚠️", icon: <Bug className="w-4 h-4" />, items: suggestions.filter((s: any) => s.severity === "warning") },
    { title: "Info & Suggestions", emoji: "💡", icon: <Lightbulb className="w-4 h-4" />, items: suggestions.filter((s: any) => s.severity === "info" || !["danger", "error", "critical", "warning"].includes(s.severity ?? "")) },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Scan Report 📋</h1>
          <p className="text-muted-foreground mt-1">
            Analysis for <span className="text-foreground font-medium">{scan.projects?.project_name ?? "Quick Scan"}</span>
            {scan.scan_date && <> · {new Date(scan.scan_date).toLocaleDateString()}</>}
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 self-start">
          <Download className="w-4 h-4" /> Download PDF
        </Button>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Security Score", value: securityScore },
          { label: "Code Quality", value: codeQuality },
          { label: "Overall Health", value: overall },
        ].map((metric) => (
          <div key={metric.label} className="glass-card p-5 text-center">
            <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
            <p className="text-4xl font-bold text-foreground">{metric.value}%</p>
            <div className="h-1.5 bg-secondary rounded-full mt-3 overflow-hidden">
              <div className={`h-full rounded-full ${metric.value >= 80 ? "bg-success" : metric.value >= 60 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${metric.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {vulnTypes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Issues by Severity</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={vulnTypes} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {vulnTypes.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(232, 22%, 14%)", border: "1px solid hsl(232, 15%, 22%)", borderRadius: 8, color: "#e0e0e0" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {vulnTypes.map((v) => (
                <div key={v.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.color }} /> {v.name} ({v.value})
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Issue Count by Severity</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vulnTypes}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(232, 15%, 22%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(220, 8%, 65%)", fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: "hsl(220, 8%, 65%)", fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(232, 22%, 14%)", border: "1px solid hsl(232, 15%, 22%)", borderRadius: 8, color: "#e0e0e0" }} />
                <Bar dataKey="value" fill="hsl(217, 90%, 64%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="glass-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border/50 bg-secondary/30 flex items-center gap-2">
              {section.icon}
              <h3 className="text-sm font-semibold text-foreground">{section.emoji} {section.title}</h3>
              <span className="ml-auto text-xs text-muted-foreground">{section.items.length} items</span>
            </div>
            <div className="divide-y divide-border/30">
              {section.items.map((item: any) => {
                const cfg = severityConfig[item.severity as keyof typeof severityConfig] ?? severityConfig.info;
                return (
                  <div key={item.id} className="px-5 py-3 flex items-center gap-3 hover:bg-secondary/20 transition-colors">
                    <span className={cfg.className}>{cfg.icon}</span>
                    <span className="text-sm text-foreground">{item.message}</span>
                    {item.line_number && <span className="text-xs text-muted-foreground ml-auto">Line {item.line_number}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScanReport;
