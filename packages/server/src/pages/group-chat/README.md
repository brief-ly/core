# Group Chat Feature

## Overview
This is a mock group chat UI that users see when they get accepted by a group of lawyers. The implementation includes real-time messaging, document sharing with payment integration, and lawyer profiles.

## Features

### 1. **Real-time Messaging**
- Text messages with timestamps
- System messages for important updates
- Message grouping by date
- Optimistic UI updates
- Typing indicators (ready for implementation)

### 2. **Lawyer Profiles**
- Individual lawyer information in sidebar
- Online/offline status
- Consultation fees
- Expertise and jurisdictions
- Quick navigation to full profiles

### 3. **Document Sharing & Payment**
- Secure document upload by lawyers
- Pay-per-document model
- Document preview and download
- Payment processing integration
- Document access control

### 4. **Responsive Design**
- Mobile-first approach
- Collapsible sidebar
- Touch-friendly interface
- Smooth animations with Motion

## Testing the Group Chat

### Option 1: **Through Search Flow (RECOMMENDED)**
1. **Search for legal help** on the home page (e.g., "employment contract dispute")
2. **Click "Request Consultation"** on any group you want to chat with
3. **Wait for success message** → automatically redirected to that specific group's chat
4. **See the real groupId** in the header showing which group you're chatting with

### Option 2: Direct URL Access
Navigate directly to: `/group-chat/{groupId}` (replace with actual group ID)
- Example: `/group-chat/123` or `/group-chat/456`

### Option 3: Add Test Button (Development Only)
Add this to your Home component for quick testing:

```tsx
// Add to imports
import { useNavigate } from "@tanstack/react-router";

// Add in component
const navigate = useNavigate();

// Add test button
<Button 
  onClick={() => navigate({ to: '/group-chat/$groupId', params: { groupId: '123' } })}
  variant="outline"
  className="fixed bottom-4 right-4 z-50"
>
  Test Group Chat
</Button>
```

### ✅ **What's Now Working**
- **Dynamic Group Loading**: Each group chat loads real data based on the groupId you clicked
- **Real API Integration**: Fetches group details, messages, and sends new messages to the correct group
- **Group ID Display**: Shows which group you're in (see header: "Group ID: {number}")
- **Automatic Navigation**: From search results → specific group chat seamlessly

## Mock Data

The component includes realistic mock data:
- **User**: Kartik (employment contract dispute)
- **Lawyers**: 
  - Sarah Chen (Employment Law Specialist)
  - Michael Rodriguez (Lead Attorney) 
  - Jennifer Park (Contract Law Expert)
- **Documents**: Non-compete guide ($50), Contract template ($25)
- **Messages**: 8 realistic conversation messages

## Integration Points

### API Hooks Used
- `getLawyerProfileByAccountId()` - Fetch lawyer details
- `sendGroupMessage()` - Send new messages
- `getGroupMessages()` - Fetch message history
- `payForDocument()` - Process document payments
- `downloadDocument()` - Download paid documents
- `createGroupRequest()` - Initial consultation request

### Navigation Integration
- Automatic redirect from SearchResults after successful consultation request
- Back navigation to home page
- Profile navigation for individual lawyers

## File Structure
```
/pages/group-chat/
├── index.tsx          # Main group chat component
├── MessageInput.tsx   # Message input with send functionality
├── LawyerProfile.tsx  # Individual lawyer profile cards
├── DocumentList.tsx   # Document sharing with payments
└── README.md         # This documentation
```

## Customization

### Adding New Message Types
Extend the `messageType` union in the main component:
```tsx
messageType: "text" | "document" | "system" | "image" | "video"
```

### Payment Integration
The document payment system is ready for real payment provider integration:
- Stripe, PayPal, or crypto payments
- Escrow services
- Automatic lawyer payouts

### Real-time Features
Ready for WebSocket integration:
- Live message updates
- Typing indicators
- Online presence
- Push notifications

## Next Steps
1. Connect to real WebSocket for live messaging
2. Integrate actual payment processing
3. Add file upload for client documents
4. Implement video/voice calling
5. Add message search functionality
6. Create message threading/replies
