import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { loginSchema, signupSchema, SIGNUP_PASSWORD_HINT } from "@/lib/auth-schemas";
import { isProfessionalStorySeen } from "@/lib/onboarding-keys";

export default function ProfessionalAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if ((location.state as { signup?: boolean } | null)?.signup) {
      setIsLogin(false);
    }
  }, [location.state]);

  const redirectProfessionalAfterAuth = async (
    userId: string,
    profileCompleted?: boolean
  ) => {
    let completed = profileCompleted;
    if (completed === undefined) {
      const { data: prof } = await supabase
        .from("professionals")
        .select("profile_completed")
        .eq("user_id", userId)
        .maybeSingle();
      completed = prof?.profile_completed ?? false;
    }

    if (!isProfessionalStorySeen()) {
      navigate("/professional/tutorial", {
        state: completed ? { returnTo: "/professional" } : undefined,
      });
      return;
    }

    if (completed) {
      navigate("/professional");
    } else {
      navigate("/professional/onboarding/personal");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        const validated = loginSchema.parse({
          email: formData.email,
          password: formData.password,
        });

        const { data, error } = await supabase.auth.signInWithPassword({
          email: validated.email,
          password: validated.password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Credenziali non valide");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("Verifica la tua email prima di accedere");
          } else {
            toast.error(error.message);
          }
          return;
        }

        // Check user role from user_roles table
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();

        const role = roleData?.role;

        if (role === "professional") {
          const { data: prof } = await supabase
            .from("professionals")
            .select("profile_completed")
            .eq("user_id", data.user.id)
            .maybeSingle();

          toast.success("Accesso effettuato!");
          await redirectProfessionalAfterAuth(
            data.user.id,
            prof?.profile_completed ?? false
          );
        } else if (role === "admin") {
          toast.success("Accesso effettuato!");
          navigate("/admin");
        } else {
          // Not a professional - redirect to client area with message
          toast.info("Questo account non è registrato come professionista");
          navigate("/client");
        }
      } else {
        const validated = signupSchema.parse(formData);

        const { data: signUpData, error } = await supabase.auth.signUp({
          email: validated.email,
          password: validated.password,
          options: {
            emailRedirectTo: `${window.location.origin}/professional/dashboard`,
            data: {
              first_name: validated.firstName,
              last_name: validated.lastName,
              role: "professional",
              app: "mycozyhome",
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Questa email è già registrata");
          } else {
            toast.error(error.message);
          }
          return;
        }

        // Create professional profile in database
        if (signUpData.user) {
          const { error: profileError } = await supabase
            .from("professionals")
            .insert({
              user_id: signUpData.user.id,
              first_name: validated.firstName,
              last_name: validated.lastName,
              email: validated.email,
              phone: "",
              city: "",
              status: "pending",
            });

          if (profileError) {
            console.error("Error creating professional profile:", profileError);
          }
        }

        toast.success("Registrazione completata!");
        if (signUpData.user) {
          await redirectProfessionalAfterAuth(signUpData.user.id, false);
        } else {
          navigate("/professional/tutorial");
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            fieldErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4" />
          </div>
          <span className="font-display font-semibold">HomeServ Pro</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">
              {isLogin ? "Bentornato!" : "Diventa un Professionista"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? "Accedi al tuo account professionale"
                : "Registrati per offrire i tuoi servizi"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Mario"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="pl-9"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Cognome</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Rossi"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">{errors.lastName}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="mario.rossi@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-9"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
              {!isLogin && !errors.password && (
                <p className="text-xs text-muted-foreground">{SIGNUP_PASSWORD_HINT}</p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Conferma Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-9"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading
                ? "Caricamento..."
                : isLogin
                ? "Accedi"
                : "Registrati"}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isLogin ? "Non hai un account?" : "Hai già un account?"}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="ml-1 text-primary font-medium hover:underline"
              >
                {isLogin ? "Registrati" : "Accedi"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
