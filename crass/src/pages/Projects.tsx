import { useState } from "react";
import { Upload, Github, FolderOpen, Trash2, Play, FileText, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Projects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, scans(id, security_score, code_quality_score, scan_date)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").insert({
        project_name: newName,
        github_url: githubUrl || null,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setNewName("");
      setGithubUrl("");
      setDialogOpen(false);
      toast({ title: "Project created ✅" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Project deleted" });
    },
  });

  const getProjectStatus = (p: any) => {
    const latestScan = p.scans?.[0];
    if (!latestScan) return "info" as const;
    const score = latestScan.security_score ?? 100;
    if (score >= 80) return "success" as const;
    if (score >= 60) return "warning" as const;
    return "danger" as const;
  };

  const filtered = projects.filter((p: any) =>
    p.project_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-slide-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Projects 💻</h1>
        <p className="text-muted-foreground mt-1">Upload and manage your code projects for scanning.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createProject.mutate(); }} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Project Name *</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="my-project" className="bg-secondary border-border text-foreground" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">GitHub URL (optional)</label>
                <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/user/repo" className="bg-secondary border-border text-foreground" />
              </div>
              <Button type="submit" disabled={createProject.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {createProject.isPending ? "Creating..." : "Create Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-foreground">Your Projects</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search projects..." className="pl-9 w-60 bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading projects...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No projects yet. Create one to get started!</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((project: any) => {
              const status = getProjectStatus(project);
              const latestScan = project.scans?.[0];
              return (
                <div key={project.id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <FolderOpen className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{project.project_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.last_scan ? `Last scan: ${new Date(project.last_scan).toLocaleDateString()}` : "No scans yet"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {latestScan && (
                      <StatusBadge status={status} label={`${latestScan.security_score ?? "–"}% security`} />
                    )}
                    <div className="flex gap-1.5">
                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1 text-xs" onClick={() => navigate(`/editor/${project.id}`)}>
                        <Play className="w-3 h-3" /> Scan
                      </Button>
                      {latestScan && (
                        <Button size="sm" variant="outline" className="border-border hover:bg-secondary gap-1 text-xs" onClick={() => navigate(`/report/${project.scans[0]?.id}`)}>
                          <FileText className="w-3 h-3" /> Report
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => deleteProject.mutate(project.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
