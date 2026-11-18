// Profile: picture, answers, notifications and leaving the brief.
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Button, Icon, Seg, TopicIcon, tap } from '../../components/ui';
import { disableDailyReminder, enableDailyReminder } from '../../lib/notify';
import { Priority, Profile, useStore } from '../../lib/store';
import { C, F, SWATCHES } from '../../lib/theme';

const EMOJI = ['😀', '😎', '🦊', '🐼', '🐱', '🦁', '🌸', '🌊', '🚀', '🎨', '☕', '⚡'];

export default function ProfileScreen() {
  const s = useStore();
  const insets = useSafeAreaInsets();
  const [d, setD] = useState<Profile>(s.profile);
  const [editPic, setEditPic] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => setD(s.profile), [s.profile]);
  const dirty = JSON.stringify({ ...d, avatar: '', avatarBg: '', notify: false }) !== JSON.stringify({ ...s.profile, avatar: '', avatarBg: '', notify: false });
  const set = (p: Partial<Profile>) => setD(x => ({ ...x, ...p }));

  async function pickPhoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
    if (r.canceled || !r.assets?.[0]) return;
    try {
      const ctx = ImageManipulator.ImageManipulator.manipulate(r.assets[0].uri).resize({ width: 256 });
      const img = await ctx.renderAsync();
      const out = await img.saveAsync({ base64: true, compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
      if (out.base64) await s.saveProfile({ avatar: `img:data:image/jpeg;base64,${out.base64}`, avatarBg: '' });
    } catch {
      setMsg("Couldn't use that photo. Try another one.");
    }
  }

  async function toggleNotify(on: boolean) {
    if (on) {
      const ok = await enableDailyReminder(s.ownerName);
      await s.saveProfile({ notify: ok });
      if (!ok) setMsg(Platform.OS === 'web' ? 'Reminders work in the phone app.' : 'Notifications are off for Morning Brief. Turn them on in your phone Settings.');
    } else {
      await disableDailyReminder();
      await s.saveProfile({ notify: false });
    }
  }

  function leave() {
    const go = async () => {
      await disableDailyReminder();
      await s.signOut();
      router.replace('/welcome');
    };
    if (Platform.OS === 'web') return go();
    Alert.alert('Leave this brief?', 'Your answers, saves and reads on this phone will be deleted. You will need your invite link to come back.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: go },
    ]);
  }

  return (
    <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 40, paddingHorizontal: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Pressable onPress={() => { tap(); setEditPic(!editPic); }} accessibilityRole="button" accessibilityLabel="Change your picture">
          <Avatar size={92} name={s.profile.name} avatar={s.profile.avatar} bg={s.profile.avatarBg} />
          <View style={st.badge}><Icon name="pen" size={13} color={C.onDark} /></View>
        </Pressable>
        <Text style={st.name}>{s.profile.name || 'Your profile'}</Text>
        <Text style={st.sub}>{[s.profile.role, 'Saved on this phone only'].filter(Boolean).join(' · ')}</Text>
        {s.profile.more ? <Text style={[st.sub, { textAlign: 'center' }]}>Wants more of: {s.profile.more}</Text> : null}
      </View>

      {editPic ? (
        <View style={st.card}>
          {Platform.OS !== 'web' ? <Button label="Choose a photo" kind="light" icon="plus" onPress={pickPhoto} /> : null}
          <View style={st.wrapRow}>
            {EMOJI.map(e => (
              <Pressable key={e} onPress={() => { tap(); s.saveProfile({ avatar: `emoji:${e}` }); }} style={[st.emo, s.profile.avatar === `emoji:${e}` && st.on]} accessibilityLabel={`Use ${e}`}>
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </Pressable>
            ))}
          </View>
          <View style={st.wrapRow}>
            {SWATCHES.map(c => (
              <Pressable key={c} onPress={() => { tap(); s.saveProfile({ avatarBg: c, avatar: s.profile.avatar?.startsWith('img:') ? '' : s.profile.avatar }); }} style={[st.sw, { backgroundColor: c }, s.profile.avatarBg === c && st.swOn]} accessibilityLabel={`Background ${c}`} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Done" onPress={() => setEditPic(false)} style={{ flex: 1 }} />
            <Button label="Use initials" kind="light" onPress={() => s.saveProfile({ avatar: '', avatarBg: '' })} style={{ flex: 1 }} />
          </View>
        </View>
      ) : null}

      <View style={st.card}>
        <Text style={st.h}>About you</Text>
        <Field label="Your name" value={d.name} onChange={v => set({ name: v })} />
        <Field label="What you do" value={d.role} onChange={v => set({ role: v })} />
        <Field label="Anything you want more of?" value={d.more} onChange={v => set({ more: v })} />
      </View>

      <View style={st.card}>
        <Text style={st.h}>Folders</Text>
        <Text style={st.sub}>More puts a folder first. Hide removes it from your feed.</Text>
        {[...new Set([...s.topics, ...Object.keys(d.priority).filter(k => d.priority[k] === 'off')])].map(t => (
          <View key={t} style={st.fRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TopicIcon topic={t} size={32} />
              <Text style={st.fName}>{s.topicName(t)}</Text>
            </View>
            <Seg<Priority> value={d.priority[t] || 'normal'} options={[['high', 'More'], ['normal', 'Normal'], ['off', 'Hide']]} onChange={v => set({ priority: { ...d.priority, [t]: v } })} />
          </View>
        ))}
      </View>

      <View style={st.card}>
        <Text style={st.h}>Reading</Text>
        <Text style={st.sub}>How should stories read?</Text>
        <Seg value={d.level} options={[['simple', 'Headlines'], ['detailed', 'Headline + summary']]} onChange={v => set({ level: v })} />
        <Text style={st.sub}>How many stories a day?</Text>
        <Seg value={d.count} options={[[5, 'Top 5'], [10, 'Top 10'], [0, 'All']]} onChange={v => set({ count: v })} />
      </View>

      {dirty ? (
        <Button label="Save changes" icon="saved" onPress={async () => {
          if (!d.name.trim()) { setMsg('Add your name first.'); return; }
          await s.saveProfile({ name: d.name, role: d.role, more: d.more, priority: d.priority, level: d.level, count: d.count });
          setMsg('Saved.');
        }} />
      ) : null}
      {msg ? <Text style={[st.sub, { textAlign: 'center' }]}>{msg}</Text> : null}

      <View style={[st.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={st.h}>Morning reminder</Text>
          <Text style={st.sub}>A notification at 8:20 when the new brief is ready.</Text>
        </View>
        <Switch value={!!s.profile.notify} onValueChange={toggleNotify} accessibilityLabel="Morning reminder" />
      </View>

      <View style={st.card}>
        <Text style={st.h}>About this brief</Text>
        <Text style={st.sub}>
          {s.ownerName}'s Morning Brief, shared with you{s.access?.topics.length ? ', including folders shared only with you' : ''}. Claude picks the stories every morning; your answers, saves and reads stay on this phone.
        </Text>
        <Button label="Leave this brief" kind="danger" onPress={leave} />
      </View>
    </ScrollView>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={st.sub}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} style={st.input} placeholderTextColor={C.sub} accessibilityLabel={label} />
    </View>
  );
}

const st = StyleSheet.create({
  badge: { position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.bg },
  name: { fontFamily: F.serif, fontSize: 34, color: C.ink, marginTop: 4 },
  sub: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.sub },
  card: { backgroundColor: C.card, borderRadius: 24, padding: 16, gap: 12 },
  h: { fontFamily: F.medium, fontSize: 17, color: C.ink },
  input: { height: 48, borderRadius: 14, backgroundColor: C.shell, paddingHorizontal: 14, fontFamily: F.regular, fontSize: 16, color: C.ink },
  fRow: { gap: 8, paddingVertical: 4 },
  fName: { fontFamily: F.medium, fontSize: 15, color: C.ink },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  emo: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.shell, alignItems: 'center', justifyContent: 'center' },
  on: { borderWidth: 2, borderColor: C.dark },
  sw: { width: 30, height: 30, borderRadius: 15 },
  swOn: { borderWidth: 3, borderColor: C.card, outlineColor: C.dark },
});
