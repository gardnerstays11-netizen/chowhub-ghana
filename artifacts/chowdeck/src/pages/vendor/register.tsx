import { useRegisterVendor } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";

const registerSchema = z.object({
  businessName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6),
});

export default function VendorRegister() {
  const [, setLocation] = useLocation();
  const { loginVendor } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegisterVendor();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { businessName: "", email: "", phone: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        loginVendor(res.token, res.vendor);
        toast({ title: "Registration received!", description: "We will review your application soon." });
        setLocation("/vendor/dashboard");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.response?.data?.error || "Registration failed", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-lg max-w-xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Partner with ChowHub</h1>
          <p className="text-muted-foreground">Reach thousands of hungry diners across Ghana.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="The Golden Chopbar" className="rounded-xl h-12" {...field} />
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
                    <FormLabel>Business Email</FormLabel>
                    <FormControl>
                      <Input placeholder="hello@restaurant.com" className="rounded-xl h-12" {...field} />
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
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+233..." className="rounded-xl h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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

            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg bg-primary hover:bg-primary/90 text-primary-foreground mt-4" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Submitting..." : "Apply to Join"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already a partner? <Link href="/vendor/login" className="text-primary font-bold hover:underline">Log in</Link>
        </div>
        <div className="mt-4 text-center">
           <Link href="/" className="text-sm font-medium hover:underline text-muted-foreground">Back to ChowHub</Link>
        </div>
      </div>
    </div>
  );
}
