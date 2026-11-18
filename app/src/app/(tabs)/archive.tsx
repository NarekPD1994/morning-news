// Archive: every story, grouped by week, with search.
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, StoryRow } from '../../components/ui';
import { useStore, weekOf } from '../../lib/store';
import { C, F } from '../../lib/theme';

function weekLabel(monday: string) {
  const a = new Date(monday + 'T00:00:00');
  const b = new Date(a);
  b.setDate(a.getDate() + 6);
  const f = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${f(a)} – ${f(b)}`;
}

export default function Archive() {
  const s = useStore();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const sections = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const list = s.sortItems(s.allItems).filter(i =>
      !ql || [i.title, i.summary, i.why, i.source, s.topicName(i.topic)].join(' ').toLowerCase().includes(ql));
    const groups = new Map<string, typeof list>();
    list.forEach(i => {
      const w = weekOf(i.date);
      if (!groups.has(w)) groups.set(w, []);
      groups.get(w)!.push(i);
    });
    return [...groups.entries()].map(([w, data]) => ({
      key: w, title: weekLabel(w), headline: s.feed?.weeks.find(x => x.id === w)?.headline, data,
    }));
  }, [s, q]);

  return (
    <SectionList
      style={{ backgroundColor: C.bg }}
      sections={sections}
      keyExtractor={i => i.id}
      stickySectionHeadersEnabled={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 30 }}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: 22, gap: 10, paddingBottom: 6 }}>
          <Text style={st.eyebrow}>● ARCHIVE</Text>
          <Text style={st.h1}>Every story, <Text style={{ fontFamily: F.serifItalic }}>kept</Text></Text>
          <View style={st.search}>
            <Icon name="search" size={17} color={C.sub} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search every story"
              placeholderTextColor={C.sub}
              style={st.searchI}
              returnKeyType="search"
              accessibilityLabel="Search every story"
            />
          </View>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View style={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 10, gap: 2 }}>
          <Text style={st.wk}>{section.title} · {section.data.length} stories</Text>
          {section.headline ? <Text style={st.wkH}>{section.headline}</Text> : null}
        </View>
      )}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
          <StoryRow
            item={item}
            onPress={() => router.push({ pathname: '/story/[id]', params: { id: item.id } })}
            onSave={() => s.setMark(item.id, { saved: !s.marks[item.id]?.saved })}
          />
        </View>
      )}
      ListEmptyComponent={<Text style={[st.wk, { textAlign: 'center', padding: 30 }]}>{q ? 'No stories match that search.' : 'No stories yet.'}</Text>}
    />
  );
}

const st = StyleSheet.create({
  eyebrow: { fontFamily: F.medium, fontSize: 11.5, letterSpacing: 2.2, color: C.sub },
  h1: { fontFamily: F.serif, fontSize: 40, lineHeight: 42, color: C.ink },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, borderRadius: 999, backgroundColor: C.card, paddingHorizontal: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: C.hair },
  searchI: { flex: 1, fontFamily: F.regular, fontSize: 16, color: C.ink, height: '100%' },
  wk: { fontFamily: F.medium, fontSize: 13, color: C.sub },
  wkH: { fontFamily: F.serif, fontSize: 22, lineHeight: 26, color: C.ink },
});
