// Story details, shown as a sheet.
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, TopicIcon } from '../../components/ui';
import { fmtDay, useStore } from '../../lib/store';
import { C, F, tint } from '../../lib/theme';

export default function Story() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useStore();
  const insets = useSafeAreaInsets();
  const item = s.allItems.find(i => i.id === id);
  const m = (item && s.marks[item.id]) || {};

  useEffect(() => {
    if (item && !s.marks[item.id]?.read) s.setMark(item.id, { read: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (!item)
    return (
      <View style={{ flex: 1, padding: 24, backgroundColor: C.card }}>
        <Text style={st.body}>This story isn't available any more.</Text>
      </View>
    );
  const col = s.topicColor(item.topic);
  return (
    <ScrollView style={{ backgroundColor: C.card }} contentContainerStyle={[st.wrap, { paddingBottom: insets.bottom + 28 }]}>
      <View style={st.head}>
        <TopicIcon topic={item.topic} size={48} />
        <Text style={st.meta} numberOfLines={2}>
          {s.topicName(item.topic)} · {fmtDay(item.date)} · {item.mins || 2} min
        </Text>
        <Pressable onPress={() => router.back()} style={st.close} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={{ fontSize: 18, color: C.ink }}>✕</Text>
        </Pressable>
      </View>
      {item.must ? <View style={st.must}><Text style={st.mustT}>Must-read</Text></View> : null}
      <Text style={st.title}>{item.title}</Text>
      {item.summary ? <Text style={st.body}>{item.summary}</Text> : null}
      {item.why ? (
        <View style={[st.why, { backgroundColor: tint(col, 0.12) }]}>
          <Text style={st.whyH}>Why {s.ownerName} picked it</Text>
          <Text style={st.whyT}>{item.why}</Text>
        </View>
      ) : null}
      {item.source ? <Text style={st.src}>Source: {item.source}</Text> : null}
      <View style={{ gap: 10, marginTop: 6 }}>
        {item.url ? <Button label="Read the article" icon="link" onPress={() => WebBrowser.openBrowserAsync(item.url!)} /> : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            label={m.saved ? 'Saved' : 'Save for later'}
            kind="light"
            icon="saved"
            style={{ flex: 1 }}
            onPress={() => s.setMark(item.id, { saved: !m.saved })}
          />
          <Button
            label={m.read ? 'Mark unread' : 'Mark read'}
            kind="light"
            style={{ flex: 1 }}
            onPress={() => s.setMark(item.id, { read: !m.read })}
          />
        </View>
      </View>
      <View style={{ height: 8 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.6 }}>
        <Icon name="book" size={12} color={C.sub} />
        <Text style={st.src}>Picked by Claude for {s.ownerName}'s Morning Brief</Text>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  wrap: { padding: 22, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { flex: 1, fontFamily: F.regular, fontSize: 13, color: C.sub },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.shell, alignItems: 'center', justifyContent: 'center' },
  must: { alignSelf: 'flex-start', backgroundColor: C.hot, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  mustT: { color: '#fff', fontFamily: F.medium, fontSize: 13 },
  title: { fontFamily: F.medium, fontSize: 24, lineHeight: 30, color: C.ink },
  body: { fontFamily: F.regular, fontSize: 16.5, lineHeight: 25, color: C.ink },
  why: { borderRadius: 18, padding: 16, gap: 6 },
  whyH: { fontFamily: F.regular, fontSize: 13, color: C.sub },
  whyT: { fontFamily: F.regular, fontSize: 16, lineHeight: 24, color: C.ink },
  src: { fontFamily: F.regular, fontSize: 13, color: C.sub },
});
