import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { BrowserRouter as Router } from 'react-router-dom'

// required dependecies for apolloClient
import { ApolloProvider } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory'
import { AUTH_TOKEN } from './constants'
import { ApolloLink, split } from 'apollo-client-preset'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'

// create the connection of the graphql server that will get connected to apollo client
const httpLink = new HttpLink({ uri: 'http://localhost:4000' });

// middleware to manage authentification
const middlewareAuthLink = new ApolloLink((operation, forward) => {
    const token = localStorage.getItem(AUTH_TOKEN)
    const authorizationHeader = token ? `Bearer ${token}` : null

    operation.setContext({
        headers: {
            authorization: authorizationHeader
        }
    })

    return forward(operation)
})

const httpLinkWithAuthToken = middlewareAuthLink.concat(httpLink)

// create apollo websocket for the implementation of subscriptions with GraphQL
const wsLink = new WebSocketLink({
    uri: `ws://localhost:4000`,
    options: {
        reconnect: true,
        connectionParams: {
            authToken: localStorage.getItem(AUTH_TOKEN)
        }
    }
})

const link = split(
    ({ query }) => {
        const { kind, operation } = getMainDefinition(query)
        return kind === 'OperationDefinition' && operation === 'subscription'
    },
    wsLink,
    httpLinkWithAuthToken
)

// Instatiate the apollo client with the link created to the graphql server and a new instance of InMemoryCache
const client = new ApolloClient({
    link: link,
    cache: new InMemoryCache()
});

// Render the root of the react application wrapped in high order component, 'ApolloProvider' that gets the client passed as a prop
ReactDOM.render(
    <Router>
        <ApolloProvider client={client}>
            <App />
        </ApolloProvider>
    </Router>, 
    document.getElementById('root'));
registerServiceWorker();
