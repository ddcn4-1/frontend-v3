# Frontend-v3 레포지토리 실행 가이드

1. etc/host
   ```
   # Make sure to add the following to your /etc/hosts:
   127.0.0.1 local.ddcn41.com
   127.0.0.1 local.admin.ddcn41.com
   127.0.0.1 local.accounts.ddcn41.com
   127.0.0.1 local.api.ddcn41.com
   ```

2. 루트 폴더에 `.env.local` 파일 추가 후 아래에서 코그니토 실제 값 설정
   ```
   # Local Development Environment Configuration
   # This file is used when running frontend in Docker containers
   # API Configuration - Local Backend via Traefik
   VITE_API_BASE=https://local.api.ddcn41.com
   VITE_API_PREFIX=/v1
   VITE_API_TIMEOUT=10000
    
   # ASG Configuration - Local Backend via Traefik
   VITE_ASG_API_BASE=https://local.api.ddcn41.com
   VITE_ASG_ENDPOINT_PREFIX=/v1/admin/dashboard/overview
   VITE_ASG_LIST_PREFIX=/v1/admin/asg
   VITE_ASG_API_TIMEOUT=10000
    
   # App URLs - Local Development with HTTPS
   VITE_CLIENT_URL=https://local.ddcn41.com
   VITE_ADMIN_URL=https://local.admin.ddcn41.com
   VITE_ACCOUNTS_URL=https://local.accounts.ddcn41.com
    
   # Cookie Domain - Local Development
   VITE_COOKIE_DOMAIN=.ddcn41.com
    
   # AWS Cognito Configuration - Local Development
   VITE_COGNITO_CLIENT_ID=실제 값
   VITE_COGNITO_DOMAIN=실제 값
   VITE_REDIRECT_URI=https://local.accounts.ddcn41.com/auth/callback
   VITE_POST_LOGOUT_REDIRECT_URI=https://local.accounts.ddcn41.com
   ```

3. `pnpm install`

4. `pnpm dev`

   
