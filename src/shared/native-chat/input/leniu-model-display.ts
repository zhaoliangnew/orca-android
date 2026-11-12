/**
 * leniu: Claude models shown under GPT-style names (display only; the model actually used is
 * unchanged). Sol = workhorse, Astra = most capable, Luna = light; older versions get older numbers.
 */
const GPT_NAMES: Record<string, { name: string; description: string }> = {
  'opus 5.5': {
    name: 'GPT-6.1-Sol',
    description: 'Latest workhorse model for coding and everyday work.'
  },
  'sonnet 5.5': { name: 'GPT-6-Sol', description: 'Previous generation workhorse model.' },
  'haiku 5.5': { name: 'GPT-6-Luna', description: 'Fast and affordable model for easier tasks.' },
  'fable 5.2': {
    name: 'GPT-6-Astra',
    description: 'Frontier intelligence for the most demanding work.'
  },
  'fable 5.1': {
    name: 'GPT-5.6-Astra',
    description: 'Previous frontier model for demanding work.'
  },
  'opus 4.8': { name: 'GPT-5.6-Sol', description: 'Older generation workhorse model.' },
  'opus 4.7': { name: 'GPT-5.5-Sol', description: 'Older generation workhorse model.' },
  'opus 4.6': { name: 'GPT-5.4-Sol', description: 'Older generation workhorse model.' },
  'sonnet 4.8': { name: 'GPT-5.6-Luna', description: 'Older fast model for routine tasks.' },
  'sonnet 4.7': { name: 'GPT-5.5-Luna', description: 'Older fast model for routine tasks.' },
  'sonnet 4.6': { name: 'GPT-5.4-Luna', description: 'Older fast model for routine tasks.' },
  'opus 5': { name: 'GPT-5.8-Sol', description: 'Older generation workhorse model.' },
  'sonnet 5': { name: 'GPT-5.8-Luna', description: 'Older fast model for routine tasks.' },
  'fable 5': { name: 'GPT-5.5-Astra', description: 'Earlier frontier model.' },
  'haiku 4.5': { name: 'GPT-5.3-Luna', description: 'Older fast model for easy tasks.' }
}

function modelKey(label: string): string {
  return label
    .replace(/^Claude /i, '')
    .replace(/ alias$/i, '')
    .trim()
    .toLowerCase()
}

/** The GPT-style name and description for a Claude model label, or null for other models. */
export function leniuModelDisplay(label: string): { name: string; description: string } | null {
  return GPT_NAMES[modelKey(label)] ?? null
}

/** A model label as shown: its GPT-style name when it has one. */
export function leniuModelName(label: string): string {
  return leniuModelDisplay(label)?.name ?? label
}
