'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Copy, Plus, Users, ShieldAlert, GitMerge, Link, Trash, Power, PowerOff } from 'lucide-react'
import { createDepartment, generateInvitation, revokeInvitation, reactivateInvitation, deleteInvitation, createRoutingRule, deleteRoutingRule } from "@/app/actions/teams"
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function TeamsClient({ initialDepartments, initialInvitations, initialRules, openingDepartments = [] }: any) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'departments'

  const [departments, setDepartments] = useState(initialDepartments)
  const [invitations, setInvitations] = useState(initialInvitations)
  const [rules, setRules] = useState(initialRules)

  // Sync state with props when Server Action revalidates
  useEffect(() => { setRules(initialRules) }, [initialRules])
  useEffect(() => { setDepartments(initialDepartments) }, [initialDepartments])
  useEffect(() => { setInvitations(initialInvitations) }, [initialInvitations])

  const [newDeptName, setNewDeptName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteDept, setInviteDept] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(1)
  const [generatedLink, setGeneratedLink] = useState('')
  const [newRule, setNewRule] = useState({ openingDept: '', targetDeptId: '' })

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  }

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDeptName) return
    const res = await createDepartment(newDeptName)
    if (res.data) {
      setNewDeptName('')
      // State is synced via useEffect
    }
  }

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRule.openingDept || !newRule.targetDeptId) return
    const conditions = [{ field: 'opening_department', operator: 'equals', value: newRule.openingDept }]
    const action = { type: 'route_to_department', department_id: newRule.targetDeptId }
    const name = `Route ${newRule.openingDept}`
    
    await createRoutingRule(newRule.targetDeptId, name, conditions, action)
    setNewRule({ openingDept: '', targetDeptId: '' })
  }

  const handleDeleteRule = async (id: string) => {
    await deleteRoutingRule(id)
  }

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteDept) return
    const res = await generateInvitation(inviteDept, inviteEmail || null, expiresInDays)
    if (res.data) {
      const link = `${window.location.origin}/invite/interviewer/${res.data.token}`
      setGeneratedLink(link)
      setInvitations([res.data, ...invitations])
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink)
    alert("Link copied!")
  }

  const copyInvite = (token: string) => {
    const link = `${window.location.origin}/invite/interviewer/${token}`
    navigator.clipboard.writeText(link)
    alert("Link copied!")
  }

  const handleAction = async (id: string, action: 'revoke' | 'reactivate' | 'delete') => {
    let res;
    if (action === 'revoke') res = await revokeInvitation(id)
    if (action === 'reactivate') res = await reactivateInvitation(id)
    if (action === 'delete') res = await deleteInvitation(id)
    
    if (res?.success) {
      if (action === 'delete') {
        setInvitations(invitations.filter((i: any) => i.id !== id))
      } else {
        setInvitations(invitations.map((i: any) => {
          if (i.id === id) {
            return {
              ...i,
              revoked_at: action === 'revoke' ? new Date().toISOString() : null
            }
          }
          return i
        }))
      }
    }
  }

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList>
        <TabsTrigger value="departments" className="flex gap-2"><Users className="h-4 w-4" /> Departments</TabsTrigger>
        <TabsTrigger value="invitations" className="flex gap-2"><ShieldAlert className="h-4 w-4" /> Invitations</TabsTrigger>
        <TabsTrigger value="routing" className="flex gap-2"><GitMerge className="h-4 w-4" /> Routing Rules</TabsTrigger>
      </TabsList>
      
      <TabsContent value="departments" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Departments</CardTitle>
            <CardDescription>Manage your interviewer teams and departments.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDepartment} className="flex items-end gap-4 mb-6">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="deptName">Department Name</Label>
                <Input id="deptName" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="e.g. Engineering" />
              </div>
              <Button type="submit"><Plus className="mr-2 h-4 w-4" /> Create</Button>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept: any) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>{formatDate(dept.created_at)}</TableCell>
                  </TableRow>
                ))}
                {departments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-6">No departments found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="invitations" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Invite Interviewers</CardTitle>
            <CardDescription>Generate secure invitation links to assign interviewers to departments.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateInvite} className="flex flex-col gap-4 mb-6 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="inviteDept">Department</Label>
                <select 
                  id="inviteDept" 
                  value={inviteDept} 
                  onChange={e => setInviteDept(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="" disabled>Select department...</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Target Email (Optional)</Label>
                <Input id="inviteEmail" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="interviewer@company.com" />
                <p className="text-xs text-muted-foreground">If provided, only this email can accept the invitation.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresInDays">Expires In (days)</Label>
                <Input id="expiresInDays" type="number" min="1" value={expiresInDays} onChange={e => setExpiresInDays(parseInt(e.target.value) || 1)} />
              </div>
              <Button type="submit" className="w-full">Generate Link</Button>
            </form>

            {generatedLink && (
              <div className="mb-8 p-4 border rounded-md bg-muted/50 flex items-center justify-between gap-4">
                <code className="text-sm break-all">{generatedLink}</code>
                <Button variant="secondary" size="sm" onClick={copyToClipboard}><Copy className="h-4 w-4" /></Button>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.invited_email || 'Anyone with link'}</TableCell>
                    <TableCell>
                      {(!inv.invited_email && inv.joined_count > 0) ? (
                        <Dialog>
                            <DialogTrigger render={<Button variant="link" className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800" />}>
                              {inv.joined_count} Joined
                            </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Joined Interviewers</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2 mt-4 max-h-[60vh] overflow-y-auto">
                              {inv.joined_emails?.map((email: string, i: number) => (
                                <div key={i} className="px-3 py-2 bg-muted rounded-md text-sm border">
                                  {email}
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : inv.accepted_at || inv.joined_count > 0 ? <span className="text-green-600">Accepted</span> : 
                       inv.revoked_at ? <span className="text-red-600">Revoked</span> : 
                       new Date(inv.expires_at) < new Date() ? <span className="text-red-600">Expired</span> : 
                       <span className="text-yellow-600">Pending</span>}
                    </TableCell>
                    <TableCell>{formatDate(inv.expires_at)}</TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => copyInvite(inv.token)} title="Copy Link"><Link className="h-4 w-4" /></Button>
                      {!inv.accepted_at && (
                        inv.revoked_at ? 
                        <Button variant="ghost" size="sm" onClick={() => handleAction(inv.id, 'reactivate')} title="Reactivate"><Power className="h-4 w-4 text-green-600" /></Button> :
                        <Button variant="ghost" size="sm" onClick={() => handleAction(inv.id, 'revoke')} title="Deactivate"><PowerOff className="h-4 w-4 text-yellow-600" /></Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleAction(inv.id, 'delete')} title="Delete"><Trash className="h-4 w-4 text-red-600" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="routing" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Routing Rules</CardTitle>
            <CardDescription>Configure rules to route candidates to the appropriate departments automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleCreateRule} className="flex gap-4 items-end">
              <div className="space-y-2 flex-1">
                <Label htmlFor="openingDept">IF Opening Department is</Label>
                <select
                  id="openingDept"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newRule.openingDept}
                  onChange={(e) => setNewRule({ ...newRule, openingDept: e.target.value })}
                  required
                >
                  <option value="" disabled>Select Opening Department...</option>
                  {openingDepartments.map((dept: string) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="targetDept">THEN Assign to</Label>
                <select
                  id="targetDept"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newRule.targetDeptId}
                  onChange={(e) => setNewRule({ ...newRule, targetDeptId: e.target.value })}
                  required
                >
                  <option value="" disabled>Select Interview Team...</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="gap-2">
                <Plus className="h-4 w-4" /> Create Rule
              </Button>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Target Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule: any) => {
                  const openingDept = rule.conditions?.[0]?.value || 'Unknown'
                  const targetDept = departments.find((d: any) => d.id === rule.department_id)?.name || 'Unknown Team'
                  return (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>Opening is <Badge variant="outline">{openingDept}</Badge></TableCell>
                      <TableCell>{targetDept}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)} title="Delete Rule">
                          <Trash className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {rules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No routing rules configured. Create one above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
