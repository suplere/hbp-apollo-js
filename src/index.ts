import { NhostApolloClientOptions, NhostAuth } from "./types";
import {
  ApolloClient,
  ApolloClientOptions,
  ApolloLink,
  createHttpLink,
  from,
  InMemoryCache,
  RequestHandler,
  split,
} from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { OperationDefinitionNode } from "graphql";
import { setContext } from "@apollo/client/link/context";

export function generateNhostApolloClient(options: NhostApolloClientOptions) {
  const getheaders = (auth: NhostAuth | undefined) => {
    // add headers
    const resHeaders = {
      ...options.headers,
    };

    // add auth headers if signed in
    // or add 'public' role if not signed in
    if (auth) {
      if (auth.isAuthenticated()) {
        resHeaders.authorization = `Bearer ${auth.getJWTToken()}`;
      } else {
        resHeaders.role = options.publicRole || "public";
      }
    }

    return resHeaders;
  };

  const ssr = typeof window === "undefined";
  const uri = options.gqlEndpoint;

  const wsUri = uri.startsWith("https")
    ? uri.replace(/^https/, "wss")
    : uri.replace(/^http/, "ws");

  const wsLink = !ssr
    ? new WebSocketLink({
        uri: wsUri,
        options: {
          reconnect: true,
          lazy: true,
          connectionParams: () => {
            const connectionHeaders = getheaders(options.auth);
            return {
              headers: connectionHeaders,
            };
          },
        },
      })
    : null;

  const httplink = createHttpLink({
    uri,
  });

  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        ...getheaders(options.auth),
      },
    };
  });

  // What does this do?
  const link = !ssr
    ? split(
        ({ query }) => {
          const { kind, operation } = getMainDefinition(
            query
          ) as OperationDefinitionNode;
          return kind === "OperationDefinition" && operation === "subscription";
        },
        wsLink as ApolloLink,
        authLink.concat(httplink)
      )
    : httplink;

  const apolloClientOptions: ApolloClientOptions<any> = {
    ssrMode: ssr,
    cache: options.cache || new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network",
      },
    },
    connectToDevTools: options.connectToDevTools,
  };

  // add link
  if (typeof options.onError === "function") {
    apolloClientOptions.link = from([options.onError as RequestHandler, link]);
  } else {
    apolloClientOptions.link = from([link]);
  }

  const client = new ApolloClient(apolloClientOptions);

  return { client, wsLink };
}
