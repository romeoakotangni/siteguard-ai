export async function callFallback(prompt: string): Promise<string> {
  return `Agent analysis (heuristic fallback):

${prompt}

Recommended actions:
- Verify HTTP status/caching/redirects
- Check Core Web Vitals (LCP/CLS/INP)
- Validate metadata, links, forms, security headers
- Propose safe, reviewable fixes with confidence
`;
}
