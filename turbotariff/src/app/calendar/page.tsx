'use client';

import React from 'react';
import { CalendarModule } from '@/components/dashboard/CalendarModule';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function CalendarPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <CalendarModule />
      </div>
    </DashboardLayout>
  );
}