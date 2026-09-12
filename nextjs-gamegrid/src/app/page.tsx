'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { HomeDashboardView } from '@/components/views/HomeDashboardView'
import { ConfigNotice } from '@/components/ui/ConfigNotice'

export default function HomePage() {
  return (
    <MainLayout currentView="home-dashboard">
      <ConfigNotice />
      <HomeDashboardView />
    </MainLayout>
  )
}
