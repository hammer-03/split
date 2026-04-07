"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"

interface Friend {
  id: string
  name: string
  email: string
  avatar?: string
  balance: number
  status: 'accepted' | 'pending'
}
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { UserPlus, Search, ArrowUpRight, ArrowDownLeft, Check, X, Mail } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default function FriendsPage() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([])
  const [sentRequests, setSentRequests] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [addFriendEmail, setAddFriendEmail] = useState("")
  const [isAddingFriend, setIsAddingFriend] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchFriends()
  }, [])

  const fetchFriends = async () => {
    try {
      setIsLoading(true)
      const data = await api.getFriends()
      // Map User[] to Friend[] if necessary, or just use as is since Friend type seems loose
      const mappedFriends = (data.friends || []).map((f: any) => ({
        id: f._id,
        name: f.name,
        email: f.email,
        avatar: f.avatar,
        balance: 0, // Not provided directly by getFriends
        status: 'accepted' as const
      }));
      setFriends(mappedFriends)
      setPendingRequests([])
      setSentRequests([])
    } catch (err) {
      console.error("Failed to fetch friends:", err)
      // Mock data for demo
      setFriends([
        {
          id: "1",
          name: "Alex Johnson",
          email: "alex@example.com",
          avatar: "",
          balance: 45.50,
          status: "accepted"
        },
        {
          id: "2",
          name: "Sarah Miller",
          email: "sarah@example.com",
          avatar: "",
          balance: -23.00,
          status: "accepted"
        },
        {
          id: "3",
          name: "Mike Chen",
          email: "mike@example.com",
          avatar: "",
          balance: 0,
          status: "accepted"
        },
      ])
      setPendingRequests([
        {
          id: "4",
          name: "Emily Davis",
          email: "emily@example.com",
          avatar: "",
          balance: 0,
          status: "pending"
        }
      ])
      setSentRequests([
        {
          id: "5",
          name: "Chris Wilson",
          email: "chris@example.com",
          avatar: "",
          balance: 0,
          status: "pending"
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFriend = async () => {
    if (!addFriendEmail.trim()) return
    
    setIsAddingFriend(true)
    setError("")
    
    try {
      // 1. Search for user by email
      const searchRes = await api.searchUsers(addFriendEmail);
      const userFound = searchRes.users.find(u => u.email.toLowerCase() === addFriendEmail.toLowerCase());
      
      if (!userFound) {
        throw new Error("User with that email not found");
      }

      // 2. Add friend by ID
      await api.addFriend(userFound._id)
      
      setAddFriendEmail("")
      setIsDialogOpen(false)
      fetchFriends()
    } catch (err: any) {
      setError(err.message || "Failed to add friend")
    } finally {
      setIsAddingFriend(false)
    }
  }

  const handleAcceptRequest = async (friendId: string) => {
    try {
      // Backend doesn't support accept, addFriend is synchronous
      await api.addFriend(friendId)
      fetchFriends()
    } catch (err) {
      console.error("Failed to accept request:", err)
    }
  }

  const handleRejectRequest = async (friendId: string) => {
    try {
      await api.removeFriend(friendId);
      fetchFriends()
    } catch (err) {
      console.error("Failed to reject request:", err)
    }
  }

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        breadcrumbs={[{ label: 'Friends' }]}
      />

      <div className="container max-w-6xl py-4 px-4 md:py-8 md:px-6 space-y-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Friend
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Friend</DialogTitle>
              <DialogDescription>
                Enter your friend&apos;s email address to send them a friend request.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="friend@example.com"
                  type="email"
                  value={addFriendEmail}
                  onChange={(e) => setAddFriendEmail(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFriend} disabled={isAddingFriend}>
                {isAddingFriend ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Send Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All Friends
            {friends.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {friends.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent
            {sentRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {sentRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {filteredFriends.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-10 md:py-16">
                <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No friends yet</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Add friends to start splitting expenses with them.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredFriends.map((friend) => (
                <Card key={friend.id} className="glass-card hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(friend.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{friend.name}</h3>
                          <p className="text-sm text-muted-foreground">{friend.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      {friend.balance === 0 ? (
                        <p className="text-sm text-muted-foreground">All settled up</p>
                      ) : friend.balance > 0 ? (
                        <div className="flex items-center gap-2 text-emerald-500">
                          <ArrowDownLeft className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Owes you {formatCurrency(friend.balance)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-rose-500">
                          <ArrowUpRight className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            You owe {formatCurrency(friend.balance)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Check className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No pending requests</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  You don&apos;t have any pending friend requests.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(request.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{request.name}</h3>
                        <p className="text-sm text-muted-foreground">{request.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAcceptRequest(request.id)}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          {sentRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No sent requests</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  You haven&apos;t sent any friend requests yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sentRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(request.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{request.name}</h3>
                        <p className="text-sm text-muted-foreground">{request.email}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </div>
  )
}



