import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function ForgotPassword() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
      toast({ title: "Check your email", description: data.message });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-20 max-w-sm">
        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl mb-2" style={{ fontFamily: 'var(--app-font-display)' }}>Check your email</h1>
            <p className="text-sm text-muted-foreground mb-6">
              If an account exists with <strong>{email}</strong>, we've sent a password reset link.
            </p>
            <Link href="/login" className="text-primary font-medium hover:underline text-sm">
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
              <h1 className="text-2xl mb-1" style={{ fontFamily: 'var(--app-font-display)' }}>Forgot password?</h1>
              <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-10 mt-1"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-10 font-semibold" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </>
        )}
      </div>
    </MainLayout>
  );
}
