// app/(tabs)/drafts.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/UserContext';
import { useDrafts } from '../../src/context/DraftContext';
import DraftCard from '../../src/components/DraftCard';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Drafts' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'published', label: 'Published' },
];

export default function DraftsScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { drafts, filteredDrafts, filter, setFilter, fetchDrafts, deleteDraft, setCurrentDraft } = useDrafts();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const styles = createStyles(theme, isDarkMode, insets);

  useEffect(() => { fetchDrafts(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDrafts();
    setRefreshing(false);
  }, [fetchDrafts]);

  const handleDraftPress = (draft) => {
    setCurrentDraft(draft);
    router.push(`/editor/${draft.id}`);
  };

  const handleDraftLongPress = (draft) => {
    Alert.alert(`"${draft.title || 'Untitled Draft'}"`, 'Choose an action', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => Alert.alert('Delete Draft?', 'This cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete', style: 'destructive',
            onPress: async () => {
              const r = await deleteDraft(draft.id);
              if (!r.success) Alert.alert('Error', 'Failed to delete draft.');
            },
          },
        ]),
      },
    ]);
  };

  const counts = {
    all: drafts.length,
    draft: drafts.filter((d) => d.status === 'draft').length,
    scheduled: drafts.filter((d) => d.status === 'scheduled').length,
    published: drafts.filter((d) => d.status === 'published').length,
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <View style={styles.emptyIconLine} />
        <View style={[styles.emptyIconLine, styles.emptyIconLineShort]} />
        <View style={styles.emptyIconLine} />
      </View>
      <Text style={styles.emptyTitle}>
        {filter === 'scheduled' ? 'No scheduled posts' : 'No drafts yet'}
      </Text>
      <Text style={styles.emptySub}>
        {filter === 'all' ? 'Record your first voice post to get started' : ''}
      </Text>
      {filter === 'all' && (
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/record')}
          style={styles.emptyBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyBtnText}>Create Voice Post</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Drafts</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{drafts.length}</Text>
          </View>
        </View>

        {/* Filter */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
                {f.label}
              </Text>
              {counts[f.key] > 0 && (
                <View style={[styles.filterBadge, filter === f.key && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, filter === f.key && styles.filterBadgeTextActive]}>
                    {counts[f.key]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <FlatList
          data={filteredDrafts}
          renderItem={({ item }) => (
            <DraftCard
              draft={item}
              onPress={() => handleDraftPress(item)}
              onLongPress={() => handleDraftLongPress(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            filteredDrafts.length === 0 && styles.listEmpty,
            { paddingBottom: insets.bottom + 24 },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme, isDarkMode, insets) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.bg },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 8 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 20, marginTop: 4,
  },
  title: {
    fontSize: 26, fontWeight: '700',
    color: theme.text, letterSpacing: -0.5, flex: 1,
  },
  countBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: theme.surfaceHigh,
    borderWidth: 1, borderColor: theme.border,
  },
  countBadgeText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },

  filterRow: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 4,
    marginBottom: 18,
    gap: 4,
  },
  filterTab: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 10,
    gap: 6,
  },
  filterTabActive: { backgroundColor: theme.primary },
  filterTabText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  filterTabTextActive: { color: '#fff' },
  filterBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: theme.surfaceHigh,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: theme.textMuted },
  filterBadgeTextActive: { color: '#fff' },

  list: { paddingTop: 2 },
  listEmpty: { flex: 1 },

  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingBottom: 60,
  },
  emptyIconWrap: {
    width: 52, height: 52,
    justifyContent: 'center', alignItems: 'flex-start',
    gap: 8, marginBottom: 24,
    padding: 10,
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1, borderColor: theme.border,
  },
  emptyIconLine: {
    height: 2.5, width: 32,
    backgroundColor: theme.border,
    borderRadius: 2,
  },
  emptyIconLineShort: { width: 20 },
  emptyTitle: {
    fontSize: 17, fontWeight: '600',
    color: theme.text, marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13, color: theme.textMuted,
    textAlign: 'center', lineHeight: 19,
    marginBottom: 28,
  },
  emptyBtn: {
    paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: 14, backgroundColor: theme.primary,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});