// Invite lock and the four onboarding questions.
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Button, Icon, Seg, TopicIcon } from '../components/ui';
import { parseInvite } from '../lib/feed';
import { enableDailyReminder } from '../lib/notify';
import { Priority, Profile, useStore } from '../lib/store';
import { C, F } from '../lib/theme';

const STEPS = ['who', 'folders', 'read', 'more'] as const;

export default function Welcome() {
  const s = useStore();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Profile>({ ...s.profile, name: s.profile.name || s.access?.name || '' });
  const set = (p: Partial<Profile>) => setD(x => ({ ...x, ...p }));
  useEffect(() => {
    const n = s.access?.name || s.profile.name;
    if (n) setD(x => (x.name ? x : { ...x, name: n }));
  }, [s.access?.name, s.profile.name]);

  async function tryInvite(text: string) {
    const inv = parseInvite(text);
    if (!inv) {
      setMsg("That doesn't look like an invite. Paste the whole personal link you were sent.");
      return;
    }
    setBusy(true);
    setMsg('');
    const r = await s.redeem(inv.id, inv.key);
    setBusy(false);
    if (r === 'ok') return;
    setMsg(
      r === 'not-found' ? 'This invite is no longer active. Ask for a new link.'
        : r === 'bad-key' ? "This invite link isn't complete. Copy the whole link again."
          : "Couldn't check the invite. Check your connection and try again.",
    );
  }

  async function finish() {
    const notify = await enableDailyReminder(s.ownerName);
    await s.saveProfile({ ...d, done: true, notify });
    router.replace('/');
  }

  // 1. Locked: no invite yet.
  if (!s.access) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.bg }}>
        <ScrollView contentContainerStyle={[st.wrap, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
          <View style={st.lock}><Icon name="lock" size={30} color={C.onDark} /></View>
          <Text style={st.eyebrow}>MORNING BRIEF</Text>
          <Text style={st.h1}>This app is <Text style={st.h1i}>invite-only</Text></Text>
          <Text style={st.lede}>
            Paste the personal link you were sent. It looks like https://narekpd1994.github.io/morning-news/#k=…
          </Text>
          <TextInput
            value={code}
            onChangeText={t => { setCode(t); setMsg(''); }}
            placeholder="Paste your invite link"
            placeholderTextColor={C.sub}
            autoCapitalize="none"
            autoCorrect={false}
            style={st.input}
            accessibilityLabel="Invite link"
          />
          <View style={st.acts}>
            <Button label="Paste from clipboard" kind="light" icon="link" onPress={async () => {
              const t = await Clipboard.getStringAsync();
              setCode(t);
              if (t) tryInvite(t);
            }} />
            <Button label={busy ? 'Checking…' : 'Open my brief'} disabled={busy || !code.trim()} onPress={() => tryInvite(code)} />
          </View>
          {msg ? <Text style={st.err}>{msg}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // 2. Onboarding questions.
  const k = STEPS[step];
  const last = step === STEPS.length - 1;
  const owner = s.feed?.meta.find(m => m.id === 'owner');
  const next = () => {
    if (k === 'who' && !d.name.trim()) {
      setMsg('Add your name first.');
      return;
    }
    setMsg('');
    if (last) finish();
    else setStep(step + 1);
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={[st.wrap, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 120 }]} keyboardShouldPersistTaps="handled">
        <View style={st.dots} accessibilityLabel={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((_, i) => <View key={i} style={[st.dot, i <= step && st.dotOn]} />)}
        </View>
        {k === 'who' ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar size={40} name={s.ownerName} avatar={owner?.avatar} bg={owner?.avatarBg} />
              <Text style={st.lbl}>Shared by {s.ownerName}</Text>
            </View>
            <Text style={st.h1}>{s.ownerName} shared his Morning Brief with you</Text>
            <Text style={st.lede}>A short daily reading list on AI, product design, tech and design leadership, picked by Claude every morning. Four quick questions and you're in.</Text>
            <Field label="Your name" value={d.name} onChange={v => set({ name: v })} placeholder="e.g. Anna" />
            <Field label="What you do" value={d.role} onChange={v => set({ role: v })} placeholder="e.g. UX researcher" />
          </>
        ) : k === 'folders' ? (
          <>
            <Text style={st.h1}>What do you want to read about?</Text>
            <Text style={st.lede}>Choose More for the folders you care about most, or Hide the ones you don't need.</Text>
            <View style={{ gap: 8 }}>
              {s.topics.concat(Object.keys(d.priority).filter(t => d.priority[t] === 'off' && !s.topics.includes(t))).map(t => (
                <View key={t} style={st.fRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <TopicIcon topic={t} size={34} />
                    <Text style={st.fName} numberOfLines={1}>{s.topicName(t)}</Text>
                  </View>
                  <Seg<Priority>
                    value={d.priority[t] || 'normal'}
                    options={[['high', 'More'], ['normal', 'Normal'], ['off', 'Hide']]}
                    onChange={v => set({ priority: { ...d.priority, [t]: v } })}
                  />
                </View>
              ))}
            </View>
          </>
        ) : k === 'read' ? (
          <>
            <Text style={st.h1}>How do you like to read?</Text>
            <Text style={st.lede}>You can change this any time in your profile.</Text>
            <Text style={st.lbl}>How should stories read?</Text>
            <Seg value={d.level} options={[['simple', 'Headlines'], ['detailed', 'Headline + summary']]} onChange={v => set({ level: v })} />
            <Text style={[st.lbl, { marginTop: 18 }]}>How many stories a day?</Text>
            <Seg value={d.count} options={[[5, 'Top 5'], [10, 'Top 10'], [0, 'All']]} onChange={v => set({ count: v })} />
          </>
        ) : (
          <>
            <Text style={st.h1}>Last one</Text>
            <Text style={st.lede}>What would you like more of? This stays on your phone. We'll also remind you at 8:20 each morning when the new brief is ready.</Text>
            <Field label="Anything you want more of? (optional)" value={d.more} onChange={v => set({ more: v })} placeholder="e.g. design systems, AI agents" multiline />
          </>
        )}
        {msg ? <Text style={st.err}>{msg}</Text> : null}
      </ScrollView>
      <View style={[st.footer, { paddingBottom: insets.bottom + 12 }]}>
        {step ? <Button label="Back" kind="light" onPress={() => { setMsg(''); setStep(step - 1); }} /> : <View />}
        <Button label={last ? 'Show me the feed' : 'Next'} onPress={next} style={{ flex: 1 }} />
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={st.lbl}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.sub}
        style={[st.input, multiline && { height: 100, paddingTop: 14, textAlignVertical: 'top' }]}
        multiline={multiline}
        accessibilityLabel={label}
      />
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { paddingHorizontal: 22, gap: 16 },
  lock: { width: 64, height: 64, borderRadius: 22, backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: F.medium, fontSize: 12, letterSpacing: 2.4, color: C.sub },
  h1: { fontFamily: F.serif, fontSize: 40, lineHeight: 42, color: C.ink, letterSpacing: -0.4 },
  h1i: { fontFamily: F.serifItalic },
  lede: { fontFamily: F.regular, fontSize: 16, lineHeight: 23, color: C.sub },
  lbl: { fontFamily: F.regular, fontSize: 14, color: C.sub },
  input: { minHeight: 52, borderRadius: 16, backgroundColor: C.card, paddingHorizontal: 16, fontFamily: F.regular, fontSize: 16, color: C.ink, borderWidth: StyleSheet.hairlineWidth, borderColor: C.hair },
  acts: { gap: 10 },
  err: { fontFamily: F.regular, fontSize: 14, color: '#d70015' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 22, height: 5, borderRadius: 3, backgroundColor: C.hair },
  dotOn: { width: 34, backgroundColor: C.dark },
  fRow: { backgroundColor: C.shell, borderRadius: 18, padding: 10, gap: 8 },
  fName: { fontFamily: F.medium, fontSize: 15, color: C.ink, flexShrink: 1 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, backgroundColor: C.bg },
});
