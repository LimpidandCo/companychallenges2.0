'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui'
import { Input } from './input'
import { Button } from './button'
import { Spinner } from './spinner'
import { getAssignments } from '@/lib/actions/assignments'
import { getChallenges } from '@/lib/actions/challenges'
import { getClients } from '@/lib/actions/clients'
import { getAssignmentUsages } from '@/lib/actions/assignment-usages'

interface Client {
  id: string
  name: string
}

interface Challenge {
  id: string
  slug: string
  internal_name: string
  public_title: string | null
  client_id: string
}

interface Assignment {
  id: string
  slug: string
  internal_title: string
  public_title: string | null
}

interface LinkPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string, text: string) => void
}

/**
 * LinkPicker - Hierarchical link selection
 * 
 * Flow: Client → Challenge → Assignment
 * 
 * - Users first select a client (or skip to see all)
 * - Then select a challenge within that client
 * - Then see assignments in that challenge
 * - Can also link directly to challenges
 */
export function LinkPicker({ open, onClose, onSelect }: LinkPickerProps) {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Data
  const [clients, setClients] = useState<Client[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([])
  const [challengeAssignmentMap, setChallengeAssignmentMap] = useState<Map<string, Assignment[]>>(new Map())
  
  // Filters
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'assignments' | 'challenges'>('assignments')

  // Load data on open
  useEffect(() => {
    if (open) {
      loadData()
    } else {
      // Reset state when closed
      setSearch('')
      setSelectedClientId(null)
      setSelectedChallengeId(null)
      setActiveTab('assignments')
    }
  }, [open])

  // Load assignment usages when challenge is selected
  useEffect(() => {
    if (selectedChallengeId && !challengeAssignmentMap.has(selectedChallengeId)) {
      loadChallengeAssignments(selectedChallengeId)
    }
  }, [selectedChallengeId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [clientsResult, challengesResult, assignmentsResult] = await Promise.all([
        getClients(),
        getChallenges({ includeArchived: false }),
        getAssignments()
      ])

      if (clientsResult.success && clientsResult.data) {
        setClients(clientsResult.data)
      }

      if (challengesResult.success && challengesResult.data) {
        setChallenges(challengesResult.data.map(c => ({
          id: c.id,
          slug: c.slug,
          internal_name: c.internal_name,
          public_title: c.public_title,
          client_id: c.client_id
        })))
      }

      if (assignmentsResult.success && assignmentsResult.data) {
        setAllAssignments(assignmentsResult.data.map(a => ({
          id: a.id,
          slug: a.slug,
          internal_title: a.internal_title,
          public_title: a.public_title
        })))
      }
    } catch (err) {
      console.error('Error loading link picker data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadChallengeAssignments = async (challengeId: string) => {
    try {
      const result = await getAssignmentUsages(challengeId)
      if (result.success && result.data) {
        const assignments: Assignment[] = result.data.map(u => ({
          id: u.assignment.id,
          slug: u.assignment.slug,
          internal_title: u.assignment.internal_title,
          public_title: u.assignment.public_title
        }))
        setChallengeAssignmentMap(prev => new Map(prev).set(challengeId, assignments))
      }
    } catch (err) {
      console.error('Error loading challenge assignments:', err)
    }
  }

  // Filter challenges by selected client
  const filteredChallenges = useMemo(() => {
    let filtered = challenges
    if (selectedClientId) {
      filtered = filtered.filter(c => c.client_id === selectedClientId)
    }
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(c =>
        c.internal_name.toLowerCase().includes(searchLower) ||
        (c.public_title && c.public_title.toLowerCase().includes(searchLower)) ||
        c.slug.toLowerCase().includes(searchLower)
      )
    }
    return filtered
  }, [challenges, selectedClientId, search])

  // Get assignments for display
  const displayAssignments = useMemo(() => {
    if (selectedChallengeId) {
      // Show assignments in selected challenge
      const challengeAssignments = challengeAssignmentMap.get(selectedChallengeId) || []
      if (search.trim()) {
        const searchLower = search.toLowerCase()
        return challengeAssignments.filter(a =>
          a.internal_title.toLowerCase().includes(searchLower) ||
          (a.public_title && a.public_title.toLowerCase().includes(searchLower)) ||
          a.slug.toLowerCase().includes(searchLower)
        )
      }
      return challengeAssignments
    }
    
    // Show all assignments (fallback when no challenge selected)
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      return allAssignments.filter(a =>
        a.internal_title.toLowerCase().includes(searchLower) ||
        (a.public_title && a.public_title.toLowerCase().includes(searchLower)) ||
        a.slug.toLowerCase().includes(searchLower)
      )
    }
    return allAssignments.slice(0, 50) // Limit initial display
  }, [selectedChallengeId, challengeAssignmentMap, allAssignments, search])

  const handleSelectAssignment = (assignment: Assignment) => {
    // Use legacy URL format (no /a/ prefix)
    const url = `/${assignment.slug}`
    const text = assignment.public_title || assignment.internal_title
    onSelect(url, text)
    onClose()
  }

  const handleSelectChallenge = (challenge: Challenge) => {
    // Use legacy URL format (no /c/ prefix)
    const url = `/${challenge.slug}`
    const text = challenge.public_title || challenge.internal_name
    onSelect(url, text)
    onClose()
  }

  const handleClientChange = (clientId: string | null) => {
    setSelectedClientId(clientId)
    setSelectedChallengeId(null) // Reset challenge when client changes
  }

  const handleChallengeChange = (challengeId: string | null) => {
    setSelectedChallengeId(challengeId)
  }

  // Get client name by ID
  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Unknown'
  }

  // Get challenge name by ID
  const getChallengeName = (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId)
    return challenge?.public_title || challenge?.internal_name || 'Unknown'
  }

  const tabClass = (tab: typeof activeTab) =>
    `px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
      activeTab === tab
        ? 'bg-gray-900 text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Insert Link</DialogTitle>
      </DialogHeader>

      <div className="p-4 space-y-4 overflow-y-auto min-h-0 flex-1">
        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('assignments')} className={tabClass('assignments')}>
            Assignments
          </button>
          <button onClick={() => setActiveTab('challenges')} className={tabClass('challenges')}>
            Challenges
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <Spinner />
          </div>
        ) : activeTab === 'assignments' ? (
          <>
            {/* Hierarchical Filters for Assignments */}
            <div className="grid grid-cols-2 gap-3">
              {/* Client Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Client</label>
                <select
                  value={selectedClientId || ''}
                  onChange={(e) => handleClientChange(e.target.value || null)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  <option value="">All Clients</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              {/* Challenge Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Challenge</label>
                <select
                  value={selectedChallengeId || ''}
                  onChange={(e) => handleChallengeChange(e.target.value || null)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  disabled={filteredChallenges.length === 0}
                >
                  <option value="">
                    {selectedClientId ? 'Select Challenge...' : 'All Challenges'}
                  </option>
                  {filteredChallenges.map(challenge => (
                    <option key={challenge.id} value={challenge.id}>
                      {challenge.public_title || challenge.internal_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Breadcrumb showing current filter */}
            {(selectedClientId || selectedChallengeId) && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                <span>Showing:</span>
                {selectedClientId && (
                  <span className="font-medium text-gray-700">{getClientName(selectedClientId)}</span>
                )}
                {selectedChallengeId && (
                  <>
                    <span>→</span>
                    <span className="font-medium text-gray-700">{getChallengeName(selectedChallengeId)}</span>
                  </>
                )}
                <button
                  onClick={() => { setSelectedClientId(null); setSelectedChallengeId(null) }}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Search */}
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={selectedChallengeId ? "Search assignments in this challenge..." : "Search all assignments..."}
            />

            {/* Results */}
            <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {displayAssignments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {search ? 'No assignments found' : selectedChallengeId ? 'No assignments in this challenge' : 'Select a challenge to see its assignments'}
                </div>
              ) : (
                displayAssignments.map(assignment => (
                  <button
                    key={assignment.id}
                    onClick={() => handleSelectAssignment(assignment)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      A
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {assignment.public_title || assignment.internal_title}
                      </div>
                    </div>
                    <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      /{assignment.slug}
                    </code>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* Challenges Tab */}
            {/* Client Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Client</label>
              <select
                value={selectedClientId || ''}
                onChange={(e) => handleClientChange(e.target.value || null)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search challenges..."
            />

            {/* Results */}
            <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {filteredChallenges.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {search ? 'No challenges found' : 'No challenges available'}
                </div>
              ) : (
                filteredChallenges.map(challenge => (
                  <button
                    key={challenge.id}
                    onClick={() => handleSelectChallenge(challenge)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                      C
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {challenge.public_title || challenge.internal_name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {getClientName(challenge.client_id)}
                      </div>
                    </div>
                    <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      /{challenge.slug}
                    </code>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {/* Hint */}
        <p className="text-xs text-gray-500">
          Links use legacy format: <code className="bg-gray-100 px-1 rounded">/slug</code>
        </p>
      </div>

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
