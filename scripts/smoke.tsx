import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App'

const routes = [
  '/',
  '/onboarding',
  '/app',
  '/app/websites',
  '/app/websites/acme-studio',
  '/app/websites/harborlegal',
  '/app/issues',
  '/app/issues/1042',
  '/app/issues/1041',
  '/app/issues/9999',
  '/app/agents',
  '/app/automations',
  '/app/reports',
  '/app/activity',
  '/app/notifications',
  '/app/settings',
  '/app/billing',
]

let failed = 0

for (const route of routes) {
  try {
    const html = renderToString(
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>,
    )
    if (html.length < 500) throw new Error(`suspiciously short output (${html.length} chars)`)
    console.log(`OK   ${route} (${html.length} chars)`)
  } catch (err) {
    failed++
    console.error(`FAIL ${route}`)
    console.error(err)
  }
}

console.log(failed === 0 ? '\nAll routes rendered.' : `\n${failed} route(s) failed.`)
process.exit(failed === 0 ? 0 : 1)
