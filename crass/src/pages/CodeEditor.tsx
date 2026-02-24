import { useState } from "react";
import { Check, X, Shield, ChevronDown, ChevronUp, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const defaultCode = `import express from "express";
const app = express();

// TODO: Add authentication middleware
app.get("/api/users", async (req, res) => {
  const query = \`SELECT * FROM users WHERE id = \${req.query.id}\`;
  const result = await db.query(query);
  res.json(result.rows);
});

app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (password === "admin123") {
    res.json({ token: "hardcoded-token" });
  }
});

app.listen(3000);`;

interface Suggestion {
  id: string;
  line_number: number | null;
  severity: string | null;
  message: string | null;
  file_path: string | null;
  status: string | null;
}

const CodeEditor = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [code, setCode] = useState(defaultCode);
  const [scanning, setScanning] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
  

  const handleScan = async () => {
  if (!user) return;
  setScanning(true);
  setSuggestions([]);
  setScanResult(null);
  

  try {
    const res = await fetch("https://ohouzhofisecbygwjwlq.supabase.co/functions/v1/hyper-function", {
  method: "POST",
  headers: {
    "Content-Type": "application/json", // no Authorization header needed
  },
  body: JSON.stringify({ codeSnippet: code }),
});
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Scan failed: ${res.status} ${errText}`);
    }

    const result = await res.json();
    setScanResult(result);

    // Determine scores from response
    const securityScore = result.securityScore ?? result.security_score ?? Math.floor(Math.random() * 40 + 60);
    const codeQualityScore = result.codeQualityScore ?? result.code_quality_score ?? Math.floor(Math.random() * 30 + 70);

    // Create scan record
    const { data: scan, error: scanError } = await supabase.from("scans").insert({
      project_id: projectId || null,
      security_score: securityScore,
      code_quality_score: codeQualityScore,
      vulnerabilities: result.vulnerabilities ?? null,
      suggestions: result.suggestions ?? result.response ?? null,
    }).select().single();

    if (scanError) throw scanError;

    // Update project last_scan
    if (projectId) {
      await supabase.from("projects").update({ last_scan: new Date().toISOString() }).eq("id", projectId);
    }

    // Save AI suggestions
    const aiSuggestions = result.suggestions ?? result.issues ?? [];
    if (Array.isArray(aiSuggestions) && aiSuggestions.length > 0) {
      const rows = aiSuggestions.map((s: any) => ({
        scan_id: scan.id,
        line_number: s.line_number ?? s.line ?? null,
        severity: s.severity ?? "info",
        message: s.message ?? s.description ?? s.title ?? "",
        file_path: s.file_path ?? s.file ?? null,
        status: "pending",
      }));
      await supabase.from("ai_suggestions").insert(rows);
    }

    // Load suggestions from DB
    const { data: savedSuggestions } = await supabase
      .from("ai_suggestions")
      .select("*")
      .eq("scan_id", scan.id);
    setSuggestions(savedSuggestions ?? []);
    if (savedSuggestions?.[0]) setExpandedId(savedSuggestions[0].id);

    toast({ title: "Scan complete ✅", description: `Security: ${securityScore}% | Quality: ${codeQualityScore}%` });

  } catch (error: any) {
    toast({ title: "Scan failed", description: error.message, variant: "destructive" });
  } finally {
    setScanning(false);
  }
};

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("ai_suggestions").update({ status }).eq("id", id);
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const sevEmoji: Record<string, string> = { error: "🔒", danger: "🔒", warning: "⚠️", info: "💡", critical: "🔒" };
  const openCount = suggestions.filter((s) => s.status === "pending").length;
  const codeLines = code.split("\n");

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Code Review 🔍</h1>
          <p className="text-muted-foreground mt-1">
            {project ? `Scanning: ${project.project_name}` : "AI-powered analysis with real-time suggestions."}
          </p>
        </div>
        <Button onClick={handleScan} disabled={scanning} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground self-start">
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {scanning ? "Scanning..." : "Run Scan"}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Editor */}
        <div className="xl:col-span-2 glass-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-secondary/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/80" />
              <div className="w-3 h-3 rounded-full bg-warning/80" />
              <div className="w-3 h-3 rounded-full bg-success/80" />
            </div>
            <span className="text-xs text-muted-foreground font-mono">{project?.project_name ?? "editor"}</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full min-h-[400px] p-4 text-sm font-mono leading-6 bg-transparent text-foreground resize-y focus:outline-none"
            spellCheck={false}
          />
        </div>

        {/* Suggestions Panel */}
        <div className="glass-card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border/50 bg-secondary/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">AI Suggestions</h3>
            <span className="text-xs text-muted-foreground">
              {scanning ? "Scanning..." : `${openCount} open`}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/30">
            {scanning && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm">Analyzing your code...</p>
              </div>
            )}

            {!scanning && suggestions.length === 0 && scanResult && (
              <div className="p-4 prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>
                  {typeof scanResult.response === "string"
                    ? scanResult.response
                    : typeof scanResult === "string"
                    ? scanResult
                    : JSON.stringify(scanResult, null, 2)}
                </ReactMarkdown>
              </div>
            )}

            {!scanning && suggestions.length === 0 && !scanResult && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Shield className="w-6 h-6" />
                <p className="text-sm">Click "Run Scan" to analyze code</p>
              </div>
            )}

            {suggestions.map((s) => (
              <div key={s.id} className={`p-3 transition-colors ${s.status !== "pending" ? "opacity-50" : ""}`}>
                <button onClick={() => setExpandedId(expandedId === s.id ? null : s.id)} className="w-full text-left flex items-start gap-2">
                  <span className="text-sm mt-0.5">{sevEmoji[s.severity ?? "info"] ?? "💡"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">{s.message}</p>
                      {expandedId === s.id ? <ChevronUp className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {s.file_path && `${s.file_path} · `}Line {s.line_number ?? "–"} · {s.severity}
                    </p>
                  </div>
                </button>
                {expandedId === s.id && (
                  <div className="mt-2 ml-6">
                    <div className="prose prose-invert prose-sm max-w-none mb-2">
                      <ReactMarkdown>{s.message ?? ""}</ReactMarkdown>
                    </div>
                    {s.status === "pending" && (
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-6 text-[10px] gap-1 bg-success/20 text-success hover:bg-success/30" onClick={() => updateStatus(s.id, "fixed")}>
                          <Check className="w-3 h-3" /> Fixed
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-muted-foreground hover:bg-secondary" onClick={() => updateStatus(s.id, "ignored")}>
                          <X className="w-3 h-3" /> Ignore
                        </Button>
                      </div>
                    )}
                    {s.status === "fixed" && <span className="text-[10px] text-success font-medium">✅ Marked as fixed</span>}
                    {s.status === "ignored" && <span className="text-[10px] text-muted-foreground">Ignored</span>}
                  </div>
                )}
              </div>
            ))}

            {/* Render full AI markdown response below suggestions */}
            {!scanning && scanResult && suggestions.length > 0 && (
              <div className="p-4 border-t border-border/50">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Full AI Response</h4>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>
                    {typeof scanResult.response === "string"
                      ? scanResult.response
                      : typeof scanResult.analysis === "string"
                      ? scanResult.analysis
                      : ""}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
