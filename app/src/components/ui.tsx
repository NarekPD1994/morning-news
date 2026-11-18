// Shared building blocks: icons, avatar, buttons, segmented control, story row, folder card.
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Item } from '../lib/feed';
import { ICONS, STROKE_ICONS } from '../lib/icons';
import { initials, useStore } from '../lib/store';
import { C, F, shadow, tint } from '../lib/theme';

export const tap = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
};

/** An icon name from the shared set, "emoji:X" or "img:data:…". */
export function Icon({ name, size = 20, color = C.ink }: { name: string; size?: number; color?: string }) {
  if (name.startsWith('emoji:')) return <Text style={{ fontSize: size * 0.95, lineHeight: size * 1.15 }}>{name.slice(6)}</Text>;
  if (name.startsWith('img:data:image/'))
    return <Image source={{ uri: name.slice(4) }} style={{ width: size * 1.3, height: size * 1.3, borderRadius: size * 0.35 }} />;
  const shapes = ICONS[name] || ICONS.all;
  const stroke = STROKE_ICONS.has(name);
  const paint = stroke
    ? { fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
    : { fill: color };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {shapes.map((s, i) => {
        const { t, ...a } = s;
        const fr = a['fill-rule'] as 'evenodd' | undefined;
        if (t === 'rect')
          return <Rect key={i} x={a.x} y={a.y} width={a.width} height={a.height} rx={a.rx} {...paint} />;
        if (t === 'circle') return <Circle key={i} cx={a.cx} cy={a.cy} r={a.r} {...paint} />;
        return <Path key={i} d={a.d} fillRule={fr} clipRule={fr} {...paint} />;
      })}
    </Svg>
  );
}

export function TopicIcon({ topic, size = 40 }: { topic: string; size?: number }) {
  const s = useStore();
  const col = s.topicColor(topic);
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: tint(col), alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={s.topicIcon(topic)} size={size * 0.48} color={col} />
    </View>
  );
}

export function Avatar({ size = 44, name, avatar, bg }: { size?: number; name?: string; avatar?: string; bg?: string }) {
  const v = avatar || '';
  const img = v.startsWith('img:data:image/');
  const emo = v.startsWith('emoji:');
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
        backgroundColor: img ? C.shell : bg || (emo ? C.shell : '#6c7cf5'),
        borderWidth: 3, borderColor: C.card,
      }}>
      {img ? (
        <Image source={{ uri: v.slice(4) }} style={{ width: '100%', height: '100%' }} />
      ) : emo ? (
        <Text style={{ fontSize: size * 0.5 }}>{v.slice(6)}</Text>
      ) : name ? (
        <Text style={{ color: '#fff', fontFamily: F.medium, fontSize: size * 0.36 }}>{initials(name)}</Text>
      ) : (
        <Icon name="user" size={size * 0.45} color="#fff" />
      )}
    </View>
  );
}

