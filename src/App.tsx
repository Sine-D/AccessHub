import React from 'react';
import { RouteFocus } from './core/navigation/RouteFocus';
import { VoiceCommandControl } from './features/ai-assistant/components/VoiceCommandControl';
import { AccessibilityProvider } from './core/context/AccessibilityContext';
import { AppStateProvider } from './core/context/AppStateContext';
import { DeviceFrame } from './core/components/layout/DeviceFrame';
import { AppNavigator } from './core/navigation/AppNavigator';
import { AiAssistantModal } from './features/ai-assistant';
import { SellProductModal } from './features/marketplace';
import { saveRating } from './services/ratingsService';

export const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <AppStateProvider>
        <DeviceFrame>
          <div id="application-screen" className="h-full"><AppNavigator /></div>
          <RouteFocus />
          <AiAssistantModal />
          <SellProductModal />
          <VoiceCommandControl />
        </DeviceFrame>
      </AppStateProvider>
    </AccessibilityProvider>
  );
};

export default App;
