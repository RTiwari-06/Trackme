import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../store'

interface AuthScreenProps {
  onAuthSuccess?: () => void
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const { setUser, setSession } = useAuthStore()

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password')
      return
    }

    setLoading(true)
    try {
      let result

      if (isSignUp) {
        result = await supabase.auth.signUp({
          email,
          password,
        })
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        })
      }

      if (result.error) {
        Alert.alert('Auth Error', result.error.message)
      } else if (result.data.user && result.data.session) {
        setSession(result.data.session)
        setUser({
          id: result.data.user.id,
          email: result.data.user.email || '',
          full_name: null,
          phone_number: null,
          profile_picture_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        Alert.alert('Success', isSignUp ? 'Account created!' : 'Logged in!')
        onAuthSuccess?.()
      }
    } catch (err) {
      Alert.alert('Error', String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TrackMe</Text>
      <Text style={styles.subtitle}>
        {isSignUp ? 'Create Account' : 'Sign In'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleAuth}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.link}>
          {isSignUp
            ? 'Already have an account? Sign In'
            : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#208AEF',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#208AEF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    textAlign: 'center',
    color: '#208AEF',
    marginTop: 20,
    fontSize: 14,
  },
})
