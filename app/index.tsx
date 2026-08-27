import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth-context';

export default function AuthGate() {
  const { session, account, profile, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite dark:bg-dark-bg">
        <ActivityIndicator color="#62C58F" size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/welcome" />;
  }

  if (!account?.onboarding_completed || !profile) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(app)" />;
}
