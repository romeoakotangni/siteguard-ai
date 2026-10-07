export type Severity = 'critical' | 'warning' | 'optimization'
export type IssueStatus = 'open' | 'approval' | 'resolved' | 'ignored'
export type SiteStatus = 'healthy' | 'warning' | 'critical'

export interface Website {
  id: string
  domain: string
  name: string
  client: string
  health: number
  status: SiteStatus
  issues: { critical: number; warning: number; optimization: number }
  lastScan: string
  uptime: string
  responseMs: number
  plan: 'Starter' | 'Pro' | 'Agency'
  connectedAt: string
}

export interface IssueTimelineStep {
  time: string
  agent: string
  label: string
  state: 'done' | 'current' | 'pending'
}

export interface Issue {
  id: string
  code: string
  title: string
  severity: Severity
  status: IssueStatus
  siteId: string
  path: string
  category: 'Monitoring' | 'Performance' | 'SEO' | 'Forms' | 'Security' | 'Content'
  impact: 'High' | 'Medium' | 'Low'
  detectedAt: string
  detectedBy: string
  diagnosis: string
  evidence: { label: string; value: string }[]
  recommendedFix: string
  fixDetail: string
  confidence: number
  before: { label: string; value: string; tone: 'critical' | 'healthy' }
  after: { label: string; value: string; tone: 'critical' | 'healthy' }
  affectedPages: number
  seoImpact: 'High' | 'Medium' | 'Low' | 'None'
  timeline: IssueTimelineStep[]
  autoFixable: boolean
}

export interface Agent {
  id: string
  name: string
  role: string
  scope: string
  status: 'active' | 'idle'
  detected: number
  fixed: number
  lastAnalysis: string
  activity: number[]
}

export interface ActivityEvent {
  id: string
  time: string
  agent: string
  message: string
  kind: 'detect' | 'diagnose' | 'fix' | 'approve' | 'verify' | 'info'
  site?: string
}

export interface Notification {
  id: string
  title: string
  body: string
  time: string
  tone: 'critical' | 'warning' | 'healthy' | 'info'
  read: boolean
}

/* ------------------------------------------------------------------ */

export const workspace = {
  name: 'Northline Agency',
  plan: 'Agency',
  user: { name: 'Marie Dupont', email: 'marie@northline.agency', role: 'Owner' },
}

export const websites: Website[] = [
  {
    id: 'acme-studio',
    domain: 'acme-studio.com',
    name: 'Acme Studio',
    client: 'Acme Inc.',
    health: 94,
    status: 'healthy',
    issues: { critical: 1, warning: 2, optimization: 3 },
    lastScan: '2026-10-07T10:42:00Z',
    uptime: '99.98%',
    responseMs: 143,
    plan: 'Pro',
    connectedAt: '2026-03-12T09:00:00Z',
  },
  {
    id: 'nordic-fit',
    domain: 'nordic-fit.io',
    name: 'Nordic Fit',
    client: 'Nordic Fit AS',
    health: 88,
    status: 'warning',
    issues: { critical: 0, warning: 3, optimization: 2 },
    lastScan: '2026-10-07T10:38:00Z',
    uptime: '99.95%',
    responseMs: 312,
    plan: 'Pro',
    connectedAt: '2026-01-22T09:00:00Z',
  },
  {
    id: 'luminex',
    domain: 'luminex-agency.com',
    name: 'Luminex',
    client: 'Luminex SARL',
    health: 97,
    status: 'healthy',
    issues: { critical: 0, warning: 0, optimization: 4 },
    lastScan: '2026-10-07T10:31:00Z',
    uptime: '100%',
    responseMs: 98,
    plan: 'Agency',
    connectedAt: '2025-11-04T09:00:00Z',
  },
  {
    id: 'harborlegal',
    domain: 'harborlegal.com',
    name: 'Harbor Legal',
    client: 'Harbor Legal LLP',
    health: 62,
    status: 'critical',
    issues: { critical: 2, warning: 4, optimization: 1 },
    lastScan: '2026-10-07T10:44:00Z',
    uptime: '98.20%',
    responseMs: 890,
    plan: 'Agency',
    connectedAt: '2026-06-18T09:00:00Z',
  },
  {
    id: 'verde-coffee',
    domain: 'verde-coffee.co',
    name: 'Verde Coffee',
    client: 'Verde Coffee Co.',
    health: 91,
    status: 'healthy',
    issues: { critical: 0, warning: 1, optimization: 2 },
    lastScan: '2026-10-07T10:20:00Z',
    uptime: '99.99%',
    responseMs: 187,
    plan: 'Starter',
    connectedAt: '2026-08-02T09:00:00Z',
  },
  {
    id: 'atlas-consulting',
    domain: 'atlas-consulting.fr',
    name: 'Atlas Consulting',
    client: 'Atlas Conseil',
    health: 85,
    status: 'warning',
    issues: { critical: 0, warning: 2, optimization: 5 },
    lastScan: '2026-10-07T10:12:00Z',
    uptime: '99.90%',
    responseMs: 264,
    plan: 'Pro',
    connectedAt: '2026-02-14T09:00:00Z',
  },
  {
    id: 'meridian-health',
    domain: 'meridian-health.org',
    name: 'Meridian Health',
    client: 'Meridian Clinic',
    health: 96,
    status: 'healthy',
    issues: { critical: 0, warning: 1, optimization: 0 },
    lastScan: '2026-10-07T09:58:00Z',
    uptime: '100%',
    responseMs: 121,
    plan: 'Agency',
    connectedAt: '2025-09-30T09:00:00Z',
  },
  {
    id: 'pulse-labs',
    domain: 'pulselabs.dev',
    name: 'Pulse Labs',
    client: 'Pulse Labs',
    health: 73,
    status: 'warning',
    issues: { critical: 1, warning: 2, optimization: 3 },
    lastScan: '2026-10-07T09:45:00Z',
    uptime: '99.71%',
    responseMs: 512,
    plan: 'Pro',
    connectedAt: '2026-07-11T09:00:00Z',
  },
]

