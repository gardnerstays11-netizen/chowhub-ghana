import { useLoginAdmin } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { loginAdmin } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLoginAdmin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        loginAdmin(res.token);
        toast({ title: "Admin Access Granted", description: "Successfully logged in." });
        setLocation("/admin/dashboard");
      },
      onError: (err: any) => {
        toast({ title: "Access Denied", description: err?.response?.data?.error || "Login failed", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4 border border-zinc-700">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-3xl font-sans font-bold text-white mb-2">System Admin</h1>
          <p className="text-zinc-400">Restricted access portal.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Admin Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@chowhub.com" className="bg-zinc-800 border-zinc-700 text-white rounded-xl h-12 focus-visible:ring-zinc-600" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" className="bg-zinc-800 border-zinc-700 text-white rounded-xl h-12 focus-visible:ring-zinc-600" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg bg-white text-zinc-950 hover:bg-zinc-200" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Authenticating..." : "Authorize"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
