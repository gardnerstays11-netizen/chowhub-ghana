import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegisterUser } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6),
  city: z.string().min(2),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { loginUser } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegisterUser();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", city: "Accra" },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        loginUser(res.token, res.user);
        toast({ title: "Account created!", description: "Welcome to ChowHub." });
        setLocation("/");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.response?.data?.error || "Registration failed", variant: "destructive" });
      }
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold mb-2">Join ChowHub</h1>
            <p className="text-muted-foreground">Create an account to save your favorite spots and make reservations.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Kwame Mensah" className="rounded-xl h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+233..." className="rounded-xl h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="Accra">Accra</option>
                          <option value="Kumasi">Kumasi</option>
                          <option value="Takoradi">Takoradi</option>
                          <option value="Tamale">Tamale</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg mt-4" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Log in</Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
