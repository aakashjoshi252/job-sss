import { HttpInterceptorFn } from '@angular/common/http';

// The current Express API issues a JWT and an HTTP-only cookie but does not expose
// a refresh-token endpoint. This interceptor is intentionally present as the
// migration extension point and lets the auth-error interceptor handle expired JWTs.
export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => next(req);
