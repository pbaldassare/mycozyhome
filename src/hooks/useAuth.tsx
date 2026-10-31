import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ClientProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  is_blocked?: boolean;
  blocked_reason?: string | null;
}

type UserRole = "admin" | "professional" | "client" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ClientProfile | null;
  role: UserRole;
  isBlocked: boolean;
  blockedReason: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [roleLoadedFor, setRoleLoadedFor] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    
    return (data?.role as UserRole) || null;
  };

  const fetchClientProfile = async (userId: string, userEmail?: string | null) => {
    const { data, error } = await supabase
      .from("client_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Il profilo lo crea il DB alla registrazione (o join_as_client).
    if (!error && data) {
      setProfile(data);
      setIsBlocked(!!data.is_blocked);
      setBlockedReason(data.blocked_reason ?? null);
    } else {
      setProfile(null);
    }
  };

  const fetchProfessionalBlockStatus = async (userId: string) => {
    const { data } = await supabase
      .from("professional_private")
      .select("is_blocked, blocked_reason")
      .eq("user_id", userId)
      .maybeSingle();

    setIsBlocked(!!data?.is_blocked);
    setBlockedReason(data?.blocked_reason ?? null);
  };

  const fetchUserData = async (userId: string, userEmail?: string | null) => {
    const userRole = await fetchUserRole(userId);
    setRole(userRole);

    if (userRole === "client") {
      await fetchClientProfile(userId, userEmail);
    } else if (userRole === "professional") {
      setProfile(null);
      await fetchProfessionalBlockStatus(userId);
    } else {
      setProfile(null);
      setIsBlocked(false);
      setBlockedReason(null);
    }
    setRoleLoadedFor(userId);
  };

  /** Dati di un utente non devono restare sul dispositivo dopo il logout. */
  const clearLocalData = () => {
    queryClient.clear();
    if ("caches" in window) {
      caches.delete("supabase-cache").catch(() => undefined);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserData(user.id, user.email);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearLocalData();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setIsBlocked(false);
    setBlockedReason(null);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id, session.user.email);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setIsBlocked(false);
          setBlockedReason(null);
          setRoleLoadedFor(null);
          if (event === "SIGNED_OUT") clearLocalData();
        }
        setAuthReady(true);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email);
      }
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Il caricamento finisce solo quando il ruolo dell'utente corrente è noto.
  const loading = !authReady || (!!user && roleLoadedFor !== user.id);

  return (
    <AuthContext.Provider value={{ user, session, profile, role, isBlocked, blockedReason, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
