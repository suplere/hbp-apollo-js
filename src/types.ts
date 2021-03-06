export interface NhostApolloClientOptions {
  auth?: NhostAuth;
  gqlEndpoint: string;
  wsEndpoint?: string;
  headers?: {
    [key: string]: any;
  };
  publicRole?: string;
  cache?: any;
  connectToDevTools?: boolean;
  onError?: () => unknown;
}

export interface NhostAuth {
  isAuthenticated: () => boolean;
  getJWTToken: () => string | undefined;
}
