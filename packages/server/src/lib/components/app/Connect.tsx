import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useChainId, useSwitchChain } from "wagmi";
import { hardhat, mainnet } from "viem/chains";
import { useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { useTheme } from "../../context/theme-provider";
import Icon from "../custom/Icon";
import { truncateAddress } from "../../utils";

export function Connect() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const isProd = process.env.NODE_ENV === "production";
  const correctChainId = isProd ? mainnet.id : hardhat.id;
  const correctChainName = isProd ? "Ethereum Mainnet" : "Hardhat";

  const { ready, authenticated, user, login: privyLogin, logout: privyLogout } = usePrivy();
  const currentChainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  const isWalletConnected = ready && authenticated && user?.wallet?.address;
  const isOnCorrectNetwork = !!currentChainId && currentChainId === correctChainId;

  const displayName = "Anonymous";
  const walletAddress = truncateAddress(user?.wallet?.address || "");
  const avatarUrl = undefined;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
  };

  const handleConnect = () => {
    try {
      privyLogin();
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  const handleSwitchNetwork = () => {
    try {
      switchChain({ chainId: correctChainId });
    } catch (err) {
      console.error("Failed to switch network:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await privyLogout();
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  const handleProfileClick = () => {
    // Navigate to profile page
    console.log("Profile clicked");
  };

  const handleSettingsClick = () => {
    // Navigate to settings page
    console.log("Settings clicked");
  };

  const handleNotificationsClick = () => {
    // Navigate to notifications page
    console.log("Notifications clicked");
  };

  const handleHelpClick = () => {
    // Navigate to help page
    console.log("Help clicked");
  };

  const handleBillingClick = () => {
    // Navigate to billing page
    console.log("Billing clicked");
  };

  const handleSecurityClick = () => {
    // Navigate to security page
    console.log("Security clicked");
  };

  const handleDocumentationClick = () => {
    // Navigate to documentation page
    console.log("Documentation clicked");
  };

  const handleRegisterAsLawyer = () => {
    navigate({ to: '/onboarding' });
    setIsOpen(false);
  };

  // Loading state
  if (!ready) {
    return (
      <Button disabled variant="outline" className="rounded-md">
        <Skeleton className="w-24 h-4 bg-muted" />
      </Button>
    );
  }

  // Not connected
  if (!isWalletConnected) {
    return (
      <Button onClick={handleConnect} variant="secondary" className="border relative h-12 w-auto rounded-lg p-3">
        <div className="flex items-center gap-3">
          <Icon name="Wallet" className="h-4 w-4" />
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium leading-none">Connect Wallet</span>
          </div>
        </div>
      </Button>
    );
  }

  // Wrong network
  if (!isOnCorrectNetwork) {
    const currentNetworkName = currentChainId === mainnet.id ? "Ethereum Mainnet" : currentChainId === hardhat.id ? "Hardhat" : `Chain ID ${currentChainId}`;

    return (
      <div className="flex items-center gap-3">
        <Button onClick={handleSwitchNetwork} disabled={isSwitchingChain} variant="destructive" className="py-2 px-4 rounded-md">
          {isSwitchingChain ? (
            <div className="flex items-center">
              <Icon name="Loader" className="size-4 mr-2 animate-spin" />
              Switching...
            </div>
          ) : (
            <div className="flex items-center">
              <Icon name="CircleAlert" className="size-4 mr-2" />
              Wrong network: {currentNetworkName}
            </div>
          )}
        </Button>
        <Button onClick={handleLogout} variant="outline" className="py-2 px-4 rounded-md">
          <Icon name="X" className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          className="border relative h-12 w-auto rounded-lg p-3"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="text-xs bg-primary text-white font-medium">
                {getInitials(displayName || "User")}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium leading-none">
                {displayName}
              </span>
            </div>
            <Icon name="ChevronDown" className="h-4 w-4 text-muted-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {walletAddress && (
              <p className="text-xs leading-none text-muted-foreground">
                {walletAddress}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* User Actions */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleProfileClick}>
            <Icon name="User" className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRegisterAsLawyer}>
            <Icon name="Scale" className="mr-2 h-4 w-4" />
            <span>Register as a lawyer</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSettingsClick}>
            <Icon name="Settings" className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleNotificationsClick}>
            <Icon name="Bell" className="mr-2 h-4 w-4" />
            <span>Notifications</span>
            <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Account Management */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleBillingClick}>
            <Icon name="CreditCard" className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSecurityClick}>
            <Icon name="Shield" className="mr-2 h-4 w-4" />
            <span>Security</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Theme Toggle */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleThemeChange("light")}>
            <Icon name="Sun" className="mr-2 h-4 w-4" />
            <span>Light</span>
            {theme === "light" && <DropdownMenuShortcut>✓</DropdownMenuShortcut>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
            <Icon name="Moon" className="mr-2 h-4 w-4" />
            <span>Dark</span>
            {theme === "dark" && <DropdownMenuShortcut>✓</DropdownMenuShortcut>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleThemeChange("system")}>
            <Icon name="Monitor" className="mr-2 h-4 w-4" />
            <span>System</span>
            {theme === "system" && <DropdownMenuShortcut>✓</DropdownMenuShortcut>}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Help & Support */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleHelpClick}>
            <Icon name="CircleHelp" className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDocumentationClick}>
            <Icon name="BookOpen" className="mr-2 h-4 w-4" />
            <span>Documentation</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Logout */}
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <Icon name="LogOut" className="mr-2 h-4 w-4" />
          <span>Log out</span>
          <DropdownMenuShortcut>⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
