import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLoginUser } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { loginUser } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLoginUser();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        loginUser(res.token, res.user);
        toast({ title: "Welcome back!", description: "Successfully logged in." });
        setLocation("/");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.response?.data?.error || "Login failed", variant: "destructive" });
      }
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-20 max-w-md">
        <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Log in to manage your reservations and saved places.</p>
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
                      <Input placeholder="you@example.com" className="rounded-xl h-12" {...field} />
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

              <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Logging in..." : "Log in"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account? <Link href="/register" className="text-primary font-bold hover:underline">Sign up</Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