export const overview = {
  websites: 24,
  healthy: 22,
  issues: 7,
  approvals: 3,
  healthScore: 94,
  trend: '+2 vs last week',
  metrics: [
    { label: 'Availability', value: '99.98%', percent: 99, tone: 'healthy' as const, hint: '30-day uptime' },
    { label: 'Performance', value: '91 / 100', percent: 91, tone: 'healthy' as const, hint: 'LCP 2.1s' },
    { label: 'Security', value: '96 / 100', percent: 96, tone: 'healthy' as const, hint: '1 header to fix' },
    { label: 'SEO', value: '89 / 100', percent: 89, tone: 'warning' as const, hint: '3 meta issues' },
    { label: 'Forms', value: '100 / 100', percent: 100, tone: 'healthy' as const, hint: '12 tested today' },
  ],
}

export const agents: Agent[] = [
  {
    id: 'monitor',
    name: 'Monitor Agent',
    role: 'Watches availability, HTTP errors and downtime.',
    scope: 'Every 60 seconds',
    status: 'active',
    detected: 128,
    fixed: 0,
    lastAnalysis: '2 min ago',
    activity: [4, 6, 5, 8, 7, 9, 6, 11, 8, 7, 10, 9],
  },
  {
    id: 'performance',
    name: 'Performance Agent',
    role: 'Tracks load speed and Core Web Vitals.',
    scope: 'Every hour',
    status: 'active',
    detected: 42,
    fixed: 31,
    lastAnalysis: '6 min ago',
    activity: [3, 2, 4, 3, 5, 4, 6, 4, 3, 5, 4, 4],
  },
  {
    id: 'seo',
    name: 'SEO Agent',
    role: 'Audits sitemap, robots.txt, metadata and structure.',
    scope: 'Daily',
    status: 'active',
    detected: 57,
    fixed: 44,
    lastAnalysis: '11 min ago',
    activity: [6, 5, 7, 6, 5, 8, 6, 7, 5, 6, 7, 6],
  },
  {
    id: 'form',
    name: 'Form Agent',
    role: 'Tests forms end-to-end with real submissions.',
    scope: 'Every 6 hours',
    status: 'active',
    detected: 9,
    fixed: 9,
    lastAnalysis: '18 min ago',
    activity: [1, 0, 2, 1, 1, 0, 2, 1, 1, 2, 1, 1],
  },
  {
    id: 'security',
    name: 'Security Agent',
    role: 'Monitors headers, exposure and basic threats.',
    scope: 'Every hour',
    status: 'active',
    detected: 14,
    fixed: 10,
    lastAnalysis: '3 min ago',
    activity: [2, 1, 2, 3, 2, 1, 2, 2, 3, 2, 1, 2],
  },
  {
    id: 'fix',
    name: 'Fix Agent',
    role: 'Prepares corrections and verifies applied fixes.',
    scope: 'On demand',
    status: 'active',
    detected: 0,
    fixed: 213,
    lastAnalysis: '1 min ago',
    activity: [8, 9, 7, 10, 9, 8, 11, 9, 10, 8, 9, 10],
  },
]

