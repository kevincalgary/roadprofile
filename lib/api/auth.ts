import { supabase } from '../supabase';
import * as Linking from 'expo-linking';

export async function signUpWithEmail(email: string, password: string) {
  const redirectTo = Linking.createURL('verify-email');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function sendPasswordReset(email: string) {
  const redirectTo = Linking.createURL('reset-password');
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function resendVerificationEmail(email: string) {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
}

/**
 * Apple/Google sign-in via Supabase's OAuth flow, opened in an in-app
 * browser and completed by exchanging the returned code for a session.
 * Requires the provider to be configured in the Supabase dashboard first —
 * see docs/SETUP.md. Safe to call even when a provider isn't configured;
 * Supabase will return a clear error surfaced to the caller.
 */
export async function signInWithOAuth(provider: 'apple' | 'google') {
  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  return data;
}

export async function exchangeCodeForSession(url: string) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(url);
  if (error) throw error;
  return data;
}
