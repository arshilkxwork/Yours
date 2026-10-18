import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, Alert, TouchableOpacity, Share, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function PartnerInviteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [mode, setMode] = useState<'generate' | 'join'>('generate');
  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeGenerated, setCodeGenerated] = useState(false);

  const generateInvite = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from('invitations').insert({
        code,
        created_by: user.id,
        expires_at: expiresAt,
        used: false,
      });
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setGeneratedCode(code);
        setCodeGenerated(true);
      }
    } catch {
      Alert.alert('Error', 'Could not generate invite code.');
    } finally {
      setLoading(false);
    }
  };

  const shareCode = async () => {
    try {
      await Share.share({
        message: `💌 I'm inviting you to our private space on Whisper.\n\nUse this invite code: ${generatedCode}\n\nThe code expires in 72 hours.`,
        title: 'Join me on Whisper',
      });
    } catch { /* noop */ }
  };

  const joinWithCode = async () => {
    if (!inviteCode.trim() || inviteCode.trim().length < 6) {
      Alert.alert('Invalid Code', 'Please enter a valid invite code.');
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      // Look up the invitation
      const { data: inv, error: invErr } = await supabase
        .from('invitations')
        .select('*')
        .eq('code', inviteCode.trim().toUpperCase())
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (invErr || !inv) {
        Alert.alert('Invalid Code', 'This code is expired, already used, or not found.');
        setLoading(false);
        return;
      }
      if (inv.created_by === user.id) {
        Alert.alert('Oops', 'You cannot use your own invite code.');
        setLoading(false);
        return;
      }

      // Create couple relationship
      const { error: coupleErr } = await supabase.from('couples').insert({
        user1_id: inv.created_by,
        user2_id: user.id,
      });
      if (coupleErr) {
        Alert.alert('Error', coupleErr.message);
        setLoading(false);
        return;
      }

      // Mark invite as used
      await supabase.from('invitations').update({ used: true }).eq('id', inv.id);

      router.push('/(onboarding)/secret-gesture');
    } catch {
      Alert.alert('Error', 'Could not join. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#FFF8F3', '#F4DCE5']} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.steps}>
          {[1,2,3,4].map(i => (
            <View key={i} style={[styles.step, { backgroundColor: Colors.roseMid }, i === 3 && { backgroundColor: Colors.dustyRose, width: 40 }]} />
          ))}
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Connect With Your Partner</Text>
          <Text variant="body" style={{ color: Colors.mutedText, textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
            One of you generates an invite code and the other enters it. The connection is secure and unique to the two of you.
          </Text>
        </View>

        {/* Mode tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setMode('generate')}
            style={[styles.tab, mode === 'generate' && styles.tabActive]}
          >
            <Text variant="label" style={{ color: mode === 'generate' ? '#fff' : Colors.mutedText }}>
              Generate Code
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('join')}
            style={[styles.tab, mode === 'join' && styles.tabActive]}
          >
            <Text variant="label" style={{ color: mode === 'join' ? '#fff' : Colors.mutedText }}>
              Enter Code
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'generate' ? (
          <View style={styles.section}>
            {!codeGenerated ? (
              <>
                <Text variant="body" align="center" style={{ color: Colors.mutedText, marginBottom: 20, lineHeight: 22 }}>
                  Generate a unique code and share it with your partner. The code expires in 72 hours.
                </Text>
                <Button
                  title="Generate Invite Code"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onPress={generateInvite}
                  style={{ backgroundColor: Colors.dustyRose }}
                />
              </>
            ) : (
              <View style={styles.codeDisplay}>
                <Text variant="caption" style={{ color: Colors.mutedText, marginBottom: 8 }}>YOUR INVITE CODE</Text>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{generatedCode}</Text>
                </View>
                <Text variant="caption" align="center" style={{ color: Colors.softGray, marginTop: 8 }}>
                  Valid for 72 hours · One use only
                </Text>
                <Button
                  title="Share Code"
                  size="md"
                  onPress={shareCode}
                  style={{ backgroundColor: Colors.dustyRose, marginTop: 16 }}
                />
                <Button
                  title="My partner has joined →"
                  variant="ghost"
                  size="md"
                  onPress={() => router.push('/(onboarding)/secret-gesture')}
                  style={{ marginTop: 8 }}
                />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Input
              label="Invite Code"
              placeholder="e.g. WXYZ1234"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              maxLength={8}
              style={{ letterSpacing: 4, textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 20 }}
              hint="Ask your partner for their invite code."
            />
            <Button
              title="Join Our Space"
              size="lg"
              fullWidth
              loading={loading}
              onPress={joinWithCode}
              style={{ backgroundColor: Colors.dustyRose }}
            />
          </View>
        )}

        <Button
          title="Set up later"
          variant="ghost"
          size="sm"
          onPress={() => router.push('/(onboarding)/secret-gesture')}
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, alignItems: 'center' },
  steps: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  step: { width: 24, height: 4, borderRadius: 2 },
  header: { alignItems: 'center', marginBottom: 28 },
  title: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, color: Colors.plum, textAlign: 'center' },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.roseLight,
    borderRadius: 12, padding: 4, marginBottom: 24, width: '100%',
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: Colors.dustyRose },
  section: { width: '100%', gap: 16 },
  codeDisplay: { alignItems: 'center', width: '100%' },
  codeBox: {
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 20,
    paddingHorizontal: 32, borderWidth: 2, borderColor: Colors.roseMid,
    marginTop: 4,
  },
  codeText: {
    fontFamily: 'Inter_700Bold', fontSize: 28, color: Colors.plum,
    letterSpacing: 6, textAlign: 'center',
  },
});
