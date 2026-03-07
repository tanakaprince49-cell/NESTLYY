import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { BabyProgress } from './components/BabyProgress.tsx';
import { ToolsHub } from './components/ToolsHub.tsx';
import { SetupScreen } from './components/SetupScreen.tsx';
import { EducationHub } from './components/EducationHub.tsx';
import { AuthScreen } from './components/AuthScreen.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AvaChat } from './components/AvaChat.tsx';
import { SplashScreen } from './components/SplashScreen.tsx';
import { Settings } from './components/Settings.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { storage } from './services/storageService.ts';
import { subscribeUserToPush, showLocalNotification, scheduleReminders, processReminders, setupForegroundMessaging } from './services/pushService.ts';
import { auth, db, syncProfileToFirestore } from './firebase.ts';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { Analytics } from "@vercel/analytics/react";
import { 
  Trimester, 
  FoodEntry, 
  WaterLog, 
  PregnancyProfile, 
  SymptomLog, 
  VitaminLog, 
  Contraction, 
  JournalEntry, 
  CalendarEvent,
  WeightLog,
  SleepLog,
  FeedingLog,
  MilestoneLog,
  HealthLog,
  ReactionLog,
  KickLog,
  LifecycleStage,
  BabyGrowthLog,
  DiaperLog
} from './types.ts';

