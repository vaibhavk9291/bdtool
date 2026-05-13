"use client"

import { useState } from 'react'
import { User } from '@prisma/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Dialog } from '@/components/ui/Dialog'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

export function UserListClient({ initialUsers }: { initialUsers: User[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [formData, setFormData] = useState({ username: '', displayName: '', role: 'USER' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create user')
      
      toast.success('User created successfully')
      setIsAddOpen(false)
      setFormData({ username: '', displayName: '', role: 'USER' })
      router.refresh()
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update user')
      
      toast.success(`User ${!user.active ? 'reactivated' : 'deactivated'}`)
      router.refresh()
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message)
    }
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-end">
        <Button onClick={() => setIsAddOpen(true)}>Add User</Button>
      </div>

      <div className="hidden md:block rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
            <tr>
              <th scope="col" className="px-6 py-3">Username</th>
              <th scope="col" className="px-6 py-3">Display Name</th>
              <th scope="col" className="px-6 py-3">Role</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {initialUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              initialUsers.map(user => (
                <tr key={user.id} className="bg-white hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.username}</td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/users/${user.id}`} className="hover:underline font-medium text-gray-900">
                      {user.displayName}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="secondary" 
                      onClick={() => toggleActive(user)}
                    >
                      {user.active ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {initialUsers.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
            No users found.
          </div>
        ) : (
          initialUsers.map(user => (
            <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <Link href={`/admin/users/${user.id}`} className="hover:underline font-medium text-gray-900 text-lg">
                    {user.displayName}
                  </Link>
                  <div className="text-gray-500 text-sm">@{user.username}</div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {user.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Role</span>
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    {user.role}
                  </span>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => toggleActive(user)}
                >
                  {user.active ? 'Deactivate' : 'Reactivate'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add User">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input 
              value={formData.username} 
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              placeholder="e.g. alice_smith"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input 
              value={formData.displayName} 
              onChange={e => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="e.g. Alice Smith"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select 
              value={formData.role} 
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </Select>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add User'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
