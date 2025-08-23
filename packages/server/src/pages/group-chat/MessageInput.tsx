import { useState, KeyboardEvent } from "react";
import { motion } from "motion/react";
import { Send, Paperclip, Smile } from "lucide-react";
import { Button } from "@/src/lib/components/ui/button";
import { Input } from "@/src/lib/components/ui/input";
import { cn } from "@/src/lib/utils";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border-t border-border p-4"
    >
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200",
        isFocused 
          ? "border-primary/50 bg-background shadow-sm" 
          : "border-border bg-muted/30"
      )}>
        {/* Attachment Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          disabled={disabled}
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        {/* Message Input */}
        <div className="flex-1">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Type your message..."
            disabled={disabled}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          />
        </div>

        {/* Emoji Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          disabled={disabled}
        >
          <Smile className="w-4 h-4" />
        </Button>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="sm"
          className={cn(
            "h-8 w-8 p-0 transition-all duration-200",
            message.trim() 
              ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Typing indicator area (can be extended later) */}
      <div className="mt-1">
        {/* Future: typing indicators, message status, etc. */}
      </div>
    </motion.div>
  );
}
