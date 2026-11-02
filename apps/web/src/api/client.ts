import createClient from 'openapi-fetch';
import type { paths } from './schema';

// Typed client for the BehaviorLens API. Paths and payloads come from the
// generated schema, so a backend change that breaks the frontend fails `tsc`.
export const api = createClient<paths>({ baseUrl: '/' });
