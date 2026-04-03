import { useLoginVendor } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function VendorLogin() {
  const [, setLocation] = useLocation();
  const { loginVendor } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLoginVendor();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        loginVendor(res.token, res.vendor);
        toast({ title: "Welcome back!", description: "Successfully logged in." });
        setLocation("/vendor/dashboard");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.response?.data?.error || "Login failed", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Vendor Portal</h1>
          <p className="text-muted-foreground">Manage your restaurant on ChowHub.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="restaurant@example.com" className="rounded-xl h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" className="rounded-xl h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Logging in..." : "Log in to Dashboard"}
            </Button>
          </form>
        </Form>

        <p className="mt-4 text-center">
          <Link href="/vendor/forgot-password" className="text-sm text-muted-foreground hover:text-primary hover:underline">Forgot password?</Link>
        </p>
        <div className="mt-3 text-center text-sm text-muted-foreground">
          Want to list your restaurant? <Link href="/vendor/register" className="text-primary font-bold hover:underline">Register here</Link>
        </div>
        <div className="mt-4 text-center">
           <Link href="/" className="text-sm font-medium hover:underline text-muted-foreground">Back to ChowHub</Link>
        </div>
      </div>
    </div>
  );
}
