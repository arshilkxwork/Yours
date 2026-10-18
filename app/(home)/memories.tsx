import React, { useState, useCallback } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, Modal,
  TextInput, Alert, Image, Dimensions, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { AppData, AppMemory } from '@/lib/appData';
import { isLiveSupabaseConfigured } from '@/lib/authService';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 52) / 2;

interface Memory {
  id: string;
  photo_url: string;
  caption: string | null;
  memory_date: string | null;
  created_at: string;
  uploader_id: string;
}

function MemoryCard({ memory, onPress }: { memory: Memory; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeInUp.duration(400)}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.memoryCard}>
        <Image source={{ uri: memory.photo_url }} style={styles.memoryImage} />
        {memory.caption && (
          <View style={[styles.captionOverlay, { backgroundColor: colors.plum + 'CC' }]}>
            <Text variant="caption" style={{ color: '#fff' }}>{memory.caption}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MemoriesScreen() {
  const { colors, accentColor } = useTheme();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [memoryDate, setMemoryDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [viewMemory, setViewMemory] = useState<Memory | null>(null);

  const { data: memories = [], isLoading, refetch } = useQuery({
    queryKey: ['memories', user?.id],
    queryFn: async () => {
      // 1. Load persistent visual journal memories
      const localMems = await AppData.getMemories();

      // 2. If live Supabase cloud connected, sync with Supabase
      if (isLiveSupabaseConfigured() && user) {
        try {
          const { data: couple } = await supabase
            .from('couples')
            .select('id')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .single();
          if (couple) {
            const { data } = await supabase
              .from('memories')
              .select('*')
              .eq('couple_id', couple.id)
              .order('created_at', { ascending: false });
            if (data && data.length > 0) return data;
          }
        } catch { /* noop */ }
      }
      return localMems;
    },
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo access to add moments.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const addMemory = async () => {
    if (!selectedImage) return;
    setUploading(true);
    try {
      // Save locally to persistent AppData
      await AppData.saveMemory(selectedImage, caption.trim() || null, memoryDate || null);

      // Upload to Supabase if live cloud connected
      if (isLiveSupabaseConfigured() && user) {
        try {
          const { data: couple } = await supabase
            .from('couples')
            .select('id')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .single();
          if (couple) {
            const ext = selectedImage.split('.').pop() ?? 'jpg';
            const path = `memories/${couple.id}/${Date.now()}.${ext}`;
            const response = await fetch(selectedImage);
            const blob = await response.blob();
            await supabase.storage
              .from('private-media')
              .upload(path, blob, { contentType: `image/${ext}` });
            const { data: urlData } = supabase.storage.from('private-media').getPublicUrl(path);

            await supabase.from('memories').insert({
              couple_id: couple.id,
              uploader_id: user.id,
              photo_url: urlData.publicUrl,
              caption: caption.trim() || null,
              memory_date: memoryDate || null,
            });
          }
        } catch (err) {
          console.warn('Supabase cloud memory sync skipped:', err);
        }
      }

      setShowAddModal(false);
      setSelectedImage(null);
      setCaption('');
      setMemoryDate('');
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    } catch {
      Alert.alert('Error', 'Could not save memory. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.header }]}>
        <View>
          <Text variant="caption" style={{ color: colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            PHOTO SCRAPBOOK
          </Text>
          <Text variant="heading" style={{ color: colors.text, fontSize: 28, marginTop: 2 }}>
            Visual Journal
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={[styles.addBtn, { backgroundColor: Colors.taupe }]}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Memory grid */}
      {isLoading ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48 }}>⏳</Text>
          <Text variant="body" style={{ color: colors.textMuted }}>Loading journal photos...</Text>
        </View>
      ) : memories.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>📸</Text>
          <Text variant="subheading" style={{ color: colors.text }}>No Photos Yet</Text>
          <Text variant="body" align="center" style={{ color: colors.textMuted, marginTop: 8, lineHeight: 24 }}>
            Capture and document peaceful moments.{'\n'}Tap + to upload your first photo.
          </Text>
          <Button
            title="Add First Photo"
            size="md"
            onPress={() => setShowAddModal(true)}
            style={{ backgroundColor: Colors.taupe, marginTop: 24 }}
          />
        </View>
      ) : (
        <FlatList
          data={memories}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 12 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetch(); }} tintColor={accentColor} />}
          renderItem={({ item }) => (
            <MemoryCard memory={item} onPress={() => setViewMemory(item)} />
          )}
        />
      )}

      {/* Add Memory Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowAddModal(false); setSelectedImage(null); }}>
              <Text variant="bodyMedium" style={{ color: accentColor }}>Cancel</Text>
            </TouchableOpacity>
            <Text variant="subheading" style={{ color: colors.text }}>Add Memory</Text>
            <TouchableOpacity onPress={addMemory} disabled={!selectedImage || uploading}>
              <Text variant="bodyMedium" style={{ color: selectedImage ? accentColor : colors.textSubtle }}>
                {uploading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={pickImage} style={[styles.imagePicker, { backgroundColor: colors.blush, borderColor: accentColor }]}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePickerContent}>
                <Text style={{ fontSize: 48 }}>🖼️</Text>
                <Text variant="body" style={{ color: colors.textMuted, marginTop: 8 }}>Tap to choose a photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.modalForm}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption..."
              placeholderTextColor={colors.textSubtle}
              multiline
              style={[styles.captionInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
            />
            <TextInput
              value={memoryDate}
              onChangeText={setMemoryDate}
              placeholder="Date (YYYY-MM-DD, optional)"
              placeholderTextColor={colors.textSubtle}
              keyboardType="numeric"
              style={[styles.dateInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
            />
          </View>
        </View>
      </Modal>

      {/* View Memory Modal */}
      <Modal visible={!!viewMemory} animationType="fade" transparent>
        <View style={styles.viewModal}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setViewMemory(null)} />
          {viewMemory && (
            <View style={styles.viewContent}>
              <Image source={{ uri: viewMemory.photo_url }} style={styles.viewImage} resizeMode="contain" />
              {viewMemory.caption && (
                <Text variant="body" align="center" style={{ color: '#fff', marginTop: 16, paddingHorizontal: 24 }}>
                  {viewMemory.caption}
                </Text>
              )}
              {viewMemory.memory_date && (
                <Text variant="caption" align="center" style={{ color: '#FFFFFF80', marginTop: 8 }}>
                  {viewMemory.memory_date}
                </Text>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.roseLight,
  },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  grid: { padding: 16, paddingBottom: 110, gap: 12 },
  memoryCard: { flex: 1, borderRadius: 16, overflow: 'hidden', aspectRatio: 1 },
  memoryImage: { width: '100%', height: '100%' },
  captionOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 8, borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  modalContainer: { flex: 1, paddingHorizontal: 20 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.roseLight,
  },
  imagePicker: {
    height: 280, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed',
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginVertical: 20,
  },
  imagePickerContent: { alignItems: 'center' },
  selectedImage: { width: '100%', height: '100%' },
  modalForm: { gap: 12 },
  captionInput: {
    borderRadius: 12, borderWidth: 1.5, padding: 14, minHeight: 80,
    fontFamily: 'Inter_400Regular', fontSize: 15, textAlignVertical: 'top',
  },
  dateInput: {
    borderRadius: 12, borderWidth: 1.5, padding: 14,
    fontFamily: 'Inter_400Regular', fontSize: 15,
  },
  viewModal: {
    flex: 1, backgroundColor: '#000000E0',
    alignItems: 'center', justifyContent: 'center',
  },
  viewContent: { width: '100%', alignItems: 'center' },
  viewImage: { width: '100%', height: 400 },
});
