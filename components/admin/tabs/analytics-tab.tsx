"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { TrendingUp, DollarSign, Receipt } from "lucide-react"
import type { Restaurant, MonthlyRevenue } from "@/lib/types"

interface AnalyticsTabProps {
  revenue: MonthlyRevenue[]
  restaurant: Restaurant
}

export function AnalyticsTab({ revenue, restaurant }: AnalyticsTabProps) {
  const chartData = revenue
    .map((r) => ({
      month: new Date(r.month).toLocaleDateString("de-DE", { month: "short" }),
      revenue: Number(r.total_revenue),
      orders: r.total_orders,
    }))
    .reverse()

  const currentMonth = revenue[0]
  const totalRevenue = revenue.reduce((sum, r) => sum + Number(r.total_revenue), 0)
  const totalOrders = revenue.reduce((sum, r) => sum + r.total_orders, 0)
  const totalFees = revenue.reduce((sum, r) => sum + Number(r.fee_amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Umsatz & Statistiken</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Übersicht der letzten 12 Monate (nach Stornierungen)</p>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktueller Monat</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {currentMonth ? Number(currentMonth.total_revenue).toLocaleString("de-DE") : 0} €
            </div>
            <p className="text-sm text-muted-foreground">{currentMonth?.total_orders || 0} Bestellungen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Netto-Umsatz (12 Monate)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalRevenue.toLocaleString("de-DE")} €</div>
            <p className="text-sm text-muted-foreground">{totalOrders} Bestellungen</p>
            <p className="text-xs text-muted-foreground mt-1">Stornierungen bereits abgezogen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plattform-Gebühren</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalFees.toLocaleString("de-DE")} €</div>
            <p className="text-sm text-muted-foreground">
              {restaurant.fee_type === "percentage"
                ? `${restaurant.fee_value}% vom Umsatz`
                : `${Number(restaurant.fee_value).toFixed(2)}€ / Monat`}
            </p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Umsatzverlauf</CardTitle>
            <CardDescription>Monatlicher Umsatz der letzten 12 Monate</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Umsatz (€)", color: restaurant.primary_color },
              }}
              className="h-[300px] w-full"
            >
              <BarChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill={restaurant.primary_color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <TrendingUp className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Noch keine Umsatzdaten vorhanden</p>
            <p className="text-sm">Daten werden nach der ersten abgeschlossenen Bestellung angezeigt</p>
          </CardContent>
        </Card>
      )}

      {revenue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monatsübersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Monat</TableHead>
                  <TableHead className="text-right">Bestellungen</TableHead>
                  <TableHead className="text-right">Umsatz</TableHead>
                  <TableHead className="text-right">Gebühren</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenue.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {new Date(r.month).toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right">{r.total_orders}</TableCell>
                    <TableCell className="text-right">{Number(r.total_revenue).toLocaleString("de-DE")} €</TableCell>
                    <TableCell className="text-right">{Number(r.fee_amount).toLocaleString("de-DE")} €</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
