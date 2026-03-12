import type { TargetVariables } from '@/types';

/**
 * Placeholder mapping definition.
 * Each entry maps a regex pattern (matching placeholders found in Obsidian notes)
 * to the corresponding TargetVariables field.
 *
 * Order matters: more specific patterns are matched before generic ones
 * to prevent partial replacements (e.g., "domain.local" before "domain").
 */
interface PlaceholderRule {
  /** Regex pattern matching the placeholder in raw command text */
  pattern: RegExp;
  /** Computes the replacement value from the current target state */
  resolve: (targetState: TargetVariables) => string;
}

function getTargetHost(targetState: TargetVariables): string {
  const domain = targetState.targetDomain.trim();
  if (!domain) {
    return '';
  }

  return domain.split('.')[0] ?? domain;
}

function getTargetDCFqdn(targetState: TargetVariables): string {
  const dc = targetState.targetDC.trim();
  const domain = targetState.targetDomain.trim();

  if (!dc) {
    return '';
  }

  if (dc.includes('.') || !domain) {
    return dc;
  }

  return `${dc}.${domain}`;
}

function getTargetDCAddress(targetState: TargetVariables): string {
  return getTargetDCFqdn(targetState) || targetState.targetIP;
}

/**
 * Static list of recognized placeholders and their replacement targets.
 * Patterns are ordered from most specific to least specific.
 *
 * Why a static list:
 * - Predictable behavior -- users see exactly what gets replaced.
 * - No accidental replacements of unrelated substrings.
 * - Easy to extend: add a new PlaceholderRule to support new patterns.
 */
const PLACEHOLDER_RULES: PlaceholderRule[] = [
  /* -- Domain Controller (must precede domain patterns) -- */
  { pattern: /dc\d*\.domain\.(local|htb)/gi, resolve: getTargetDCFqdn },
  { pattern: /dc\d*\.<machine>\.htb/gi, resolve: getTargetDCFqdn },
  { pattern: /\bDC_IP\b/g, resolve: getTargetDCAddress },
  { pattern: /\$DC\b/g, resolve: (targetState) => targetState.targetDC },
  { pattern: /<dc>/gi, resolve: (targetState) => targetState.targetDC },
  { pattern: /DC01/g, resolve: (targetState) => targetState.targetDC },

  /* -- Domain (FQDN and NetBIOS forms) -- */
  { pattern: /DOMAIN\.LOCAL/g, resolve: (targetState) => targetState.targetDomain },
  { pattern: /domain\.local/g, resolve: (targetState) => targetState.targetDomain },
  { pattern: /domain\.htb/g, resolve: (targetState) => targetState.targetDomain },
  { pattern: /target\.com/g, resolve: (targetState) => targetState.targetDomain },
  { pattern: /target\.htb/g, resolve: (targetState) => targetState.targetDomain },
  { pattern: /<machine>\.htb/gi, resolve: (targetState) => targetState.targetDomain },
  { pattern: /\$DOMAIN\b/g, resolve: (targetState) => targetState.targetDomain },
  { pattern: /<domain>/gi, resolve: (targetState) => targetState.targetDomain },
  { pattern: /\bDOMAIN(?=[\\/])/g, resolve: (targetState) => targetState.targetDomain },
  { pattern: /\bdomain(?=[\\/])/g, resolve: (targetState) => targetState.targetDomain },

  /* -- Target IP -- */
  { pattern: /10\.10\.10\.10/g, resolve: (targetState) => targetState.targetIP },
  { pattern: /10\.129\.x\.x/g, resolve: (targetState) => targetState.targetIP },
  { pattern: /\bTARGET_IP\b/g, resolve: (targetState) => targetState.targetIP },
  { pattern: /\$IP\b/g, resolve: (targetState) => targetState.targetIP },
  { pattern: /<ip>/gi, resolve: (targetState) => targetState.targetIP },
  { pattern: /<target>/gi, resolve: (targetState) => targetState.targetIP },

  /* -- Target host label -- */
  { pattern: /<machine>/gi, resolve: getTargetHost },

  /* -- Local attacker IP -- */
  { pattern: /10\.10\.14\.\d{1,3}/g, resolve: (targetState) => targetState.localIP },
  { pattern: /\bATTACKER_IP\b/gi, resolve: (targetState) => targetState.localIP },
  { pattern: /\battacker_ip\b/gi, resolve: (targetState) => targetState.localIP },
  { pattern: /\bYOUR_IP\b/g, resolve: (targetState) => targetState.localIP },
  { pattern: /\$LHOST\b/g, resolve: (targetState) => targetState.localIP },
  { pattern: /<lhost>/gi, resolve: (targetState) => targetState.localIP },
  { pattern: /<attacker>/gi, resolve: (targetState) => targetState.localIP },

  /* -- Local attacker port -- */
  { pattern: /\bYOUR_PORT\b/g, resolve: (targetState) => targetState.localPort },
  { pattern: /\$LPORT\b/g, resolve: (targetState) => targetState.localPort },
  { pattern: /<lport>/gi, resolve: (targetState) => targetState.localPort },
  { pattern: /4444(?=\s|$|")/g, resolve: (targetState) => targetState.localPort },

  /* -- Username -- */
  { pattern: /\bYOUR_USERNAME\b/g, resolve: (targetState) => targetState.targetUser },
  { pattern: /\bYOUR_USER\b/g, resolve: (targetState) => targetState.targetUser },
  { pattern: /\$USER\b/g, resolve: (targetState) => targetState.targetUser },
  { pattern: /<user>/gi, resolve: (targetState) => targetState.targetUser },
  { pattern: /<username>/gi, resolve: (targetState) => targetState.targetUser },
  { pattern: /\buser\b(?=(?:['"%@:\/\\\s)]|$))/g, resolve: (targetState) => targetState.targetUser },

  /* -- Password -- */
  { pattern: /\bYOUR_PASSWORD\b/g, resolve: (targetState) => targetState.targetPassword },
  { pattern: /\$PASS\b/g, resolve: (targetState) => targetState.targetPassword },
  { pattern: /<pass>/gi, resolve: (targetState) => targetState.targetPassword },
  { pattern: /<password>/gi, resolve: (targetState) => targetState.targetPassword },
  { pattern: /\bpass\b(?=(?:['"%@:\/\\\s);]|$))/gi, resolve: (targetState) => targetState.targetPassword },
  { pattern: /\bPassword\b(?=(?:['"%@:\/\\\s);]|$))/g, resolve: (targetState) => targetState.targetPassword },
];

/**
 * Replaces all recognized placeholders in a raw command string with
 * live values from the target state.
 *
 * This is the core engine of Onyx: it turns static cheat-sheet commands
 * into ready-to-paste commands tailored to the current engagement.
 *
 * @param rawCommand - The original command text from the Markdown database
 * @param targetState - Current values of all target variables from the Zustand store
 * @returns The command string with all recognized placeholders replaced
 *
 * @example
 * ```ts
 * const hydrated = hydrateCommand(
 *   'nmap -sC -sV $IP',
 *   { targetIP: '192.168.1.50', ... }
 * );
 * // => 'nmap -sC -sV 192.168.1.50'
 * ```
 */
export function hydrateCommand(
  rawCommand: string,
  targetState: TargetVariables,
): string {
  let result = rawCommand;

  for (const rule of PLACEHOLDER_RULES) {
    const value = rule.resolve(targetState);
    if (value && value.length > 0) {
      result = result.replace(rule.pattern, value);
    }
  }

  return result;
}
