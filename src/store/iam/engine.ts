import { IAMPolicy, IAMEffect } from './types';

/**
 * Checks if a wildcard pattern matches a string.
 * Supports '*' as a wildcard.
 */
function isMatch(pattern: string, value: string): boolean {
  if (pattern === '*') return true;
  const regex = new RegExp('^' + pattern.split('*').map(s => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('.*') + '$');
  return regex.test(value);
}

/**
 * Evaluates a set of policies against an action and a resource.
 * AWS Logic:
 * 1. Default is Deny.
 * 2. Explicit Deny overrides any Allow.
 * 3. Explicit Allow overrides default Deny.
 */
export function evaluatePermission(policies: IAMPolicy[], action: string, resource: string): IAMEffect {
  let hasAllow = false;

  for (const policy of policies) {
    for (const statement of policy.Statement) {
      const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
      const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];

      const actionMatch = actions.some(a => isMatch(a, action));
      const resourceMatch = resources.some(r => isMatch(r, resource));

      if (actionMatch && resourceMatch) {
        if (statement.Effect === 'Deny') {
          return 'Deny'; // Explicit Deny wins
        }
        if (statement.Effect === 'Allow') {
          hasAllow = true;
        }
      }
    }
  }

  return hasAllow ? 'Allow' : 'Deny';
}
