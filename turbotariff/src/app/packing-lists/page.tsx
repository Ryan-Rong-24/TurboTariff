'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TariffFormModule } from '@/components/dashboard/TariffFormModule';

export default function PackingListsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <TariffFormModule />
      </div>
    </DashboardLayout>
  );
}