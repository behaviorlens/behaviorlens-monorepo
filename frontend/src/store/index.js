import { createContext } from 'react';

export const UserContext = createContext({
  state: {
    auth: false,
    env: 'standalone',
    user: {}
  }
});
