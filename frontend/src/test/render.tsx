import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { AppRoutes } from '@/App'

/** Renders the application routes at a given path. */
export function renderRoute(path: string) {
  const user = userEvent.setup({ delay: null })
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
  return { user, ...result }
}
