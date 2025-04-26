'use client';

// This dashboard layout is now empty as we're using the main DashboardLayout component
// from src/components/layout/DashboardLayout.tsx for all pages including dashboard

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 