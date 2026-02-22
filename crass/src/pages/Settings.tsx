import { useState } from "react";
import { User, Mail, FolderOpen, Bell, LogOut, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("users").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: projectCount = 0 } = useQuery({
    queryKey: ["projectCount"],
    queryFn: async () => {
      const { count } = await supabase.from("projects").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      return count ?? 0;
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="space-y-8 animate-slide-in max-w-2xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Settings ⚙️</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and preferences.</p>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center glow-primary">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-foreground font-semibold">{profile?.full_name ?? "User"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email ?? user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Full Name</label>
            <Input defaultValue={profile?.full_name ?? ""} className="bg-secondary border-border text-foreground" readOnly />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
            <Input defaultValue={profile?.email ?? user?.email ?? ""} className="bg-secondary border-border text-foreground" readOnly />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
          <FolderOpen className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{projectCount} projects scanned</span>
        </div>
      </div>

      <div className="glass-card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground">Preferences</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-foreground">Push Notifications</p>
              <p className="text-xs text-muted-foreground">Get notified about scan results</p>
            </div>
          </div>
          <Switch checked={notifications} onCheckedChange={setNotifications} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-foreground">Email Alerts</p>
              <p className="text-xs text-muted-foreground">Critical vulnerability alerts via email</p>
            </div>
          </div>
          <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
        </div>
      </div>

      <div className="glass-card p-6 space-y-3">
        <h2 className="text-sm font-semibold text-foreground mb-2">Account</h2>
        <Button variant="outline" className="w-full justify-start gap-3 border-border hover:bg-secondary text-foreground">
          <CreditCard className="w-4 h-4 text-muted-foreground" /> Manage Subscription
        </Button>
        <Button variant="outline" className="w-full justify-start gap-3 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> Log Out
        </Button>
      </div>
    </div>
  );
};

export default Settings;
