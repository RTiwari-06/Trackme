import React, { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Linking from 'expo-linking'

import { supabase } from '../services/supabase'
import { useAuthStore } from '../store'

// Palette — navy + TrackMe blue (trust) with a warm amber beacon (arrival) as
// the one signature accent. See the journey-line motif in the hero.
const C = {
  ink: '#0E1830',
  inkLine: 'rgba(255,255,255,0.22)',
  primary: '#208AEF',
  primaryPressed: '#1B72C4',
  beacon: '#FFB020',
  surface: '#FFFFFF',
  field: '#F4F6FA',
  fieldBorder: '#E3E8F0',
  text: '#101828',
  muted: '#6B7488',
  danger: '#D33A3F',
  dangerBg: '#FCECEC',
  success: '#1F8A4C',
  successBg: '#E7F6EE',
}

type Mode = 'signin' | 'signup' | 'reset'
type Banner = { kind: 'error' | 'success'; text: string } | null

const COPY: Record<Mode, { title: string; subtitle: string; cta: string }> = {
  signin: {
    title: 'Welcome back',
    subtitle: 'Sign in to start sharing your journey.',
    cta: 'Sign in',
  },
  signup: {
    title: 'Create your account',
    subtitle: 'Set up TrackMe so someone can follow you home.',
    cta: 'Create account',
  },
  reset: {
    title: 'Reset your password',
    subtitle: 'Enter your email and we’ll send a reset link.',
    cta: 'Send reset link',
  },
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function mapUser(u: any) {
  return {
    id: u.id,
    email: u.email || '',
    full_name: u.user_metadata?.full_name ?? null,
    phone_number: u.user_metadata?.phone_number ?? null,
    profile_picture_url: u.user_metadata?.avatar_url ?? null,
    created_at: u.created_at,
    updated_at: u.updated_at || new Date().toISOString(),
  }
}

// Turn Supabase's terse messages into something a traveler can act on.
function friendly(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email or password is incorrect.'
  if (m.includes('email not confirmed')) return 'Confirm your email first — check your inbox for the link.'
  if (m.includes('already registered')) return 'That email already has an account. Try signing in.'
  if (m.includes('rate limit')) return 'Too many attempts. Wait a minute and try again.'
  return message
}

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState<Banner>(null)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [focused, setFocused] = useState<'email' | 'password' | null>(null)
  const { setUser, setSession } = useAuthStore()

  const copy = COPY[mode]

  function switchMode(next: Mode) {
    setMode(next)
    setErrors({})
    setBanner(null)
    if (next === 'reset') setPassword('')
  }

  function validate(): boolean {
    const next: { email?: string; password?: string } = {}
    const mail = email.trim()
    if (!mail) next.email = 'Enter your email.'
    else if (!EMAIL_RE.test(mail)) next.email = 'That email doesn’t look right.'
    if (mode !== 'reset') {
      if (!password) next.password = 'Enter your password.'
      else if (password.length < 6) next.password = 'Use at least 6 characters.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    setBanner(null)
    if (!validate()) return
    const mail = email.trim()
    setLoading(true)
    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(mail, {
          redirectTo: Linking.createURL('/auth'),
        })
        if (error) {
          setBanner({ kind: 'error', text: friendly(error.message) })
          return
        }
        setBanner({ kind: 'success', text: `Reset link sent to ${mail}. Check your inbox.` })
        return
      }

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: mail, password })
        if (error) {
          setBanner({ kind: 'error', text: friendly(error.message) })
          return
        }
        // Auto-confirmed projects return a session; the RootLayout guard then
        // redirects to the map.
        if (data.session && data.user) {
          setSession(data.session)
          setUser(mapUser(data.user))
          return
        }
        // Email confirmation is on — nudge the traveler to their inbox.
        setBanner({
          kind: 'success',
          text: 'Account created. Check your email to confirm, then sign in.',
        })
        setPassword('')
        setMode('signin')
        return
      }

      // signin
      const { data, error } = await supabase.auth.signInWithPassword({ email: mail, password })
      if (error) {
        setBanner({ kind: 'error', text: friendly(error.message) })
        return
      }
      if (data.session && data.user) {
        setSession(data.session)
        setUser(mapUser(data.user))
      }
    } catch {
      setBanner({ kind: 'error', text: 'Something went wrong. Check your connection and try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero — the journey-line signature: origin dot → dashed route → pin */}
          <SafeAreaView edges={['top']} style={styles.hero}>
            <View style={styles.brandRow}>
              <View style={styles.originDot} />
              <Text style={styles.wordmark}>TrackMe</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.destRow}>
              <View style={styles.destPin}>
                <View style={styles.destPinCore} />
              </View>
              <Text style={styles.tagline}>Reach safe. They’ll know.</Text>
            </View>
          </SafeAreaView>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.cardInner}>
              {mode === 'reset' ? (
                <Pressable
                  onPress={() => switchMode('signin')}
                  accessibilityRole="button"
                  style={styles.backLink}
                >
                  <Text style={styles.backLinkText}>← Back to sign in</Text>
                </Pressable>
              ) : (
                <View style={styles.segment}>
                  {(['signin', 'signup'] as const).map((m) => {
                    const active = mode === m
                    return (
                      <Pressable
                        key={m}
                        onPress={() => switchMode(m)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        style={[styles.segItem, active && styles.segItemActive]}
                      >
                        <Text style={[styles.segText, active && styles.segTextActive]}>
                          {m === 'signin' ? 'Sign in' : 'Create account'}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              )}

              <Text style={styles.title}>{copy.title}</Text>
              <Text style={styles.subtitle}>{copy.subtitle}</Text>

              {banner && (
                <View
                  style={[
                    styles.banner,
                    banner.kind === 'error' ? styles.bannerError : styles.bannerSuccess,
                  ]}
                >
                  <Text
                    style={[
                      styles.bannerText,
                      { color: banner.kind === 'error' ? C.danger : C.success },
                    ]}
                  >
                    {banner.text}
                  </Text>
                </View>
              )}

              {/* Email */}
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  focused === 'email' && styles.inputFocused,
                  errors.email && styles.inputError,
                ]}
                placeholder="you@example.com"
                placeholderTextColor={C.muted}
                value={email}
                onChangeText={(t) => {
                  setEmail(t)
                  if (errors.email) setErrors((e) => ({ ...e, email: undefined }))
                }}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={!loading}
                returnKeyType="next"
              />
              {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}

              {/* Password (hidden in reset mode) */}
              {mode !== 'reset' && (
                <>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Password</Text>
                    {mode === 'signin' && (
                      <Pressable
                        onPress={() => switchMode('reset')}
                        accessibilityRole="button"
                        hitSlop={8}
                      >
                        <Text style={styles.forgot}>Forgot?</Text>
                      </Pressable>
                    )}
                  </View>
                  <View
                    style={[
                      styles.passwordWrap,
                      focused === 'password' && styles.inputFocused,
                      errors.password && styles.inputError,
                    ]}
                  >
                    <TextInput
                      style={styles.passwordInput}
                      placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                      placeholderTextColor={C.muted}
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t)
                        if (errors.password) setErrors((e) => ({ ...e, password: undefined }))
                      }}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete={mode === 'signup' ? 'new-password' : 'password'}
                      textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                      editable={!loading}
                      returnKeyType="go"
                      onSubmitEditing={handleSubmit}
                    />
                    <Pressable
                      onPress={() => setShowPassword((s) => !s)}
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      hitSlop={8}
                    >
                      <Text style={styles.showToggle}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </Pressable>
                  </View>
                  {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
                </>
              )}

              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.cta,
                  pressed && styles.ctaPressed,
                  loading && styles.ctaDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaText}>{copy.cta}</Text>
                )}
              </Pressable>

              {mode === 'signup' && (
                <Text style={styles.legal}>
                  By creating an account you agree to share your location only with links you send.
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.ink },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },

  // Hero
  hero: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 40 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.primary,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  wordmark: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: 0.3 },
  routeLine: {
    width: 0,
    height: 30,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: C.inkLine,
    marginLeft: 5,
    marginVertical: 6,
  },
  destRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  destPin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,176,32,0.25)',
  },
  destPinCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.beacon },
  tagline: { color: 'rgba(255,255,255,0.72)', fontSize: 15, fontWeight: '500' },

  // Card
  card: {
    flexGrow: 1,
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  cardInner: { width: '100%', maxWidth: 440, alignSelf: 'center' },

  // Segmented toggle
  segment: {
    flexDirection: 'row',
    backgroundColor: C.field,
    borderRadius: 12,
    padding: 4,
    marginBottom: 22,
  },
  segItem: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  segItemActive: {
    backgroundColor: C.surface,
    shadowColor: '#0E1830',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segText: { fontSize: 14, fontWeight: '600', color: C.muted },
  segTextActive: { color: C.text },

  backLink: { marginBottom: 18 },
  backLinkText: { color: C.primary, fontSize: 14, fontWeight: '600' },

  title: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  subtitle: { fontSize: 15, color: C.muted, marginTop: 6, marginBottom: 18, lineHeight: 21 },

  // Banner (web-safe replacement for Alert)
  banner: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 18 },
  bannerError: { backgroundColor: C.dangerBg },
  bannerSuccess: { backgroundColor: C.successBg },
  bannerText: { fontSize: 14, fontWeight: '500', lineHeight: 20 },

  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 8,
  },
  forgot: { color: C.primary, fontSize: 13, fontWeight: '600', marginTop: 14 },

  input: {
    backgroundColor: C.field,
    borderWidth: 1.5,
    borderColor: C.fieldBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: C.text,
  },
  inputFocused: { borderColor: C.primary, backgroundColor: '#fff' },
  inputError: { borderColor: C.danger },

  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.field,
    borderWidth: 1.5,
    borderColor: C.fieldBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  passwordInput: { flex: 1, paddingVertical: 13, fontSize: 16, color: C.text },
  showToggle: { color: C.primary, fontSize: 13, fontWeight: '700', paddingLeft: 10 },

  fieldError: { color: C.danger, fontSize: 13, marginTop: 6 },

  cta: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  ctaPressed: { backgroundColor: C.primaryPressed },
  ctaDisabled: { opacity: 0.65 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },

  legal: { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 16, lineHeight: 18 },
})
