"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldLabel } from "@/components/ui/field"
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  CreditCard,
  Banknote,
  Check,
  Clock,
  X
} from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

interface Settlement {
  id: string
  amount: number
  paidBy: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  paidTo: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  method: "cash" | "bank_transfer" | "venmo" | "paypal" | "other"
  note?: string
  status: "pending" | "confirmed" | "rejected"
  createdAt: string
}

interface Balance {
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  amount: number
}

export default function SettlementsPage() {
  const { user } = useAuth()
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSettleDialogOpen, setIsSettleDialogOpen] = useState(false)
  const [selectedBalance, setSelectedBalance] = useState<Balance | null>(null)
  const [settleAmount, setSettleAmount] = useState("")
  const [settleMethod, setSettleMethod] = useState<string>("cash")
  const [settleNote, setSettleNote] = useState("")
  const [isSettling, setIsSettling] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [settlementsRes, balancesRes] = await Promise.all([
        api.getSettlements(),
        api.getBalances()
      ])
      
      const mappedSettlements = settlementsRes.settlements.map((s: any) => ({
        id: s._id,
        amount: s.amount,
        paidBy: {
          id: typeof s.fromUser === 'object' ? s.fromUser._id : s.fromUser,
          name: typeof s.fromUser === 'object' ? s.fromUser.name : 'Unknown',
          email: typeof s.fromUser === 'object' ? s.fromUser.email : '',
          avatar: typeof s.fromUser === 'object' ? s.fromUser.avatar : undefined
        },
        paidTo: {
          id: typeof s.toUser === 'object' ? s.toUser._id : s.toUser,
          name: typeof s.toUser === 'object' ? s.toUser.name : 'Unknown',
          email: typeof s.toUser === 'object' ? s.toUser.email : '',
          avatar: typeof s.toUser === 'object' ? s.toUser.avatar : undefined
        },
        method: s.method || 'cash',
        note: s.note,
        status: 'confirmed' as const, // Backend auto-confirms currently
        createdAt: s.createdAt || s.settledAt
      }))

      const mappedBalances = balancesRes.balances.map((b: any) => ({
        user: {
          id: b.userId,
          name: b.name,
          email: b.email,
          avatar: b.avatar
        },
        amount: b.balance
      }))

      setSettlements(mappedSettlements)
      setBalances(mappedBalances)
    } catch (err) {
      console.error("Failed to fetch data:", err)
      // Mock data for demo
      setBalances([
        {
          user: { id: "1", name: "Alex Johnson", email: "alex@example.com" },
          amount: 45.50
        },
        {
          user: { id: "2", name: "Sarah Miller", email: "sarah@example.com" },
          amount: -23.00
        },
        {
          user: { id: "3", name: "Mike Chen", email: "mike@example.com" },
          amount: 12.75
        }
      ])
      setSettlements([
        {
          id: "1",
          amount: 50.00,
          paidBy: { id: "1", name: "Alex Johnson", email: "alex@example.com" },
          paidTo: { id: "current", name: "You", email: "you@example.com" },
          method: "venmo",
          status: "confirmed",
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: "2",
          amount: 25.00,
          paidBy: { id: "current", name: "You", email: "you@example.com" },
          paidTo: { id: "2", name: "Sarah Miller", email: "sarah@example.com" },
          method: "cash",
          status: "pending",
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenSettle = (balance: Balance) => {
    setSelectedBalance(balance)
    setSettleAmount(Math.abs(balance.amount).toFixed(2))
    setIsSettleDialogOpen(true)
  }

  const handleSettle = async () => {
    if (!selectedBalance || !settleAmount) return

    setIsSettling(true)
    try {
      await api.createSettlement({
        toUser: selectedBalance.user.id,
        amount: parseFloat(settleAmount),
        note: settleNote
      })
      setIsSettleDialogOpen(false)
      setSettleAmount("")
      setSettleMethod("cash")
      setSettleNote("")
      fetchData()
    } catch (err) {
      console.error("Failed to settle:", err)
    } finally {
      setIsSettling(false)
    }
  }

  const handleConfirmSettlement = async (settlementId: string) => {
    // Settlements are auto-confirmed by the backend right now
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Math.abs(amount))
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />
      case "bank_transfer":
        return <CreditCard className="h-4 w-4" />
      default:
        return <Wallet className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Confirmed</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return null
    }
  }

  const totalOwed = balances.filter(b => b.amount > 0).reduce((sum, b) => sum + b.amount, 0)
  const totalOwing = balances.filter(b => b.amount < 0).reduce((sum, b) => sum + Math.abs(b.amount), 0)
  const netBalance = totalOwed - totalOwing

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        breadcrumbs={[{ label: 'Settlements' }]}
      />

      <div className="container max-w-6xl py-4 px-4 md:py-8 md:px-6 space-y-6">

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-card">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">You are owed</p>
                <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalOwed)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10">
                <ArrowUpRight className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">You owe</p>
                <p className="text-2xl font-bold text-rose-500">{formatCurrency(totalOwing)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${netBalance >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                <Wallet className={`h-5 w-5 ${netBalance >= 0 ? "text-emerald-500" : "text-rose-500"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net balance</p>
                <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {netBalance >= 0 ? "+" : "-"}{formatCurrency(netBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="balances" className="w-full">
        <TabsList>
          <TabsTrigger value="balances">Outstanding Balances</TabsTrigger>
          <TabsTrigger value="history">Settlement History</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="mt-6">
          {balances.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Check className="h-12 w-12 text-emerald-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">All settled up!</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  You don&apos;t have any outstanding balances with friends.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {balances.map((balance) => (
                <Card key={balance.user.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={balance.user.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(balance.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{balance.user.name}</h3>
                          <p className="text-sm text-muted-foreground">{balance.user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {balance.amount > 0 ? (
                            <div className="flex items-center gap-2 text-emerald-500">
                              <ArrowDownLeft className="h-4 w-4" />
                              <span className="font-semibold">{formatCurrency(balance.amount)}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-rose-500">
                              <ArrowUpRight className="h-4 w-4" />
                              <span className="font-semibold">{formatCurrency(balance.amount)}</span>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {balance.amount > 0 ? "owes you" : "you owe"}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => handleOpenSettle(balance)}>
                          Settle
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {settlements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No settlement history</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Your settlement history will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {settlements.map((settlement) => (
                <Card key={settlement.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          {getMethodIcon(settlement.method)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{settlement.paidBy.name}</span>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{settlement.paidTo.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(settlement.createdAt)} • {settlement.method.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">{formatCurrency(settlement.amount)}</span>
                        {getStatusBadge(settlement.status)}
                        {settlement.status === "pending" && settlement.paidTo.id === "current" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleConfirmSettlement(settlement.id)}
                          >
                            Confirm
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Settle Dialog */}
      <Dialog open={isSettleDialogOpen} onOpenChange={setIsSettleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Settlement</DialogTitle>
            <DialogDescription>
              Record a payment {selectedBalance?.amount && selectedBalance.amount > 0 
                ? `from ${selectedBalance?.user.name}` 
                : `to ${selectedBalance?.user.name}`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            <Field>
              <FieldLabel>Amount</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">?</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
            </Field>

            <Field>
              <FieldLabel>Payment Method</FieldLabel>
              <Select value={settleMethod} onValueChange={setSettleMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="venmo">Venmo</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Note (optional)</FieldLabel>
              <Input
                placeholder="Add a note..."
                value={settleNote}
                onChange={(e) => setSettleNote(e.target.value)}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSettle} disabled={isSettling}>
              {isSettling ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  )
}



