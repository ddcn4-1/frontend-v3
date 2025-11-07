/**
 * Configuration layer - Public API
 * FSD v2.1: Shared - Config Layer
 */

export { commonConfig } from './common';
export { API_CONFIG, buildApiUrl } from './api';
export {
  cognitoEnv,
  COGNITO_SCOPES,
  getCognitoAuthUrl,
  getCognitoLogoutUrl,
  redirectToCognitoLogout,
} from './cognito';