export const issues: Issue[] = [
  {
    id: '1042',
    code: '#1042',
    title: 'Broken link detected',
    severity: 'critical',
    status: 'approval',
    siteId: 'acme-studio',
    path: '/services/web-development',
    category: 'Monitoring',
    impact: 'Medium',
    detectedAt: '2026-10-07T10:42:00Z',
    detectedBy: 'Monitor Agent',
    diagnosis:
      'The link points to a page that returns HTTP 404. It appears in the main navigation and on 3 pages. Organic traffic to this URL dropped 100% since the page was removed during the last redesign.',
    evidence: [
      { label: 'GET /services/web-development', value: '404 Not Found' },
      { label: 'Occurrences', value: '3 pages' },
      { label: 'Last valid response', value: '18 days ago' },
    ],
    recommendedFix: 'Update the link target to:',
    fixDetail: '/services/web-development-services',
    confidence: 96,
    before: { label: 'Before', value: '/services/web-development → 404', tone: 'critical' },
    after: { label: 'After', value: '/services/web-development-services → 200', tone: 'healthy' },
    affectedPages: 3,
    seoImpact: 'Medium',
    autoFixable: true,
    timeline: [
      { time: '10:42', agent: 'Monitor Agent', label: 'Detected HTTP 404 on 3 pages', state: 'done' },
      { time: '10:43', agent: 'AI diagnosis', label: 'Root cause identified', state: 'done' },
      { time: '10:44', agent: 'Fix Agent', label: 'Correction generated · confidence 96%', state: 'done' },
      { time: '10:45', agent: 'Workflow', label: 'Waiting for your approval', state: 'current' },
      { time: '—', agent: 'Fix Agent', label: 'Apply correction', state: 'pending' },
      { time: '—', agent: 'Monitor Agent', label: 'Verify fix · confirm 200', state: 'pending' },
      { time: '—', agent: 'Workflow', label: 'Issue resolved', state: 'pending' },
    ],
  },
  {
    id: '1041',
    code: '#1041',
    title: 'Contact form not receiving submissions',
    severity: 'critical',
    status: 'open',
    siteId: 'harborlegal',
    path: '/contact',
    category: 'Forms',
    impact: 'High',
    detectedAt: '2026-10-07T09:12:00Z',
    detectedBy: 'Form Agent',
    diagnosis:
      'Test submissions to the contact form return HTTP 500. The form endpoint has been failing since a plugin update 6 hours ago. Every visitor submission since then is lost.',
    evidence: [
      { label: 'POST /api/contact', value: '500 Internal Server Error' },
      { label: 'Failed tests', value: '4 of 4' },
      { label: 'First failure', value: '6 hours ago' },
    ],
    recommendedFix: 'Roll back the form handler to the previous version:',
    fixDetail: 'revert plugin wpforms 6.4.1 → 6.3.9',
    confidence: 89,
    before: { label: 'Before', value: 'POST /api/contact → 500', tone: 'critical' },
    after: { label: 'After', value: 'POST /api/contact → 200', tone: 'healthy' },
    affectedPages: 1,
    seoImpact: 'None',
    autoFixable: false,
    timeline: [
      { time: '09:12', agent: 'Form Agent', label: 'Test submission failed', state: 'done' },
      { time: '09:14', agent: 'Form Agent', label: 'Retried from 2 locations', state: 'done' },
      { time: '09:15', agent: 'AI diagnosis', label: 'Plugin regression identified', state: 'done' },
      { time: '09:16', agent: 'Fix Agent', label: 'Rollback plan prepared', state: 'current' },
      { time: '—', agent: 'Workflow', label: 'Waiting for your approval', state: 'pending' },
      { time: '—', agent: 'Form Agent', label: 'Verify with live submission', state: 'pending' },
      { time: '—', agent: 'Workflow', label: 'Issue resolved', state: 'pending' },
    ],
  },
  {
    id: '1039',
    code: '#1039',
    title: 'LCP regression on homepage',
    severity: 'warning',
    status: 'approval',
    siteId: 'nordic-fit',
    path: '/',
    category: 'Performance',
    impact: 'Medium',
    detectedAt: '2026-10-07T08:40:00Z',
    detectedBy: 'Performance Agent',
    diagnosis:
      'Largest Contentful Paint went from 1.8s to 3.4s after a hero image was uploaded without compression. Core Web Vitals now fail on mobile.',
    evidence: [
      { label: 'LCP (mobile)', value: '3.4s · threshold 2.5s' },
      { label: 'Image weight', value: '2.4 MB → 318 KB possible' },
      { label: 'Regression since', value: 'yesterday 16:20' },
    ],
    recommendedFix: 'Serve the hero image in WebP at responsive sizes:',
    fixDetail: 'hero-home.webp (318 KB) + srcset 3 breakpoints',
    confidence: 94,
    before: { label: 'Before', value: 'hero.jpg · 2.4 MB · LCP 3.4s', tone: 'critical' },
    after: { label: 'After', value: 'hero-home.webp · 318 KB · LCP 1.9s', tone: 'healthy' },
    affectedPages: 1,
    seoImpact: 'Medium',
    autoFixable: true,
    timeline: [
      { time: '08:40', agent: 'Performance Agent', label: 'LCP regression detected', state: 'done' },
      { time: '08:41', agent: 'Performance Agent', label: 'Traced to hero image', state: 'done' },
      { time: '08:42', agent: 'Fix Agent', label: 'WebP conversion prepared', state: 'done' },
      { time: '08:43', agent: 'Workflow', label: 'Waiting for your approval', state: 'current' },
      { time: '—', agent: 'Fix Agent', label: 'Apply image optimization', state: 'pending' },
      { time: '—', agent: 'Performance Agent', label: 'Re-measure Core Web Vitals', state: 'pending' },
      { time: '—', agent: 'Workflow', label: 'Issue resolved', state: 'pending' },
    ],
  },
  {
    id: '1037',
    code: '#1037',
    title: 'Missing meta description',
    severity: 'optimization',
    status: 'open',
    siteId: 'atlas-consulting',
    path: '/expertise/strategy',
    category: 'SEO',
    impact: 'Low',
    detectedAt: '2026-10-07T07:55:00Z',
    detectedBy: 'SEO Agent',
    diagnosis:
      'The page has no meta description, so search engines generate a snippet from body text. Expected CTR loss on branded queries.',
    evidence: [
      { label: 'meta[name=description]', value: 'missing' },
      { label: 'Ranking position', value: '#6 target keyword' },
    ],
    recommendedFix: 'Add the generated description:',
    fixDetail:
      'Strategy consulting for mid-market companies. We help leadership teams turn market signals into executable plans.',
    confidence: 91,
    before: { label: 'Before', value: '<meta name="description"> missing', tone: 'critical' },
    after: { label: 'After', value: 'Description added · 148 characters', tone: 'healthy' },
    affectedPages: 1,
    seoImpact: 'Low',
    autoFixable: true,
    timeline: [
      { time: '07:55', agent: 'SEO Agent', label: 'Missing description detected', state: 'done' },
      { time: '07:56', agent: 'SEO Agent', label: 'Snippet drafted from page content', state: 'done' },
      { time: '07:56', agent: 'Fix Agent', label: 'Patch ready', state: 'current' },
      { time: '—', agent: 'Workflow', label: 'Waiting for your approval', state: 'pending' },
      { time: '—', agent: 'SEO Agent', label: 'Verify on next crawl', state: 'pending' },
      { time: '—', agent: 'Workflow', label: 'Issue resolved', state: 'pending' },
    ],
  },
  {
    id: '1035',
    code: '#1035',
    title: 'Unusual layout change after deploy',
    severity: 'warning',
    status: 'open',
    siteId: 'pulse-labs',
    path: '/pricing',
    category: 'Content',
    impact: 'Medium',
    detectedAt: '2026-10-06T22:31:00Z',
    detectedBy: 'Monitor Agent',
    diagnosis:
      'Visual diff shows the pricing table collapsed on mobile after the 22:10 deploy. 4 of 12 comparison rows are now hidden.',
    evidence: [
      { label: 'Visual diff', value: '18% of viewport changed' },
      { label: 'Deploy', value: 'yesterday 22:10' },
      { label: 'Affected breakpoints', value: '≤ 640px' },
    ],
    recommendedFix: 'Restore the grid template for small screens:',
    fixDetail: '.pricing-table { grid-template-columns: 1fr 1fr; }',
    confidence: 87,
    before: { label: 'Before', value: '12 rows visible', tone: 'healthy' },
    after: { label: 'After', value: '4 rows hidden', tone: 'critical' },
    affectedPages: 1,
    seoImpact: 'None',
    autoFixable: false,
    timeline: [
      { time: '22:31', agent: 'Monitor Agent', label: 'Visual regression detected', state: 'done' },
      { time: '22:33', agent: 'AI diagnosis', label: 'Compared pre/post deploy snapshots', state: 'done' },
      { time: '22:34', agent: 'Fix Agent', label: 'CSS patch drafted', state: 'current' },
      { time: '—', agent: 'Workflow', label: 'Waiting for your approval', state: 'pending' },
      { time: '—', agent: 'Monitor Agent', label: 'Re-capture snapshots', state: 'pending' },
      { time: '—', agent: 'Workflow', label: 'Issue resolved', state: 'pending' },
    ],
  },
  {
    id: '1033',
    code: '#1033',
    title: 'Security header missing: HSTS',
    severity: 'warning',
    status: 'open',
    siteId: 'harborlegal',
    path: '/',
    category: 'Security',
    impact: 'Medium',
    detectedAt: '2026-10-06T18:02:00Z',
    detectedBy: 'Security Agent',
    diagnosis:
      'The Strict-Transport-Security header is not sent. HTTPS can be downgraded on hostile networks. Recommended for a site handling client enquiries.',
    evidence: [
      { label: 'Strict-Transport-Security', value: 'absent' },
      { label: 'HTTPS', value: 'valid certificate' },
    ],
    recommendedFix: 'Add the header at the edge:',
    fixDetail: 'Strict-Transport-Security: max-age=31536000; includeSubDomains',
    confidence: 99,
    before: { label: 'Before', value: 'HSTS header absent', tone: 'critical' },
    after: { label: 'After', value: 'max-age=31536000', tone: 'healthy' },
    affectedPages: 1,
    seoImpact: 'None',
    autoFixable: true,
    timeline: [
      { time: '18:02', agent: 'Security Agent', label: 'Header audit failed', state: 'done' },
      { time: '18:03', agent: 'AI diagnosis', label: 'Risk assessed as medium', state: 'done' },
      { time: '18:03', agent: 'Fix Agent', label: 'Header rule generated', state: 'current' },
      { time: '—', agent: 'Workflow', label: 'Waiting for your approval', state: 'pending' },
      { time: '—', agent: 'Security Agent', label: 'Verify response headers', state: 'pending' },
      { time: '—', agent: 'Workflow', label: 'Issue resolved', state: 'pending' },
    ],
  },
  {
    id: '1028',
    code: '#1028',
    title: 'Sitemap contains broken URLs',
    severity: 'optimization',
    status: 'resolved',
    siteId: 'verde-coffee',
    path: '/sitemap.xml',
    category: 'SEO',
    impact: 'Low',
    detectedAt: '2026-10-05T11:20:00Z',
    detectedBy: 'SEO Agent',
    diagnosis: '5 URLs in the sitemap returned 404 after the menu restructure.',
    evidence: [
      { label: 'Invalid URLs', value: '5 of 68' },
      { label: 'Crawl budget impact', value: 'low' },
    ],
    recommendedFix: 'Remove retired URLs and resubmit the sitemap.',
    fixDetail: 'sitemap.xml · 68 → 63 URLs',
    confidence: 98,
    before: { label: 'Before', value: '68 URLs · 5 broken', tone: 'critical' },
    after: { label: 'After', value: '63 URLs · 0 broken', tone: 'healthy' },
    affectedPages: 5,
    seoImpact: 'Low',
    autoFixable: true,
    timeline: [
      { time: '11:20', agent: 'SEO Agent', label: 'Broken URLs detected', state: 'done' },
      { time: '11:22', agent: 'Fix Agent', label: 'Sitemap regenerated', state: 'done' },
      { time: '11:25', agent: 'Workflow', label: 'Fix approved automatically', state: 'done' },
      { time: '11:31', agent: 'SEO Agent', label: 'Re-crawl · 0 broken URLs', state: 'done' },
      { time: '11:31', agent: 'Workflow', label: 'Issue resolved', state: 'done' },
    ],
  },
]

