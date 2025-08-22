import { useState } from "react";
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
import { useTheme } from "../../context/theme-provider";
import Icon from "../custom/Icon";

export function UserDropdown() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Mock user data - replace with actual user data from your auth system
  const user = {
    name: "Kartikay Tiwari",
    email: "kartik100100@gmail.com",
    avatar: undefined, // Add user avatar URL here
  };

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

  const handleLogout = () => {
    // Implement logout logic here
    console.log("Logout clicked");
    setIsOpen(false);
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

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          className="relative h-12 w-auto rounded-lg p-3"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-xs bg-primary text-white font-medium">
                {getInitials(user.name || "User")}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium leading-none">
                {user.name}
              </span>
            </div>
            <Icon name="ChevronDown" className="h-4 w-4 text-muted-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* User Actions */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleProfileClick}>
            <Icon name="User" className="mr-2 h-4 w-4" />
            <span>Profile</span>
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
