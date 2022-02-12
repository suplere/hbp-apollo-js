export interface NhostApolloClientOptions {
  auth?: NhostAuth;
  gqlEndpoint: string;
  headers?: {
    [key: string]: any;
  };
  publicRole?: string;
  cache?: any;
  connectToDevTools?: boolean;
  onError?: () => unknown;
}

export interface NhostAuth {
  isAuthenticated: () => boolean | null;
  getJWTToken: () => string | null;
}
