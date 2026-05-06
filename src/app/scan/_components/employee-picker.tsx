'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import type { ShopEmployeeTile } from '@/modules/scanning'

interface EmployeePickerProps {
  employees: ShopEmployeeTile[]
  workstationVersion: number
}

export function EmployeePicker({ employees, workstationVersion }: EmployeePickerProps) {
  const router = useRouter()
  const [filter, setFilter] = useState('')
  const [, startTransition] = useTransition()

  const showFilter = employees.length > 12
  const visible = filter
    ? employees.filter((e) =>
        e.display_name.toLowerCase().includes(filter.toLowerCase())
      )
    : employees

  function handleSelect(employee: ShopEmployeeTile) {
    startTransition(() => {
      router.push(`/scan/pin?emp=${employee.id}&v=${workstationVersion}` as Route)
    })
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-lg text-zinc-400">No employees found.</p>
        <p className="text-sm text-zinc-500">Contact a manager to add employees.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {showFilter && (
        <input
          type="search"
          placeholder="Filter employees…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          aria-label="Filter employees"
        />
      )}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))' }}
        role="list"
        aria-label="Employee list"
      >
        {visible.map((employee) => (
          <button
            key={employee.id}
            type="button"
            role="listitem"
            onClick={() => handleSelect(employee)}
            className="flex min-h-[6rem] flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 p-4 text-center transition-colors active:bg-zinc-700 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            aria-label={`Select ${employee.display_name}`}
          >
            {employee.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- external avatar URL; next/image requires domain allow-listing
              <img
                src={employee.avatar_url}
                alt=""
                aria-hidden="true"
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-lg font-bold text-zinc-300"
                aria-hidden="true"
              >
                {employee.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium leading-tight">{employee.display_name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
