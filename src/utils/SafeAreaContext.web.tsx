import React from 'react';
import { View, type ViewProps } from 'react-native';

export const SafeAreaProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => <>{children}</>;

export const SafeAreaView: React.FC<ViewProps> = ({ children, ...props }) => (
  <View {...props}>{children}</View>
);