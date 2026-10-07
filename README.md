# SiteGuard AI

SaaS B2B de maintenance intelligente de sites web. Des agents IA surveillent les sites, diagnostiquent les problèmes, proposent des corrections et les appliquent après validation.

> **PROBLÈME → ANALYSE IA → ACTION → RÉSULTAT** — ce fil est visible sur chaque surface d'anomalie (`components/IssueChainCard.tsx`, `components/Timeline.tsx`).

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router 7 · lucide-react

## Démarrage

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b + vite build
npm run lint     # oxlint
```

## Structure

```
src/
├── index.css                  # Design system (tokens @theme : couleurs, type, radius, motion)
├── App.tsx                    # Routes : /  ·  /onboarding  ·  /app/*
├── lib/utils.ts               # cn(), formatRelativeTime()
├── data/mock.ts               # Données réalistes (sites, issues, agents, activity…)
├── components/
│   ├── ui/                    # Kit : Button, Panel, Status, Tabs, Input, Table, HealthGauge, Metric
│   ├── IssueChainCard.tsx     # Carte signature problème → diagnostic → action → résultat
│   ├── Timeline.tsx           # Timeline de résolution + feed d'activité agents
│   ├── Logo.tsx
│   ├── app/                   # AppLayout, Sidebar, Topbar, MobileNav, BottomNav
│   └── marketing/             # Hero, Sections (problème/solution/…), Closing (agents/pricing/footer)
└── pages/
    ├── LandingPage.tsx
    ├── OnboardingPage.tsx     # 3 étapes : connexion → scan animé → score + issues
    └── app/                   # Dashboard, Websites(+détail), Issues(+détail),
                               # Agents, Automations, Reports, Activity,
                               # Notifications, Settings, Billing
```

## Direction UI

Issue depuis Google Stitch (landing desktop + mobile, dashboard, issue resolution center, AI agents, onboarding scan).

- Base neutre `#F9F9F9` / blanc, texte `#1A1C1C` → `#656464`, hairlines `#E9E9EC`
- **Une seule couleur d'action** : bleu cobalt `#1F5EFF` (hover `#0046D4`)
- Statuts conventionnels : vert healthy, orange warning, rouge critical, bleu info
- Inter (UI) + JetBrains Mono (URLs, logs, code)
- Responsive : sidebar complète ≥1024px, drawer 768–1024px, bottom navigation <768px, tableaux → listes sur mobile

## Branchement backend (étapes suivantes)

Toutes les données passent par `src/data/mock.ts`. Pour connecter un vrai backend :

1. **API monitoring** — remplacer les lectures mock par des clients typés (`services/api/websites.ts`), garder les types de `data/mock.ts` comme contrat.
2. **Agents IA** — `ActivityFeed` / `ResolutionTimeline` sont prêts pour du temps réel (SSE ou WebSocket) : brancher sur le flux d'événements.
3. **Auth** — protéger les routes `/app/*` avec un wrapper de route + provider de session.
4. **Webhooks / déploiements** — l'onglet Automations expose déjà les déclencheurs à mapper.
5. **Abonnements** — `BillingPage` consomme déjà un objet plan ; le mapper sur Stripe Checkout.
6. **Notifications** — le panneau du Topbar est piloté par `notifications[]` (état local, prêt pour un store).

## Notes

- `scripts/smoke.tsx` : rendu SSR de toutes les routes (`npx vite build --ssr scripts/smoke.tsx --outDir .smoke && node .smoke/smoke.js`).
- Animations volontairement discrètes : scan, apparition des résultats, score animé, confirmation de correction, pulse de notification.
