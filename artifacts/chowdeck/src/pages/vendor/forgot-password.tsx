import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Mail } from "lucide-react";

export default function VendorForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/vendor/forgot-password", {
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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-lg max-w-md w-full">
        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-serif font-bold mb-2">Check your email</h1>
            <p className="text-sm text-muted-foreground mb-6">
              If a vendor account exists with <strong>{email}</strong>, we've sent a password reset link.
            </p>
            <Link href="/vendor/login" className="text-primary font-medium hover:underline text-sm">
              Back to Vendor Login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <Link href="/vendor/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
                <ArrowLeft className="w-4 h-4" /> Back to Vendor Login
              </Link>
              <h1 className="text-2xl font-serif font-bold mb-1">Forgot password?</h1>
              <p className="text-sm text-muted-foreground">Enter your vendor email and we'll send you a reset link.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="restaurant@example.com"
                  className="rounded-xl h-12 mt-1"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
