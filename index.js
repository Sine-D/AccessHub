import React from 'react';
import { registerRootComponent } from 'expo';
import AppMobile from './src/AppMobile';
import { AccessibilityProvider } from './src/core/context/AccessibilityContext';
import { AppStateProvider } from './src/core/context/AppStateContext';

function Root() {
  return (
    <AccessibilityProvider>
      <AppStateProvider>
        <AppMobile />
      </AppStateProvider>
    </AccessibilityProvider>
  );
}

registerRootComponent(Root);
