// Today: headline, folders, category tabs and today's stories.
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Chips, FolderCard, StoryRow } from '../../components/ui';
import { fmtDay, useStore } from '../../lib/store';
import { C, F } from '../../lib/theme';

export default function Today() {
  const s = useStore();
  const insets = useSafeAreaInsets();
  const [topic, setTopic] = useState('');
  const items = s.today();
  const digest = s.feed?.digests.find(d => d.id === s.latestDate);
  const byTopic = useMemo(() => {
    const m: Record<string, typeof items> = {};
    items.forEach(i => (m[i.topic] = m[i.topic] || []).push(i));
    return m;
  }, [items]);
  const shown = topic ? items.filter(i => i.topic === topic) : items;
  const mins = Math.max(1, Math.round(items.reduce((a, i) => a + (i.mins || 2), 0)));
  const tabs = [{ key: '', label: 'All', count: items.length, icon: 'all' }].concat(
    s.topics.filter(t => byTopic[t]?.length).map(t => ({ key: t, label: s.topicName(t), count: byTopic[t].length, icon: s.topicIcon(t), color: s.topicColor(t) })),
  );

  const header = (
    <View style={{ gap: 18, paddingBottom: 6 }}>
      <View style={[st.bar, { paddingTop: insets.top + 10 }]}>
        <View style={st.datePill}>
          <Text style={st.dateT}>{s.latestDate ? fmtDay(s.latestDate) : 'Morning Brief'}</Text>
        </View>
        <Pressable onPress={() => router.navigate('/profile')} accessibilityRole="button" accessibilityLabel="Open your profile">
          <Avatar size={46} name={s.profile.name} avatar={s.profile.avatar} bg={s.profile.avatarBg} />
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: 22, gap: 10 }}>
        <Text style={st.eyebrow}>● MORNING BRIEF{s.latestDate ? ` · ${fmtDay(s.latestDate).toUpperCase()}` : ''}</Text>
        <Text style={st.h1}>{digest?.headline || (items.length ? "Today's stories" : 'Your first brief is on its way')}</Text>
        {digest?.lede ? <Text style={st.lede}>{digest.lede}</Text> : null}
        {items.length ? (
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            <Pill text={`${items.length} stories`} />
            <Pill text={`${mins} min`} />
            <Pill text={`${items.filter(i => !s.marks[i.id]?.read).length} unread`} />
          </View>
        ) : null}
      </View>
      {items.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 20 }}>
          {s.topics.map(t => (
            <FolderCard key={t} topic={t} items={byTopic[t] || []} selected={topic === t} onPress={() => setTopic(topic === t ? '' : t)} />
          ))}
        </ScrollView>
      ) : null}
      {items.length ? <Chips items={tabs} value={topic} onChange={setTopic} /> : null}
      {s.error ? <Text style={[st.lede, { paddingHorizontal: 22, color: '#d70015' }]}>{s.error}</Text> : null}
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: C.bg }}
      data={shown}
      keyExtractor={i => i.id}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: 30, gap: 10 }}
      refreshControl={<RefreshControl refreshing={s.loading} onRefresh={s.refresh} tintColor={C.ink} />}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16 }}>
          <StoryRow
            item={item}
            onPress={() => router.push({ pathname: '/story/[id]', params: { id: item.id } })}
            onSave={() => s.setMark(item.id, { saved: !s.marks[item.id]?.saved })}
          />
        </View>
      )}
      ListEmptyComponent={
        <Text style={[st.lede, { textAlign: 'center', padding: 30 }]}>
          {s.loading ? 'Loading today’s stories…' : 'No stories here yet. Pull down to refresh.'}
        </Text>
      }
    />
  );
}

function Pill({ text }: { text: string }) {
  return (
    <View style={st.pill}><Text style={st.pillT}>{text}</Text></View>
  );
}

const st = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  datePill: { height: 46, borderRadius: 999, backgroundColor: C.card, paddingHorizontal: 18, justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: C.hair },
  dateT: { fontFamily: F.medium, fontSize: 15, color: C.ink },
  eyebrow: { fontFamily: F.medium, fontSize: 11.5, letterSpacing: 2.2, color: C.sub },
  h1: { fontFamily: F.serif, fontSize: 38, lineHeight: 40, color: C.ink, letterSpacing: -0.4 },
  lede: { fontFamily: F.regular, fontSize: 15.5, lineHeight: 22, color: C.sub },
  pill: { backgroundColor: C.shell, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  pillT: { fontFamily: F.medium, fontSize: 13, color: C.ink },
});
