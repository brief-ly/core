import React from 'react';
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import Icon from "./Icon";

interface AuthProtectorProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  showWalletRequired?: boolean;
}

interface UseAuthProtectionProps {
  showWalletRequired?: boolean;
}

interface UseAuthProtectionReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  executeProtected: <T extends any[], R>(
    action: (...args: T) => R | Promise<R>,
    ...args: T
  ) => Promise<R | void>;
}

/**
 * Higher Order Component that protects any content behind authentication
 * @param children - The content to render when authenticated
 * @param fallback - Custom component to show when not authenticated (optional)
 * @param loadingComponent - Custom loading component (optional)
 * @param showWalletRequired - Whether to require wallet connection (default: true)
 */
export function AuthProtector({ 
  children, 
  fallback, 
  loadingComponent,
  showWalletRequired = true 
}: AuthProtectorProps) {
  const { ready, authenticated, user, login: privyLogin } = usePrivy();

  const isWalletConnected = ready && authenticated && user?.wallet?.address;
  const isAuthenticated = showWalletRequired ? isWalletConnected : (ready && authenticated);

  const handleConnect = () => {
    try {
      privyLogin();
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  // Loading state
  if (!ready) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-32 h-8 bg-muted" />
          <Skeleton className="w-24 h-4 bg-muted" />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="rounded-full bg-muted p-6">
            <Icon name="Lock" className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Authentication Required</h3>
            <p className="text-sm text-muted-foreground">
              {showWalletRequired 
                ? "You need to connect your wallet to access this content."
                : "You need to sign in to access this content."
              }
            </p>
          </div>
          <Button onClick={handleConnect} className="w-full max-w-xs">
            <Icon name="Wallet" className="h-4 w-4 mr-2" />
            {showWalletRequired ? "Connect Wallet" : "Sign In"}
          </Button>
        </div>
      </div>
    );
  }

  // Authenticated - render children
  return <>{children}</>;
}

/**
 * HOC version - wraps a component with auth protection
 */
export function withAuthProtection<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    loadingComponent?: React.ReactNode;
    showWalletRequired?: boolean;
  }
) {
  const WrappedComponent = (props: P) => {
    return (
      <AuthProtector
        fallback={options?.fallback}
        loadingComponent={options?.loadingComponent}
        showWalletRequired={options?.showWalletRequired}
      >
        <Component {...props} />
      </AuthProtector>
    );
  };

  WrappedComponent.displayName = `withAuthProtection(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook version - protects function calls with authentication
 */
export function useAuthProtection({ 
  showWalletRequired = false 
}: UseAuthProtectionProps = {}): UseAuthProtectionReturn {
  const { ready, authenticated, user, login: privyLogin } = usePrivy();

  const isWalletConnected = ready && authenticated && user?.wallet?.address;
  const isAuthenticated = showWalletRequired ? isWalletConnected : (ready && authenticated);
  const isLoading = !ready;

  const executeProtected = async <T extends any[], R>(
    action: (...args: T) => R | Promise<R>,
    ...args: T
  ): Promise<R | void> => {
    // Still loading Privy
    if (!ready) {
      return;
    }

    // Not authenticated - trigger login
    if (!isAuthenticated) {
      try {
        await privyLogin();
        // Don't execute action here - let the component handle it after auth state updates
        return;
      } catch (error) {
        console.error("Failed to authenticate:", error);
        return;
      }
    }

    // Already authenticated - execute the action
    return await action(...args);
  };

  return {
    isAuthenticated: !!isAuthenticated,
    isLoading: !!isLoading,
    executeProtected,
  };
}

export default AuthProtector;
