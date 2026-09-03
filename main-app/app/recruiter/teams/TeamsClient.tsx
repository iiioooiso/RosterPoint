'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Copy, Plus, Users, ShieldAlert, GitMerge, Link, Trash, Power, PowerOff, ChevronDown, ChevronRight } from 'lucide-react'
import { createDepartment, generateInvitation, revokeInvitation, reactivateInvitation, deleteInvitation, createRoutingRule, deleteRoutingRule } from "@/app/actions/teams"
import { generateCompanyInvitation, revokeCompanyInvitation } from "@/app/actions/company-invites"
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from "@/lib/utils"

export function TeamsClient({ 
  initialDepartments, 
  initialInvitations, 
  initialCompanyInvitations, 
  initialRules, 
  openingDepartments = [], 
  activeCompanyId,
  companyInterviewers = []
}: any) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentTab, setCurrentTab] = useState(searchParams.get('tab') || 'departments')

  const [departments, setDepartments] = useState(initialDepartments)
  const [invitations, setInvitations] = useState(initialCompanyInvitations || [])
  const [departmentInvitations, setDepartmentInvitations] = useState(initialInvitations || [])
  const [rules, setRules] = useState(initialRules)

  // Sync state with props when Server Action revalidates
  useEffect(() => { setRules(initialRules) }, [initialRules])
  useEffect(() => { setDepartments(initialDepartments) }, [initialDepartments])
  useEffect(() => { setInvitations(initialCompanyInvitations || []) }, [initialCompanyInvitations])
  useEffect(() => { setDepartmentInvitations(initialInvitations || []) }, [initialInvitations])

  const [newDeptName, setNewDeptName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteScope, setInviteScope] = useState<'company' | 'department'>('company')
  const [selectedDeptId, setSelectedDeptId] = useState<string>('')
  const [expiresInDays, setExpiresInDays] = useState(1)
  const [generatedLink, setGeneratedLink] = useState('')
  const [showLegacy, setShowLegacy] = useState(false)
  const [newRule, setNewRule] = useState({ openingDept: '', targetDeptId: '', interviewerId: '' })
  const [isGenerating, setIsGenerating] = useState(false)

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
    }
  }

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRule.openingDept || !newRule.targetDeptId) return
    const conditions = [{ field: 'opening_department', operator: 'equals', value: newRule.openingDept }]
    const action: any = { type: 'route_to_department', department_id: newRule.targetDeptId }
    if (newRule.interviewerId) {
      action.interviewer_id = newRule.interviewerId
    }
    const name = `Route ${newRule.openingDept}`
    
    const res = await createRoutingRule(newRule.targetDeptId, name, conditions, action)
    if (res?.error) {
      alert(res.error)
    } else {
      setNewRule({ openingDept: '', targetDeptId: '', interviewerId: '' })
    }
  }

  const handleDeleteRule = async (id: string) => {
    await deleteRoutingRule(id)
  }

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inviteScope === 'department' && !selectedDeptId) {
      alert('Please select a department for the invitation.')
      return
    }

    setIsGenerating(true)
    try {
      const res = await generateCompanyInvitation(
        activeCompanyId, 
        inviteEmail || null, 
        expiresInDays,
        inviteScope === 'department' ? selectedDeptId : null
      )
      if (res?.error) {
        console.error(res.error)
        alert(res.error)
      } else if (res?.data) {
        const link = `${window.location.origin}/invite/company/${res.data.token}`
        setGeneratedLink(link)
        // Add department name if department scoped
        const deptObj = departments.find((d: any) => d.id === selectedDeptId)
        const newInvite = {
          ...res.data,
          department_name: inviteScope === 'department' ? deptObj?.name : null
        }
        setInvitations([newInvite, ...invitations])
        setInviteEmail('')
      }
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Failed to generate invitation')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink)
    alert("Link copied to clipboard!")
  }

  const copyInvite = (token: string) => {
    const link = `${window.location.origin}/invite/company/${token}`
    navigator.clipboard.writeText(link)
    alert("Link copied to clipboard!")
  }

  const handleAction = async (id: string, action: 'revoke' | 'reactivate' | 'delete') => {
    let res;
    if (action === 'revoke') res = await revokeCompanyInvitation(id)
    
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

  const handleDeptInviteAction = async (id: string, action: 'revoke' | 'reactivate' | 'delete') => {
    let res;
    if (action === 'revoke') res = await revokeInvitation(id)
    if (action === 'reactivate') res = await reactivateInvitation(id)
    if (action === 'delete') res = await deleteInvitation(id)
    
    if (res?.success) {
      if (action === 'delete') {
        setDepartmentInvitations(departmentInvitations.filter((i: any) => i.id !== id))
      } else {
        setDepartmentInvitations(departmentInvitations.map((i: any) => {
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
    setCurrentTab(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  // Filter interviewers eligible for the currently selected opening department in rule creation
  const eligibleRuleInterviewers = (companyInterviewers || []).filter((interviewer: any) => {
    if (!newRule.openingDept) return true;
    if (interviewer.isCompanyWide) return true;
    return (interviewer.departments || []).some(
      (d: string) => d.toLowerCase().trim() === newRule.openingDept.toLowerCase().trim()
    );
  });

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

      <TabsContent value="invitations" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invite Interviewers</CardTitle>
            <CardDescription>Generate secure invitation links for entire company membership or department-specific scoping.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateInvite} className="flex flex-col gap-4 mb-6 max-w-md">
              <div className="space-y-3">
                <Label>Invitation Scope</Label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input 
                      type="radio" 
                      name="inviteScope" 
                      value="company" 
                      checked={inviteScope === 'company'} 
                      onChange={() => setInviteScope('company')}
                      className="h-4 w-4 accent-primary"
                    />
                    Entire Company
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input 
                      type="radio" 
                      name="inviteScope" 
                      value="department" 
                      checked={inviteScope === 'department'} 
                      onChange={() => setInviteScope('department')}
                      className="h-4 w-4 accent-primary"
                    />
                    Department
                  </label>
                </div>
              </div>

              {inviteScope === 'department' && (
                <div className="space-y-2">
                  <Label htmlFor="deptSelect">Department</Label>
                  <select
                    id="deptSelect"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Department...</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Interviewers joining through this link will be scoped to this department.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Target Email (Optional)</Label>
                <Input id="inviteEmail" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="interviewer@company.com" />
                <p className="text-xs text-muted-foreground">If provided, only this email can accept the invitation.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresInDays">Expires In (days)</Label>
                <Input id="expiresInDays" type="number" min="1" value={expiresInDays} onChange={e => setExpiresInDays(parseInt(e.target.value) || 1)} />
              </div>

              <Button type="submit" className="w-full" disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Link'}
              </Button>
            </form>

            {generatedLink && (
              <div className="mb-8 p-4 border rounded-lg bg-card shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Generated Invitation Link</span>
                  <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8 gap-1.5 text-xs">
                    <Copy className="h-3.5 w-3.5" /> Copy Link
                  </Button>
                </div>
                <div className="p-2.5 bg-muted/50 rounded-md border font-mono text-xs break-all text-foreground select-all">
                  {generatedLink}
                </div>
                <p className="text-xs text-muted-foreground">Share this link with your interviewer. Joining grants membership context; candidate visibility is controlled via routing rules or manual assignment.</p>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Scope</TableHead>
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
                      {inv.department_name ? (
                        <Badge variant="secondary" className="font-normal text-xs">
                          Dept: {inv.department_name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-normal text-xs">
                          Entire Company
                        </Badge>
                      )}
                    </TableCell>
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
                {invitations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No invitations generated yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Collapsible Legacy Department Invitations Section */}
        <div className="pt-2">
          <button 
            type="button" 
            onClick={() => setShowLegacy(!showLegacy)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-1"
          >
            {showLegacy ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span>Department Invitations (Legacy)</span>
            <Badge variant="outline" className="text-xs font-normal text-muted-foreground ml-1">
              {departmentInvitations.length}
            </Badge>
          </button>

          {showLegacy && (
            <Card className="mt-3 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Department Invitations (Legacy History)</CardTitle>
                <CardDescription className="text-xs">
                  Invitations created under the legacy department-specific workflow. When accepted, these map into active department memberships.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                    {departmentInvitations.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.invited_email || 'Anyone with link'}</TableCell>
                        <TableCell>
                          {(!inv.invited_email && inv.joined_count > 0) ? (
                            <span className="text-green-600">{inv.joined_count} Joined</span>
                          ) : inv.accepted_at || inv.joined_count > 0 ? <span className="text-green-600">Accepted</span> : 
                           inv.revoked_at ? <span className="text-red-600">Revoked</span> : 
                           new Date(inv.expires_at) < new Date() ? <span className="text-red-600">Expired</span> : 
                           <span className="text-yellow-600">Pending</span>}
                        </TableCell>
                        <TableCell>{formatDate(inv.expires_at)}</TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => {
                            const link = `${window.location.origin}/invite/interviewer/${inv.token}`
                            navigator.clipboard.writeText(link)
                            alert("Link copied!")
                          }} title="Copy Link"><Link className="h-4 w-4" /></Button>
                          {!inv.accepted_at && (
                            inv.revoked_at ? 
                            <Button variant="ghost" size="sm" onClick={() => handleDeptInviteAction(inv.id, 'reactivate')} title="Reactivate"><Power className="h-4 w-4 text-green-600" /></Button> :
                            <Button variant="ghost" size="sm" onClick={() => handleDeptInviteAction(inv.id, 'revoke')} title="Deactivate"><PowerOff className="h-4 w-4 text-yellow-600" /></Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleDeptInviteAction(inv.id, 'delete')} title="Delete"><Trash className="h-4 w-4 text-red-600" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {departmentInvitations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-xs">
                          No legacy department invitations found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="routing" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Routing Rules</CardTitle>
            <CardDescription>Configure rules to route candidates to departments and assign eligible interviewers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleCreateRule} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="openingDept">IF Opening Department is</Label>
                <select
                  id="openingDept"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={newRule.openingDept}
                  onChange={(e) => setNewRule({ ...newRule, openingDept: e.target.value, interviewerId: '' })}
                  required
                >
                  <option value="" disabled>Select Opening Department...</option>
                  {openingDepartments.map((dept: string) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetDept">THEN Route to Team</Label>
                <select
                  id="targetDept"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

              <div className="space-y-2">
                <Label htmlFor="targetInterviewer">Assign to Interviewer (Optional)</Label>
                <select
                  id="targetInterviewer"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={newRule.interviewerId}
                  onChange={(e) => setNewRule({ ...newRule, interviewerId: e.target.value })}
                >
                  <option value="">No Interviewer (Team Pool)</option>
                  {eligibleRuleInterviewers.map((i: any) => (
                    <option key={i.id} value={i.id}>
                      {i.name} — {i.scopeLabel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3 flex justify-end">
                <Button type="submit" className="gap-2">
                  <Plus className="h-4 w-4" /> Create Rule
                </Button>
              </div>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Target Team & Interviewer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule: any) => {
                  const openingDept = rule.conditions?.[0]?.value || 'Unknown'
                  const targetDept = departments.find((d: any) => d.id === rule.department_id)?.name || 'Unknown Team'
                  const assignedInterviewer = companyInterviewers.find((i: any) => i.id === rule.action?.interviewer_id)
                  
                  return (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>Opening is <Badge variant="outline">{openingDept}</Badge></TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{targetDept}</span>
                          {assignedInterviewer && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              Assigned: <Badge variant="secondary" className="font-normal text-xs">{assignedInterviewer.name}</Badge>
                            </span>
                          )}
                        </div>
                      </TableCell>
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
