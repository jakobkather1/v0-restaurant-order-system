"use client"

import React from "react"
import { PushPermissionBanner } from "./push-permission-banner"

export function DashboardWrapper({ 
  restaurantId, 
  children 
}: { 
  restaurantId: number
  children: React.ReactNode 
}) {
  return (
    <div className="relative">
      <div className="sticky top-0 z-30 bg-gray-50">
        <PushPermissionBanner restaurantId={restaurantId} />
      </div>
      {children}
    </div>
  )
}
