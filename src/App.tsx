import React from 'react';
import { AccessibilityProvider } from './core/context/AccessibilityContext';
import { AppStateProvider } from './core/context/AppStateContext';
import { DeviceFrame } from './core/components/layout/DeviceFrame';
import { AppNavigator } from './core/navigation/AppNavigator';
import { AiAssistantModal } from './features/ai-assistant';
import { SellProductModal } from './features/marketplace';
import { FreelancerRegistrationModal } from './features/services';

export const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <AppStateProvider>
        <DeviceFrame>
          <AppNavigator />
          <AiAssistantModal />
          <SellProductModal />
          <FreelancerRegistrationModal />
        </DeviceFrame>
      </AppStateProvider>
    </AccessibilityProvider>
  );
};

export default App;
