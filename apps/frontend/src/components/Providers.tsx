"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { CharacterProvider } from "@/contexts/CharacterContext";
import { RollHistoryProvider } from "@/contexts/RollHistoryContext";
import DiceRollerProvider from "@/contexts/dice-roller/provider";

// Create a client
const queryClient = new QueryClient();

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <CharacterProvider>
            <RollHistoryProvider>
              <DiceRollerProvider>{children}</DiceRollerProvider>
            </RollHistoryProvider>
          </CharacterProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
