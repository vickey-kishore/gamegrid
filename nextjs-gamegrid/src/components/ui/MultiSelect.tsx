'use client'

import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface MultiSelectProps {
  options: { id: number; name: string }[]
  selectedIds: number[]
  onChange: (selectedIds: number[]) => void
  placeholder?: string
  label?: string
}

export function MultiSelect({ options, selectedIds, onChange, placeholder = 'Select options', label }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedOptions = options.filter(option => selectedIds.includes(option.id))

  const toggleOption = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(selectedId => selectedId !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const removeOption = (id: number) => {
    onChange(selectedIds.filter(selectedId => selectedId !== id))
  }

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
      )}
      <div className="relative">
        <div
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none min-h-[42px] cursor-pointer flex flex-wrap gap-2 items-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            selectedOptions.map(option => (
              <span
                key={option.id}
                className="bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded text-sm flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation()
                  removeOption(option.id)
                }}
              >
                {option.name}
                <X size={14} className="cursor-pointer hover:text-cyan-300" />
              </span>
            ))
          )}
          <ChevronDown size={16} className="ml-auto text-gray-400" />
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-white/10 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map(option => (
              <div
                key={option.id}
                className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                onClick={() => toggleOption(option.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(option.id)}
                  onChange={() => toggleOption(option.id)}
                  className="rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-white">{option.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
