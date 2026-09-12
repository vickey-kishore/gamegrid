'use client'

import React, { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthContext'

export function ConfigNotice() {
  const { isConfigured } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  if (isConfigured || dismissed) {
    return null
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <h4 className="font-semibold text-amber-500 mb-1">Supabase Not Configured</h4>
          <p className="text-sm text-gray-300 mb-2">
            The app is running in demo mode. To enable full functionality, configure your Supabase credentials:
          </p>
          <ol className="text-sm text-gray-400 list-decimal list-inside space-y-1">
            <li>Create a project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">supabase.com</a></li>
            <li>Copy your Project URL and Anon Key from project settings</li>
            <li>Add them to a <code className="bg-gray-800 px-1 py-0.5 rounded text-xs">.env.local</code> file:</li>
          </ol>
          <pre className="mt-2 bg-gray-800 p-2 rounded text-xs text-gray-300 overflow-x-auto">
            NEXT_PUBLIC_SUPABASE_URL=your_project_url<br />
            NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
          </pre>
          <p className="text-sm text-gray-400 mt-2">
            Then run the SQL schema from <code className="bg-gray-800 px-1 py-0.5 rounded text-xs">supabase-schema.sql</code> in your Supabase SQL Editor.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
