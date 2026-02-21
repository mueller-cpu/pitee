"use client";

import { ReactNode } from "react";
import PageContainer from "./PageContainer";
import BottomNav from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <>
      <PageContainer>{children}</PageContainer>
      <BottomNav />
    </>
  );
}
