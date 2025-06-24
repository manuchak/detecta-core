
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const refetchRole = async () => {
    try {
      // Force refresh the session to get updated user data
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in refetchRole:', error);
      throw error;
    }
  };

  return {
    ...context,
    refetchRole
  };
};
