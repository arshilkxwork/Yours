import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useAuthStore, useProfileStore } from '@/store';
import { isLiveSupabaseConfigured } from '@/lib/authService';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { setProfile } = useProfileStore();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [dob, setDob] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access to set a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Name Required', 'Please enter a display name.');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      let avatarUrl: string | null = null;

      // Upload avatar if selected and live Supabase connected
      if (avatar && isLiveSupabaseConfigured()) {
        try {
          const ext = avatar.split('.').pop() ?? 'jpg';
          const path = `avatars/${user.id}.${ext}`;
          const response = await fetch(avatar);
          const blob = await response.blob();
          const { error: uploadError } = await supabase.storage
            .from('private-media')
            .upload(path, blob, { upsert: true, contentType: `image/${ext}` });
          if (!uploadError) {
            const { data } = supabase.storage.from('private-media').getPublicUrl(path);
            avatarUrl = data.publicUrl;
          }
        } catch {
          avatarUrl = avatar;
        }
      } else if (avatar) {
        avatarUrl = avatar;
      }

      if (isLiveSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            display_name: displayName.trim(),
            bio: bio.trim() || null,
            date_of_birth: dob || null,
            avatar_url: avatarUrl,
          })
          .select()
          .single();

        if (error) {
          Alert.alert('Error', error.message);
        } else {
          setProfile(data);
          router.push('/(onboarding)/theme-pick');
        }
      } else {
        // Local mode fallback
        setProfile({
          id: user.id,
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          date_of_birth: dob || null,
          avatar_url: avatarUrl,
        });
        router.push('/(onboarding)/theme-pick');
      }
    } catch {
      // Local fallback on network failure
      setProfile({
        id: user.id,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        date_of_birth: dob || null,
        avatar_url: avatar,
      });
      router.push('/(onboarding)/theme-pick');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <LinearGradient colors={['#FFF8F3', '#F4DCE5']} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step indicator */}
        <View style={styles.steps}>
          {[1,2,3,4].map(i => (
            <View key={i} style={[styles.step, i === 1 && styles.stepActive]} />
          ))}
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Tell Us About You</Text>
          <Text variant="body" style={{ color: Colors.mutedText, textAlign: 'center', marginTop: 8 }}>
            This is how your partner will see you.
          </Text>
        </View>

        {/* Avatar picker */}
        <TouchableOpacity onPress={pickAvatar} style={styles.avatarPicker}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={{ fontSize: 36 }}>🌸</Text>
              <Text variant="caption" style={{ color: Colors.dustyRose, marginTop: 4 }}>Add Photo</Text>
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Text style={{ fontSize: 14 }}>✏️</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.form}>
          <Input
            label="Display Name"
            placeholder="What should we call you?"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            leftIcon={<Text>✨</Text>}
          />
          <Input
            label="A little about you (optional)"
            placeholder="A sentence or two..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
          <Input
            label="Date of Birth (optional)"
            placeholder="YYYY-MM-DD"
            value={dob}
            onChangeText={setDob}
            keyboardType="numeric"
            leftIcon={<Text>🎂</Text>}
            hint="This lets your partner know when to celebrate you."
          />

          <Button
            title="Continue"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleSave}
            style={{ backgroundColor: Colors.dustyRose, marginTop: 8 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, alignItems: 'center' },
  steps: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  step: { width: 24, height: 4, borderRadius: 2, backgroundColor: Colors.roseMid },
  stepActive: { backgroundColor: Colors.dustyRose, width: 40 },
  header: { alignItems: 'center', marginBottom: 28 },
  title: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 30, color: Colors.plum, textAlign: 'center' },
  avatarPicker: { marginBottom: 28, position: 'relative' },
  avatarImage: { width: 108, height: 108, borderRadius: 54, borderWidth: 3, borderColor: Colors.dustyRose },
  avatarPlaceholder: {
    width: 108, height: 108, borderRadius: 54,
    backgroundColor: Colors.blush, borderWidth: 2, borderColor: Colors.roseMid,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.dustyRose, alignItems: 'center', justifyContent: 'center',
  },
  form: { width: '100%', gap: 16 },
});