const App: React.FC = () => {
  const [authEmail, setAuthEmail] = useState<string | null>(() => storage.getAuthEmail());
  const [userUid, setUserUid] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setupForegroundMessaging();
  }, []);

  const [profile, setProfile] = useState<PregnancyProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [trimester, setTrimester] = useState<Trimester>(Trimester.FIRST);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'baby' | 'education' | 'tools' | 'ava' | 'admin' | 'settings'>('dashboard');
  const [activeToolCat, setActiveToolCat] = useState<string>('vitals');

  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [vitamins, setVitamins] = useState<VitaminLog[]>([]);
  const [contractions, setContractions] = useState<Contraction[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [feedingLogs, setFeedingLogs] = useState<FeedingLog[]>([]);
  const [milestones, setMilestones] = useState<MilestoneLog[]>([]);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [reactions, setReactions] = useState<ReactionLog[]>([]);
  const [babyGrowthLogs, setBabyGrowthLogs] = useState<BabyGrowthLog[]>([]);
  const [kickLogs, setKickLogs] = useState<KickLog[]>([]);
  const [diaperLogs, setDiaperLogs] = useState<DiaperLog[]>([]);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthEmail(user.email);
        setUserUid(user.uid);
        storage.setAuthEmail(user.email || '');
      } else {
        setAuthEmail(null);
        setUserUid(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Profile Sync
  useEffect(() => {
    if (!userUid) return;
    
    const unsubscribe = onSnapshot(doc(db, 'users', userUid), (doc) => {
      if (doc.exists()) {
        const firestoreProfile = doc.data() as PregnancyProfile;
        // Merge with local profile if needed, or just overwrite
        setProfile(prev => ({ ...prev, ...firestoreProfile }));
        storage.saveProfile({ ...storage.getProfile(), ...firestoreProfile } as any);
      }
    });
    
    return () => unsubscribe();
  }, [userUid]);

  // Notification Polling
  useEffect(() => {
    if (!authEmail || !profile) return;

    const runReminders = async () => {
      // 1. Schedule new ones based on current state
      scheduleReminders(
        profile,
        calendarEvents,
        vitamins,
        feedingLogs,
        sleepLogs,
        milestones
      );
      
      // 2. Process and show due ones
      await processReminders();
    };

    const interval = setInterval(runReminders, 10000); // Check every 10 seconds
    runReminders(); // Initial check

    return () => clearInterval(interval);
  }, [authEmail, profile, calendarEvents, vitamins, feedingLogs, sleepLogs, milestones]);

  useEffect(() => {
    if (!profile) return;
    const isPostpartum = profile.lifecycleStage === LifecycleStage.NEWBORN;
    const theme = profile.themeColor || 'pink';
    document.body.className = `theme-${theme} ${isPostpartum ? 'stage-newborn' : 'stage-pregnancy'}`;
  }, [profile?.lifecycleStage, profile?.themeColor]);

  // Handle deep linking from Shortcuts / Widgets
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'ava') setActiveTab('ava');
    if (tab === 'tools') setActiveTab('tools');
    if (tab === 'dashboard') setActiveTab('dashboard');
    if (tab === 'baby') setActiveTab('baby');
    
    // Clear the URL params without reloading to keep a clean state
    if (tab) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadUserData = useCallback(() => {
    if (!authEmail) return;
    setProfile(storage.getProfile());
    setEntries(storage.getFoodEntries());
    setWaterLogs(storage.getWaterLogs());
    setSymptoms(storage.getSymptoms());
    setVitamins(storage.getVitamins());
    setContractions(storage.getContractions());
    setJournalEntries(storage.getJournalEntries());
    setCalendarEvents(storage.getCalendarEvents());
    setWeightLogs(storage.getWeightLogs());
    setSleepLogs(storage.getSleepLogs());
    setFeedingLogs(storage.getFeedingLogs());
    setMilestones(storage.getMilestones());
    setHealthLogs(storage.getHealthLogs());
    setReactions(storage.getReactions());
    setBabyGrowthLogs(storage.getBabyGrowthLogs());
    setKickLogs(storage.getKickLogs());
    setDiaperLogs(storage.getDiaperLogs());
  }, [authEmail]);

  const handleLogout = () => {
    auth.signOut();
    storage.logout();
    setAuthEmail(null);
    setUserUid(null);
    setProfile(null);
    setActiveTab('dashboard');
  };

  useEffect(() => { loadUserData(); }, [loadUserData]);

  useEffect(() => {
    if (profile) {
      const diff = new Date().getTime() - new Date(profile.lmpDate).getTime();
      const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
      if (weeks < 13) setTrimester(Trimester.FIRST);
      else if (weeks < 27) setTrimester(Trimester.SECOND);
      else setTrimester(Trimester.THIRD);
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.themeColor) {
      const root = document.documentElement;
      if (profile.themeColor === 'blue') {
        root.style.setProperty('--rose-main', '#3b82f6');
        root.style.setProperty('--nestly-burgundy', '#1e3a8a');
        root.style.setProperty('--soft-bg', '#eff6ff');
        root.style.setProperty('--body-bg', '#dbeafe');
      } else if (profile.themeColor === 'pink') {
        root.style.setProperty('--rose-main', '#f43f5e');
        root.style.setProperty('--nestly-burgundy', '#7e1631');
        root.style.setProperty('--soft-bg', '#fffaf9');
        root.style.setProperty('--body-bg', '#fdf8f7');
      } else {
        root.style.setProperty('--rose-main', '#64748b');
        root.style.setProperty('--nestly-burgundy', '#1e293b');
        root.style.setProperty('--soft-bg', '#f8fafc');
        root.style.setProperty('--body-bg', '#f1f5f9');
      }
    }
  }, [profile?.themeColor]);

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;

  if (!authEmail) return <AuthScreen onAuthComplete={(e) => setAuthEmail(e)} />;
  
  if (!profile || isEditingProfile) {
    return (
      <SetupScreen 
        initialProfile={profile} 
        onComplete={(p) => { 
          storage.saveProfile(p); 
          setProfile(p); 
          setIsEditingProfile(false); 
        }} 
      />
    );
  }

  const isAdmin = authEmail === 'tanakaprince49@gmail.com';

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      <Analytics />
      <div className="max-w-4xl mx-auto px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard 
                entries={entries} waterLogs={waterLogs} vitamins={vitamins} weightLogs={weightLogs} sleepLogs={sleepLogs}
                feedingLogs={feedingLogs} milestones={milestones} healthLogs={healthLogs} reactions={reactions}
                journalEntries={journalEntries} babyGrowthLogs={babyGrowthLogs} diaperLogs={diaperLogs}
                trimester={trimester} profile={profile}
                onAddEntry={(e) => { storage.addFoodEntry({...e, id: Date.now().toString(), timestamp: Date.now()} as any); setEntries(storage.getFoodEntries()); }}
                onRemoveEntry={(id) => { storage.removeFoodEntry(id); setEntries(storage.getFoodEntries()); }}
                onAddWater={(a) => { storage.addWaterLog({amount: a, timestamp: Date.now()}); setWaterLogs(storage.getWaterLogs()); }}
                onLogVitamin={(n) => { storage.addVitamin({id: Date.now().toString(), name: n, timestamp: Date.now()}); setVitamins(storage.getVitamins()); }}
                onAddBabyGrowth={(g) => { storage.addBabyGrowthLog({...g, id: Date.now().toString(), timestamp: Date.now()}); setBabyGrowthLogs(storage.getBabyGrowthLogs()); }}
                onQuickTool={(cat) => { setActiveTab('tools'); setActiveToolCat(cat); }}
                onEditProfile={() => setIsEditingProfile(true)}
                onUpdateProfile={(p) => { storage.saveProfile(p); setProfile(p); }}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'baby' && <BabyProgress profile={profile} babyGrowthLogs={babyGrowthLogs} />}
            {activeTab === 'ava' && <AvaChat profile={profile} />}
            {activeTab === 'education' && (
              <EducationHub 
                trimester={trimester} 
                isPostpartum={profile.lifecycleStage !== LifecycleStage.PREGNANCY && profile.lifecycleStage !== LifecycleStage.PRE_PREGNANCY} 
              />
            )}
            {activeTab === 'tools' && (
              <ToolsHub 
                symptoms={symptoms} onLogSymptom={(t, s) => { storage.addSymptom({id: Date.now().toString(), type: t, severity: s, timestamp: Date.now()}); setSymptoms(storage.getSymptoms()); }}
                contractions={contractions} onUpdateContractions={(c) => { storage.saveContractions(c); setContractions(c); }}
                journalEntries={journalEntries} onAddJournal={(c, m) => { storage.addJournalEntry({id: Date.now().toString(), content: c, mood: m, timestamp: Date.now()}); setJournalEntries(storage.getJournalEntries()); }}
                onRemoveJournal={(id) => { storage.removeJournalEntry(id); setJournalEntries(storage.getJournalEntries()); }}
                calendarEvents={calendarEvents} onAddEvent={(t,d,ty) => { storage.addCalendarEvent({id: Date.now().toString(), title: t, date: d, type: ty}); setCalendarEvents(storage.getCalendarEvents()); }}
                onRemoveEvent={(id) => { storage.removeCalendarEvent(id); setCalendarEvents(storage.getCalendarEvents()); }}
                weightLogs={weightLogs} onAddWeight={(w) => { storage.addWeightLog({id: Date.now().toString(), weight: w, timestamp: Date.now()}); setWeightLogs(storage.getWeightLogs()); }}
                sleepLogs={sleepLogs} onAddSleep={(s) => { storage.addSleepLog({id: Date.now().toString(), ...s, timestamp: Date.now()}); setSleepLogs(storage.getSleepLogs()); }}
                onRemoveSleep={(id) => { storage.removeSleepLog(id); setSleepLogs(storage.getSleepLogs()); }}
                feedingLogs={feedingLogs} onAddFeeding={(f) => { storage.addFeedingLog({id: Date.now().toString(), ...f, timestamp: Date.now()}); setFeedingLogs(storage.getFeedingLogs()); }}
                diaperLogs={diaperLogs} onAddDiaper={(d) => { storage.addDiaperLog({id: Date.now().toString(), ...d, timestamp: Date.now()}); setDiaperLogs(storage.getDiaperLogs()); }}
                milestones={milestones} onAddMilestone={(m) => { storage.addMilestone({id: Date.now().toString(), ...m, timestamp: Date.now()}); setMilestones(storage.getMilestones()); }}
                healthLogs={healthLogs} onAddHealth={(h) => { storage.addHealthLog({id: Date.now().toString(), ...h, timestamp: Date.now()}); setHealthLogs(storage.getHealthLogs()); }}
                reactions={reactions} onAddReaction={(r) => { storage.addReaction({id: Date.now().toString(), ...r, timestamp: Date.now()}); setReactions(storage.getReactions()); }}
                kickLogs={kickLogs} onAddKick={(k) => { storage.addKickLog({id: Date.now().toString(), ...k, timestamp: Date.now()}); setKickLogs(storage.getKickLogs()); }}
                babyGrowthLogs={babyGrowthLogs} onAddBabyGrowth={(g) => { storage.addBabyGrowthLog({id: Date.now().toString(), ...g, timestamp: Date.now()}); setBabyGrowthLogs(storage.getBabyGrowthLogs()); }}
                trimester={trimester} profile={profile}
                activeCategory={activeToolCat} setActiveCategory={setActiveToolCat}
                onUpdateProfile={(p) => { 
                  storage.saveProfile(p); 
                  setProfile(p); 
                  if (userUid) syncProfileToFirestore(userUid, p);
                }}
              />
            )}
            {activeTab === 'settings' && <Settings profile={profile} onUpdateProfile={(p) => { 
              storage.saveProfile(p); 
              setProfile(p); 
              if (userUid) syncProfileToFirestore(userUid, p);
            }} />}
            {activeTab === 'admin' && isAdmin && <AdminDashboard />}
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default App;