import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { Users } from '@phosphor-icons/react'

describe('DashboardCard', () => {
  it('renders as a clickable Next.js link with the correct href', () => {
    render(
      <DashboardCard
        label="Active Team Members"
        value="14"
        icon={<Users size={20} />}
        href="/employees"
        index={0}
      />
    )

    // The card must be wrapped in an anchor element pointing to /employees
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/employees')
  })

  it('renders the label and value correctly', () => {
    render(
      <DashboardCard
        label="Active Team Members"
        value="14"
        icon={<Users size={20} />}
        href="/employees"
        index={0}
      />
    )

    expect(screen.getByText('Active Team Members')).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()
  })

  it('applies hover transition classes indicating card is clickable', () => {
    render(
      <DashboardCard
        label="Active Team Members"
        value="14"
        icon={<Users size={20} />}
        href="/employees"
        index={0}
      />
    )

    const link = screen.getByRole('link')
    // Must have transition styling class to signal interactivity
    expect(link.className).toContain('transition')
  })
})
