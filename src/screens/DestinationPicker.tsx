import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { supabase } from '../services/supabase'
import { useAuthStore, useDestinationStore } from '../store'
import { Destination } from '../types/database'

type Props = {
  visible: boolean
  onClose: () => void
  onSelect: (destination: Destination) => void
}

const PRESET_ADDRESSES: Record<string, { address?: string; category?: string }> = {
  Home: { address: 'Connaught Place, New Delhi', category: 'home' },
  College: { address: 'North Campus, DU', category: 'college' },
}

export default function DestinationPicker({ visible, onClose, onSelect }: Props) {
  const { destinations, setDestinations, addDestination } = useDestinationStore()
  const { user } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    loadDestinations()
  }, [visible])

  async function loadDestinations() {
    const { data, error } = await supabase
      .from('destinations')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    if (data) {
      setDestinations(data as Destination[])
    }
  }

  async function saveDestination() {
    const trimmed = name.trim()
    if (!trimmed) {
      Alert.alert('Validation', 'Please enter a destination name')
      return
    }

    if (!user) {
      Alert.alert('Error', 'You must be signed in to save a destination')
      return
    }

    setSaving(true)
    try {
      // Use current location as default lat/lng until geocoding is wired.
      const { data, error } = await supabase
        .from('destinations')
        .insert({
          user_id: user.id,
          name: trimmed,
          address: address.trim() || PRESET_ADDRESSES[trimmed]?.address || 'Set in map',
          category: PRESET_ADDRESSES[trimmed]?.category || 'custom',
          latitude: 28.6304, // placeholder: Delhi Centroid; replace with map-pin geocode later
          longitude: 77.2177,
        })
        .select()
        .single()

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      if (data) {
        addDestination(data as Destination)
        onSelect(data as Destination)
        resetForm()
        onClose()
      }
    } catch (err) {
      Alert.alert('Error', String(err))
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setName('')
    setAddress('')
    setEditingId(null)
  }

  function selectPreset(preset: string) {
    setName(preset)
    setAddress(PRESET_ADDRESSES[preset]?.address || '')
    setEditingId(null)
  }

  function selectExisting(d: Destination) {
    onSelect(d)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        style={styles.backdrop}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>Select Destination</Text>

          <View style={styles.presetsRow}>
            {Object.keys(PRESET_ADDRESSES).map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.preset,
                  name === preset && styles.presetActive,
                ]}
                onPress={() => selectPreset(preset)}
              >
                <Text
                  style={[
                    styles.presetText,
                    name === preset && styles.presetTextActive,
                  ]}
                >
                  {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            placeholder="Destination name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <TextInput
            placeholder="Address (optional)"
            value={address}
            onChangeText={setAddress}
            style={[styles.input, styles.addressInput]}
          />

          <View style={styles.actions}>
            <TouchableOpacity
              disabled={saving}
              onPress={saveDestination}
              style={[styles.primaryBtn, saving && styles.disabled]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {editingId ? 'Update' : 'Save & Select'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                resetForm()
                onClose()
              }}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.listHeader}>Saved</Text>
          <View style={styles.list}>
            {destinations.length === 0 ? (
              <Text style={styles.empty}>No saved destinations yet.</Text>
            ) : (
              destinations.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={styles.listItem}
                  onPress={() => selectExisting(d)}
                >
                  <View>
                    <Text style={styles.listItemTitle}>{d.name}</Text>
                    <Text style={styles.listItemSub}>{d.address}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    paddingBottom: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  preset: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f7f7f7',
  },
  presetActive: {
    backgroundColor: '#208AEF',
    borderColor: '#208AEF',
  },
  presetText: { textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#333' },
  presetTextActive: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  addressInput: { marginBottom: 14 },
  actions: { gap: 10, marginBottom: 18 },
  primaryBtn: {
    backgroundColor: '#208AEF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#f2f2f2',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#333', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.65 },
  listHeader: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 8, textTransform: 'uppercase' },
  list: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    overflow: 'hidden',
  },
  empty: { padding: 12, color: '#888', fontSize: 14 },
  listItem: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemTitle: { fontSize: 15, fontWeight: '600' },
  listItemSub: { fontSize: 13, color: '#666', marginTop: 2 },
  chevron: { fontSize: 22, color: '#999' },
})