export const approvals = issues.filter((i) => i.status === 'approval')

export const activity: ActivityEvent[] = [
  { id: 'a1', time: '10:49', agent: 'Monitor Agent', message: 'Verified acme-studio.com availability · 143 ms', kind: 'verify', site: 'acme-studio.com' },
  { id: 'a2', time: '10:45', agent: 'Fix Agent', message: 'Correction generated for issue #1042 · confidence 96%', kind: 'fix', site: 'acme-studio.com' },
  { id: 'a3', time: '10:44', agent: 'AI diagnosis', message: 'Root cause identified: destination page returns 404', kind: 'diagnose', site: 'acme-studio.com' },
  { id: 'a4', time: '10:42', agent: 'Monitor Agent', message: 'Detected HTTP 404 on /services/web-development', kind: 'detect', site: 'acme-studio.com' },
  { id: 'a5', time: '10:38', agent: 'Performance Agent', message: 'Core Web Vitals measured for 6 sites · 1 regression', kind: 'detect', site: 'nordic-fit.io' },
  { id: 'a6', time: '10:31', agent: 'SEO Agent', message: 'Daily crawl completed · 412 pages indexed', kind: 'info', site: 'luminex-agency.com' },
  { id: 'a7', time: '10:22', agent: 'Form Agent', message: '3 forms tested · all passing', kind: 'verify', site: 'verde-coffee.co' },
  { id: 'a8', time: '10:15', agent: 'Security Agent', message: 'Header audit completed · 1 recommendation', kind: 'detect', site: 'harborlegal.com' },
  { id: 'a9', time: '10:02', agent: 'Fix Agent', message: 'Issue #1028 resolved and verified', kind: 'fix', site: 'verde-coffee.co' },
  { id: 'a10', time: '09:48', agent: 'Monitor Agent', message: 'Downtime check passed on 24 sites', kind: 'verify' },
]

