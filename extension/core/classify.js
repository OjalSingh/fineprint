// Local, free, rule-based classifier. No AI/API calls: it flags topics, it does not interpret law.
const RULES = [
  { id: 'ai_training', label: 'AI training', weight: 3, re: /(train(ing|ed)?|improv\w+|develop\w+).{0,60}(\bai\b|artificial intelligence|machine learning|generative|language model)|(\bai\b|generative|machine learning).{0,60}(train|model)/i },
  { id: 'data_sharing', label: 'Data sharing or sale', weight: 3, re: /\b(sell|sold|sale of|sharing)\b.{0,60}(data|information)|share.{0,60}(partners|third[- ]part|affiliates|advertisers)|disclose.{0,40}(third[- ]part|partners)/i },
  { id: 'biometrics', label: 'Biometrics or sensitive data', weight: 3, re: /biometric|faceprint|voiceprint|health data|precise location|genetic/i },
  { id: 'arbitration', label: 'Arbitration or legal rights', weight: 3, re: /arbitration|class action|waive|jury trial/i },
  { id: 'ads_tracking', label: 'Ads and tracking', weight: 2, re: /advertis|personali[sz]ed|tracking|cookies?|pixels?|fingerprint/i },
  { id: 'retention', label: 'Data retention', weight: 2, re: /retain|retention|keep your (data|information)|stored? for/i },
  { id: 'location', label: 'Location', weight: 2, re: /location (data|information)|gps|geolocation/i },
  { id: 'deletion', label: 'Account or data deletion', weight: 1, re: /delet(e|ion)|erase|remove your (data|account)/i },
];

export function classify(added, removed = []) {
  const hits = new Map();
  for (const s of added) for (const r of RULES) if (r.re.test(s)) hits.set(r.id, r);
  const cats = [...hits.values()].sort((a, b) => b.weight - a.weight);
  const top = cats[0]?.weight ?? 0;
  const impact = top >= 3 ? 'high' : top === 2 ? 'medium' : 'low';
  const evidence = added.filter((s) => cats.some((c) => c.re.test(s))).slice(0, 3).map((s) => s.slice(0, 280));
  const topics = cats.map((c) => c.label);
  const summary = topics.length
    ? `New wording touches: ${topics.join(', ')}. ${added.length} sentence(s) added, ${removed.length} removed.`
    : `${added.length} sentence(s) added, ${removed.length} removed. No sensitive topics detected, but read the diff.`;
  return { impact, categories: cats.map((c) => c.id), topics, summary, evidence };
}