export function Button({
  label, onPress, kind = 'dark', icon, style, disabled,
}: { label: string; onPress: () => void; kind?: 'dark' | 'light' | 'danger'; icon?: string; style?: ViewStyle; disabled?: boolean }) {
  const dark = kind === 'dark';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: dark ? C.dark : C.shell, opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        style,
      ]}>
      {icon ? <Icon name={icon} size={16} color={dark ? C.onDark : kind === 'danger' ? '#d70015' : C.ink} /> : null}
      <Text style={[styles.btnT, { color: dark ? C.onDark : kind === 'danger' ? '#d70015' : C.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function Seg<T extends string | number>({
  value, options, onChange,
}: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <View style={styles.seg} accessibilityRole="radiogroup">
      {options.map(([v, l]) => {
        const on = v === value;
        return (
          <Pressable
            key={String(v)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => { tap(); onChange(v); }}
            style={[styles.segI, on && { backgroundColor: C.dark }]}>
            <Text style={[styles.segT, { color: on ? C.onDark : C.ink }]}>{l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chips({
  items, value, onChange,
}: { items: { key: string; label: string; count?: number; icon?: string; color?: string }[]; value: string; onChange: (k: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 20 }}>
      {items.map(it => {
        const on = it.key === value;
        return (
          <Pressable
            key={it.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => { tap(); onChange(it.key); }}
            style={[styles.chip, on ? { backgroundColor: C.dark } : { backgroundColor: C.card }]}>
            {it.icon ? <Icon name={it.icon} size={15} color={on ? C.onDark : it.color || C.ink} /> : null}
            <Text style={[styles.chipT, { color: on ? C.onDark : C.ink }]}>{it.label}</Text>
            {it.count != null ? (
              <View style={[styles.chipN, { backgroundColor: on ? 'rgba(255,255,255,0.18)' : C.shell }]}>
                <Text style={{ fontFamily: F.medium, fontSize: 11, color: on ? C.onDark : C.sub }}>{it.count}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function StoryRow({ item, onPress, onSave }: { item: Item; onPress: () => void; onSave: () => void }) {
  const s = useStore();
  const m = s.marks[item.id] || {};
  return (
    <View style={[styles.row, m.read && { opacity: 0.62 }]}>
      <Pressable style={styles.rowMain} onPress={onPress} accessibilityRole="button" accessibilityLabel={item.title}>
        <TopicIcon topic={item.topic} size={42} />
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {item.must ? (
              <View style={styles.must}><Text style={styles.mustT}>Must-read</Text></View>
            ) : null}
            <Text style={styles.meta} numberOfLines={1}>
              {s.topicName(item.topic)} · {item.mins || 2} min
            </Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          {s.profile.level === 'detailed' && item.summary ? (
            <Text style={styles.sum} numberOfLines={2}>{item.summary}</Text>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        onPress={() => { tap(); onSave(); }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={m.saved ? 'Remove from saved' : 'Save for later'}
        style={[styles.saveBtn, m.saved && { backgroundColor: C.dark }]}>
        <Icon name="saved" size={16} color={m.saved ? C.onDark : C.sub} />
      </Pressable>
    </View>
  );
}

export function FolderCard({
  topic, items, onPress, selected,
}: { topic: string; items: Item[]; onPress: () => void; selected?: boolean }) {
  const s = useStore();
  const col = s.topicColor(topic);
  const papers = items.slice(0, 2);
  return (
    <Pressable onPress={() => { tap(); onPress(); }} style={{ width: 132 }} accessibilityRole="button" accessibilityLabel={`${s.topicName(topic)}, ${items.length} stories`}>
      <View style={{ height: 104 }}>
        <View style={[styles.fBack, { backgroundColor: tint(col, 0.22) }]} />
        {(papers.length ? papers : [null, null]).map((p, i) => (
          <View
            key={i}
            style={[styles.paper, { left: i ? 58 : 10, backgroundColor: p ? col : C.card, transform: [{ rotate: i ? '6deg' : '-7deg' }] }]}>
            {p ? <Text style={styles.paperT} numberOfLines={3}>{p.title}</Text> : null}
          </View>
        ))}
        <View style={[styles.fFront, selected && { borderColor: C.dark, borderWidth: 2 }]}>
          <View style={styles.fIcon}><Icon name={s.topicIcon(topic)} size={16} color={col} /></View>
        </View>
      </View>
      <Text style={styles.fName} numberOfLines={1}>{s.topicName(topic)}</Text>
      <Text style={styles.fCount}>{items.length ? `${items.length} today` : 'Nothing yet'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { height: 48, borderRadius: 999, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnT: { fontFamily: F.medium, fontSize: 15 },
  seg: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 999, padding: 4, gap: 2, borderWidth: StyleSheet.hairlineWidth, borderColor: C.hair, alignSelf: 'flex-start' },
  segI: { paddingHorizontal: 14, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  segT: { fontFamily: F.medium, fontSize: 13.5 },
  chip: { height: 40, borderRadius: 999, paddingLeft: 12, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: StyleSheet.hairlineWidth, borderColor: C.hair },
  chipT: { fontFamily: F.medium, fontSize: 14 },
  chipN: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 22, padding: 12, paddingRight: 10, gap: 8, ...shadow, shadowOpacity: 0.06 },
  rowMain: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  meta: { fontFamily: F.regular, fontSize: 12.5, color: C.sub, flexShrink: 1 },
  title: { fontFamily: F.medium, fontSize: 16, lineHeight: 21, color: C.ink },
  sum: { fontFamily: F.regular, fontSize: 13.5, lineHeight: 19, color: C.sub },
  must: { backgroundColor: C.hot, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  mustT: { color: '#fff', fontFamily: F.medium, fontSize: 11 },
  saveBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.shell, alignItems: 'center', justifyContent: 'center' },
  fBack: { position: 'absolute', left: 4, right: 4, top: 6, bottom: 0, borderRadius: 20 },
  paper: { position: 'absolute', top: 0, width: 62, height: 74, borderRadius: 10, padding: 7, borderWidth: 2, borderColor: '#fff' },
  paperT: { color: '#fff', fontFamily: F.medium, fontSize: 9, lineHeight: 11 },
  fFront: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.86)', borderWidth: StyleSheet.hairlineWidth, borderColor: C.hair, justifyContent: 'flex-end', padding: 8 },
  fIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow, shadowOpacity: 0.08, shadowRadius: 6 },
  fName: { fontFamily: F.medium, fontSize: 14.5, color: C.ink, marginTop: 8, textAlign: 'center' },
  fCount: { fontFamily: F.regular, fontSize: 12, color: C.sub, textAlign: 'center' },
});
