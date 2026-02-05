import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
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
}

type UserRole = "admin" | "professional" | "client" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ClientProfile | null;
  role: UserRole;
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
  const [loading, setLoading] = useState(true);

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

    if (!error && data) {
      setProfile(data);
    } else {
      // Create profile if it doesn't exist
      const { data: newProfile } = await supabase
        .from("client_profiles")
        .insert({ user_id: userId, email: userEmail })
        .select()
        .single();
      
      if (newProfile) {
        setProfile(newProfile);
      }
    }
  };

  const fetchUserData = async (userId: string, userEmail?: string | null) => {
    // First, fetch the user's role
    const userRole = await fetchUserRole(userId);
    setRole(userRole);

    // Only fetch/create client profile if the user is a client (or has no role yet)
    if (userRole === "client" || userRole === null) {
      await fetchClientProfile(userId, userEmail);
    } else {
      // For professionals and admins, don't load/create client profile
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserData(user.id, user.email);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
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
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, signOut, refreshProfile }}>
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
