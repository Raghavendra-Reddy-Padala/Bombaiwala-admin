import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground">
        <div className="text-2xl font-display font-bold">Bombaiwala</div>
        <div>
          <h1 className="text-5xl font-display font-extrabold leading-tight">
            Swad wahi jo,<br />Deewana bana de.
          </h1>
          <p className="mt-4 text-primary-foreground/80 max-w-sm">
            Admin console for Chaat & Juice. Track orders, manage menu, monitor sales — all in one place.
          </p>
        </div>
        <div className="text-xs text-primary-foreground/60">© Bombaiwala</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-3xl font-display font-bold">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">Admin access only.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Signing in…" : "Sign in"}</Button>
          <p className="text-xs text-muted-foreground">
            Add admins in Firebase Console → Authentication.
          </p>
        </form>
      </div>
    </div>
  );
}
