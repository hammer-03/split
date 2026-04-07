"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, FileText, Sparkles, Check, AlertCircle } from "lucide-react"

interface ParsedReceipt {
  description: string
  amount: number
  category: string
  date: string | null
  merchant: string | null
  items: Array<{ name: string; quantity: number; price: number }>
  tax: number
  tip: number
  confidence: number
}

interface ReceiptScannerProps {
  onParsed: (data: ParsedReceipt) => void
}

export function ReceiptScanner({ onParsed }: ReceiptScannerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [receiptText, setReceiptText] = useState("")
  const [parsedData, setParsedData] = useState<ParsedReceipt | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleParseText = async () => {
    if (!receiptText.trim()) {
      setError("Please enter receipt text")
      return
    }

    setIsLoading(true)
    setError("")
    setParsedData(null)

    try {
      const response = await fetch("/api/parse-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: receiptText }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to parse receipt")
      }

      setParsedData(result.data)
    } catch (err: any) {
      setError(err.message || "Failed to parse receipt")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // For now, we'll read the file as text if it's a text file
    // In a full implementation, you'd use OCR for images
    if (file.type.startsWith("text/")) {
      const text = await file.text()
      setReceiptText(text)
    } else {
      setError("Please paste receipt text directly. Image OCR coming soon!")
    }
  }

  const handleUseData = () => {
    if (parsedData) {
      onParsed(parsedData)
      setIsOpen(false)
      setReceiptText("")
      setParsedData(null)
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      food_dining: "Food & Dining",
      transportation: "Transportation",
      entertainment: "Entertainment",
      utilities: "Utilities",
      shopping: "Shopping",
      travel: "Travel",
      healthcare: "Healthcare",
      other: "Other",
    }
    return labels[category] || category
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          Scan Receipt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Receipt Scanner
          </DialogTitle>
          <DialogDescription>
            Paste your receipt text and let AI extract the expense details
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">
              <FileText className="mr-2 h-4 w-4" />
              Paste Text
            </TabsTrigger>
            <TabsTrigger value="upload" disabled>
              <Camera className="mr-2 h-4 w-4" />
              Upload Image
              <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-4">
            <div className="space-y-4">
              <Textarea
                placeholder="Paste your receipt text here...

Example:
RESTAURANT NAME
123 Main St
Date: 01/15/2024

Burger          ?12.99
Fries            ?4.99
Drink            ?2.99
Subtotal        ?20.97
Tax              ?1.68
Tip              ?4.00
Total           ?26.65"
                value={receiptText}
                onChange={(e) => setReceiptText(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleParseText}
                disabled={isLoading || !receiptText.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Parse Receipt
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8">
              <Camera className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Image upload coming soon!<br />
                For now, please paste receipt text directly.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {parsedData && (
          <Card className="mt-4 border-primary/50 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  Parsed Data
                </CardTitle>
                <Badge variant="secondary">
                  {Math.round(parsedData.confidence * 100)}% confident
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description</span>
                  <span className="font-medium">{parsedData.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium text-primary">{formatCurrency(parsedData.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="outline">{getCategoryLabel(parsedData.category)}</Badge>
                </div>
                {parsedData.merchant && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Merchant</span>
                    <span className="font-medium">{parsedData.merchant}</span>
                  </div>
                )}
                {parsedData.date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{parsedData.date}</span>
                  </div>
                )}
                {parsedData.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{formatCurrency(parsedData.tax)}</span>
                  </div>
                )}
                {parsedData.tip > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tip</span>
                    <span className="font-medium">{formatCurrency(parsedData.tip)}</span>
                  </div>
                )}
              </div>

              {parsedData.items.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-2">Items</p>
                  <div className="space-y-1">
                    {parsedData.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.quantity}x {item.name}
                        </span>
                        <span>{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUseData} disabled={!parsedData}>
            Use This Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



