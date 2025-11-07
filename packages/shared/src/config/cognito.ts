/**
 * @packages/shared/config/cognito
 * AWS Cognito Configuration
 * Centralized Cognito configuration and helper functions
 * FSD v2.1: Shared Layer - Config Segment
 */

/**
 * Cognito environment variables
 */
export const cognitoEnv = {
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  domain: import.meta.env.VITE_COGNITO_DOMAIN,
  redirectUri: import.meta.env.VITE_REDIRECT_URI,
  postLogoutRedirectUri: import.meta.env.VITE_POST_LOGOUT_REDIRECT_URI,
} as const;

/**
 * OAuth scopes for Cognito
 */
export const COGNITO_SCOPES = 'aws.cognito.signin.user.admin email openid phone profile';

/**
 * Generate Cognito OAuth authorization URL
 * @param state - CSRF protection state token
 */
export function getCognitoAuthUrl(state: string): string {
  const params = new URLSearchParams();
  params.set('client_id', cognitoEnv.clientId ?? '');
  params.set('response_type', 'code');
  params.set('scope', COGNITO_SCOPES);
  params.set('redirect_uri', cognitoEnv.redirectUri ?? '');
  params.set('state', state);

  return `${cognitoEnv.domain}/oauth2/authorize?${params.toString()}`;
}

/**
 * Generate Cognito logout URL
 * @param logoutUri - Optional custom logout URI (defaults to configured post_logout_redirect_uri)
 */
export function getCognitoLogoutUrl(logoutUri?: string): string {
  if (!cognitoEnv.domain) {
    console.warn('[cognito] VITE_COGNITO_DOMAIN is not configured');
    return '/';
  }

  const params = new URLSearchParams();
  params.set('client_id', cognitoEnv.clientId ?? '');
  const resolvedLogoutUri = logoutUri ?? cognitoEnv.postLogoutRedirectUri ?? '';
  params.set('logout_uri', resolvedLogoutUri);

  // domain에 이미 https://가 포함되어 있으면 그대로 사용
  const domainUrl = cognitoEnv.domain.startsWith('http')
    ? cognitoEnv.domain
    : `https://${cognitoEnv.domain}`;

  return `${domainUrl}/logout?${params.toString()}`;
}

/**
 * Redirect to Cognito logout
 * @param logoutUri - Optional custom logout URI
 */
export function redirectToCognitoLogout(logoutUri?: string): void {
  if (typeof window !== 'undefined') {
    window.location.href = getCognitoLogoutUrl(logoutUri);
  }
}
