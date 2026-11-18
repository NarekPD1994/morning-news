import { router } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, StoryRow } from '../../components/ui';
import { useStore } from '../../lib/store';
import { C, F } from '../../lib/theme';

export default function Saved() {
  const s = useStore();
  const insets = useSafeAreaInsets();
  const items = s.sortItems(s.allItems.filter(i => s.marks[i.id]?.saved));
  return (
    <FlatList
      style={{ backgroundColor: C.bg }}
      data={items}
      keyExtractor={i => i.id}
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 30, gap: 10 }}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: 22, gap: 8, paddingBottom: 8 }}>
          <Text style={st.eyebrow}>● SAVED</Text>
          <Text style={st.h1}>Read it <Text style={{ fontFamily: F.serifItalic }}>later</Text></Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16 }}>
          <StoryRow
            item={item}
            onPress={() => router.push({ pathname: '/story/[id]', params: { id: item.id } })}
            onSave={() => s.setMark(item.id, { saved: false })}
          />
        </View>
      )}
      ListEmptyComponent={
        <View style={st.empty}>
          <Icon name="saved" size={28} color={C.sub} />
          <Text style={st.emptyH}>Nothing saved yet</Text>
          <Text style={st.lede}>Tap the bookmark on any story to keep it here.</Text>
        </View>
      }
    />
  );
}

const st = StyleSheet.create({
  eyebrow: { fontFamily: F.medium, fontSize: 11.5, letterSpacing: 2.2, color: C.sub },
  h1: { fontFamily: F.serif, fontSize: 40, lineHeight: 42, color: C.ink },
  lede: { fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.sub, textAlign: 'center' },
  empty: { alignItems: 'center', gap: 8, padding: 40 },
  emptyH: { fontFamily: F.medium, fontSize: 17, color: C.ink },
});
