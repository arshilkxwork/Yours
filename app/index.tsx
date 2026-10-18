import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store';

export default function RootIndex() {
  const { session } = useAuthStore();

  if (session) {
    return <Redirect href="/(home)" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
