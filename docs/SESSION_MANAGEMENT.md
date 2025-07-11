# Session Management System

The STR Certified app now includes comprehensive session management with configurable timeouts and inactivity detection.

## Features

### 🔒 **Automatic Session Management**
- **Inactivity Detection**: Monitors mouse, keyboard, touch, and scroll events
- **Configurable Timeouts**: Different settings for inspector vs admin users
- **Warning System**: Shows countdown before automatic logout
- **Manual Extension**: Users can extend sessions during warnings

### ⏱️ **Timeout Configuration**

#### **Inspector App (Mobile Field Workers)**
- **Development**: 2 minutes inactivity → 30 second warning
- **Production**: 110 minutes inactivity → 10 minute warning
- **Maximum Session**: 12 hours (field work requires longer sessions)

#### **Admin Portal (Desktop Users)**
- **Development**: 2 minutes inactivity → 30 second warning  
- **Production**: 50 minutes inactivity → 10 minute warning
- **Maximum Session**: 8 hours (office work, tighter security)

### 🎯 **User Experience**

#### **Session Warning Modal**
When inactivity timeout is reached:
1. **Modal appears** with countdown timer
2. **Visual urgency indicators**:
   - Yellow border (default warning)
   - Orange border (last 3 minutes)
   - Red border (last minute)
3. **User options**:
   - "Stay Logged In" - extends session
   - "Logout Now" - immediate logout

#### **Automatic Extensions**
Any user activity during warning automatically:
- Resets the inactivity timer
- Dismisses the warning modal
- Continues the session normally

### 📊 **Current Session Behavior**

#### **Default Supabase Settings**
- **JWT Token Duration**: 1 hour (auto-refreshes)
- **Session Persistence**: Indefinite (until configured timeouts)
- **Storage**: Browser LocalStorage
- **Auto-refresh**: Enabled

#### **New Session Controls**
- **Inactivity Timeouts**: Configurable per app type
- **Maximum Duration**: Prevents indefinite sessions
- **Activity Monitoring**: Real-time user interaction tracking
- **Graceful Logout**: Clean session termination

## Implementation Details

### **Session Manager Hook**
```typescript
const { sessionState, extendSession, logout } = useSessionManager({
  inactivityTimeoutMs: 110 * 60 * 1000,
  warningDurationMs: 10 * 60 * 1000,
  maxSessionDurationMs: 12 * 60 * 60 * 1000,
  enableRememberMe: true
});
```

### **Activity Events Monitored**
- `mousedown`, `mousemove`
- `keypress`, `scroll`
- `touchstart`, `click`

### **Session State**
```typescript
interface SessionState {
  isActive: boolean;
  showWarning: boolean;
  timeUntilLogout: number; // seconds
  timeUntilExpiry: number; // seconds
  lastActivity: Date | null;
  sessionStartTime: Date | null;
}
```

## Security Benefits

### **Enhanced Security**
- **Prevents abandoned sessions** from staying active indefinitely
- **Configurable timeouts** based on user role and risk level
- **Activity validation** ensures only active users maintain sessions
- **Graceful warnings** prevent unexpected logouts

### **User-Friendly Features**
- **Visual countdown** shows exact logout time
- **Easy extension** with single click
- **Activity detection** automatically extends sessions
- **Role-based timeouts** appropriate for different user types

## Development Testing

### **Quick Testing (Development Mode)**
- **Inactivity Warning**: Appears after 2 minutes of no activity
- **Warning Duration**: 30 seconds to respond
- **Maximum Session**: 10 minutes total for quick testing

### **Console Logging**
The system logs all session events:
```
🔒 Session manager initialized
🔄 Session activity updated: 2:30:15 PM
📅 Session warning scheduled for 2:32:15 PM
⚠️ Showing inactivity warning
🚪 Session timeout - forcing logout: inactivity
```

## Future Enhancements

### **Planned Features**
- **Remember Me Toggle**: User-configurable session persistence
- **Session History**: Track login patterns and devices
- **Advanced Security**: Device/location change detection
- **Custom Timeouts**: Per-user configuration in settings

### **Analytics Integration**
- **Session Duration Tracking**: Monitor average session lengths
- **Timeout Effectiveness**: Measure security vs usability balance
- **User Behavior**: Understand activity patterns

## Migration Notes

### **Backward Compatibility**
- **Existing sessions** continue working normally
- **No user action required** for existing functionality
- **Progressive enhancement** - new features don't break old behavior

### **Configuration Changes**
- **No environment variables** required for basic functionality
- **Default settings** work out of the box
- **Configurable** via code for custom requirements

This system provides the perfect balance of security and usability, ensuring sessions remain active for working users while automatically securing abandoned sessions.