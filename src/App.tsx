import React from 'react';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AppStateProvider } from './context/AppStateContext';
import { DeviceFrame } from './components/layout/DeviceFrame';
import { AppNavigator } from './navigation/AppNavigator';
import { AiAssistantModal } from './components/ai/AiAssistantModal';
import { SellProductModal } from './components/modals/SellProductModal';

export const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <AppStateProvider>
        <DeviceFrame>
          <AppNavigator />
          <AiAssistantModal />
          <SellProductModal />
        </DeviceFrame>
      </AppStateProvider>
    </AccessibilityProvider>
  );
};

export default App;