export const notifications: Notification[] = [
  { id: 'n1', title: 'Fix ready for approval', body: 'Broken link /services/web-development · acme-studio.com', time: '12 min ago', tone: 'critical', read: false },
  { id: 'n2', title: 'Form failures detected', body: 'Contact form returning HTTP 500 · harborlegal.com', time: '1h ago', tone: 'critical', read: false },
  { id: 'n3', title: 'Performance regression', body: 'LCP 3.4s on homepage · nordic-fit.io', time: '2h ago', tone: 'warning', read: false },
  { id: 'n4', title: 'Weekly report ready', body: '24 sites · 94/100 average health · 41 fixes applied', time: 'Yesterday', tone: 'info', read: true },
  { id: 'n5', title: 'Issue resolved automatically', body: 'Sitemap cleaned on verde-coffee.co', time: '2 days ago', tone: 'healthy', read: true },
]

export const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    period: '/month',
    description: 'For freelancers watching a handful of sites.',
    features: ['3 websites', 'Monitor + SEO + Form agents', 'Daily scans', 'AI diagnosis', '10 auto-fixes / month'],
    cta: 'Connecter mon premier site',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$99',
    period: '/month',
    description: 'For agencies that need fixes, not just alerts.',
    features: [
      '15 websites',
      'All 6 AI agents',
      'Hourly scans + deploy watch',
      'Approval workflow & automations',
      'Unlimited auto-fixes',
      'Weekly client reports',
    ],
    cta: 'Connecter mon premier site',
    highlighted: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: '$299',
    period: '/month',
    description: 'For teams running 50 to 100 client sites.',
    features: [
      '100 websites',
      'All agents + custom rules',
      'Minute-level monitoring',
      'White-label reports',
      'Roles, SSO & audit log',
      'Priority support',
    ],
    cta: 'Connecter mon premier site',
    highlighted: false,
  },
]

export const siteTabs = ['Overview', 'Issues', 'Performance', 'SEO', 'Forms', 'Security', 'Activity']

export function getSite(id: string) {
  return websites.find((w) => w.id === id)
}

export function getIssue(id: string) {
  return issues.find((i) => i.id === id)
}

export function siteIssues(siteId: string) {
  return issues.filter((i) => i.siteId === siteId)
}
