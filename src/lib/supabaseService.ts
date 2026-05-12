import { supabase } from "./supabase";

// ============================================================
// Types
// ============================================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
  city: string;
  joinDate: string;
  balance: number;
  isPro: boolean;
  stockHoldings: any[];
  forexHoldings: any[];
  cryptoHoldings: any[];
  financialAmbition: string;
  monthlySalary: number;
  fieldOfWork: string;
}

export interface TradeRecord {
  id: string;
  market: string;
  action: string;
  symbol: string;
  quantity: number;
  price: number;
  total_value: number;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  activity_type: string;
  details: string;
  created_at: string;
}

// ============================================================
// Default empty profile (used when not logged in)
// ============================================================

const defaultProfile: UserProfile = {
  id: "",
  name: "Guest",
  email: "",
  initials: "G",
  role: "User",
  city: "",
  joinDate: new Date().toISOString(),
  balance: 100000,
  isPro: false,
  stockHoldings: [],
  forexHoldings: [],
  cryptoHoldings: [],
  financialAmbition: "",
  monthlySalary: 0,
  fieldOfWork: "",
};

// ============================================================
// Helpers
// ============================================================

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

// ============================================================
// User Profile
// ============================================================

export const fetchCurrentUserProfile = async (): Promise<UserProfile> => {
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return defaultProfile;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (error || !profile) {
      console.warn("Could not fetch profile, using defaults:", error?.message);
      const displayName = authUser.email?.split("@")[0] || "User";
      return {
        ...defaultProfile,
        id: authUser.id,
        name: displayName,
        email: authUser.email || "",
        initials: getInitials(displayName),
      };
    }

    const displayName =
      profile.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.email?.split("@")[0] ||
      "User";

    return {
      id: authUser.id,
      name: displayName,
      email: authUser.email || "",
      initials: getInitials(displayName),
      role: profile.role || "User",
      city: profile.city || "",
      joinDate: profile.created_at || authUser.created_at || new Date().toISOString(),
      balance: profile.balance !== undefined ? profile.balance : 100000,
      isPro: profile.is_pro || false,
      stockHoldings: profile.stock_holdings || [],
      forexHoldings: profile.forex_holdings || [],
      cryptoHoldings: profile.crypto_holdings || [],
      financialAmbition: profile.financial_ambition || "",
      monthlySalary: profile.monthly_salary || 0,
      fieldOfWork: profile.field_of_work || "",
    };
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return defaultProfile;
  }
};

// ============================================================
// Realtime subscription for profile updates
// ============================================================

export const subscribeToProfile = (
  userId: string,
  callback: (profile: any) => void
) => {
  const channel = supabase
    .channel(`profile_${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

// ============================================================
// Portfolio Updates
// ============================================================

export const updatePortfolio = async (
  userId: string,
  newBalance: number,
  newStockHoldings?: any[],
  newForexHoldings?: any[],
  newCryptoHoldings?: any[]
) => {
  try {
    const updates: any = { balance: newBalance };
    if (newStockHoldings !== undefined) updates.stock_holdings = newStockHoldings;
    if (newForexHoldings !== undefined) updates.forex_holdings = newForexHoldings;
    if (newCryptoHoldings !== undefined) updates.crypto_holdings = newCryptoHoldings;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating portfolio:", err);
    return false;
  }
};

// ============================================================
// Trade History (NEW)
// ============================================================

export const logTrade = async (
  userId: string,
  market: "STOCK" | "FOREX" | "CRYPTO",
  action: "BUY" | "SELL",
  symbol: string,
  quantity: number,
  price: number
) => {
  try {
    const { error } = await supabase.from("trade_history").insert({
      user_id: userId,
      market,
      action,
      symbol,
      quantity,
      price,
      total_value: quantity * price,
    });

    if (error) {
      console.error("Error logging trade:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error logging trade:", err);
    return false;
  }
};

export const getTradeHistory = async (limit: number = 10): Promise<TradeRecord[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return [];

    const { data, error } = await supabase
      .from("trade_history")
      .select("*")
      .eq("user_id", session.session.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching trade history:", err);
    return [];
  }
};

// ============================================================
// Activity Logs
// ============================================================

export const logActivity = async (
  userId: string,
  activityType: string,
  details: string
) => {
  try {
    const { error } = await supabase.from("activity_logs").insert({
      user_id: userId,
      activity_type: activityType,
      details,
    });

    if (error) {
      console.error("Error logging activity:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error logging activity:", err);
    return false;
  }
};

export const getRecentActivity = async (limit: number = 5): Promise<ActivityLog[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return [];

    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", session.session.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching activity logs:", err);
    return [];
  }
};

// ============================================================
// AI Roadmap Profile Data
// ============================================================

export const saveRoadmapProfile = async (
  userId: string,
  ambition: string,
  monthlySalary: number,
  fieldOfWork: string
) => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        financial_ambition: ambition,
        monthly_salary: monthlySalary,
        field_of_work: fieldOfWork,
      })
      .eq("id", userId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error saving roadmap profile:", err);
    return false;
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: { name?: string; city?: string }
) => {
  try {
    const supabaseUpdates: any = {};
    if (updates.name !== undefined) supabaseUpdates.full_name = updates.name;
    if (updates.city !== undefined) supabaseUpdates.city = updates.city;

    const { error } = await supabase
      .from("profiles")
      .update(supabaseUpdates)
      .eq("id", userId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating user profile:", err);
    return false;
  }
};

