import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { BabyProgress } from './components/BabyProgress.tsx';
import { ToolsHub } from './components/ToolsHub.tsx';
import { SetupScreen } from './components/SetupScreen.tsx';
import { EducationHub } from './components/EducationHub.tsx';
import { AuthScreen } from './components/AuthScreen.tsx';
import { PrivacyScreen } from './components/PrivacyScreen.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AvaChat } from './components/AvaChat.tsx';
import { SplashScreen } from './components/SplashScreen.tsx';
import { Settings } from './components/Settings.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { storage } from './services/storageService.ts';
import { loadFromFirestore } from './services/syncService.ts';
import { subscribeUserToPush, showLocalNotification, scheduleReminders, processReminders, setupForegroundMessaging } from './services/pushService.ts';
import { auth } from './firebase.ts';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Trimester, 
  FoodEntry, 
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
  KegelLog,
  LifecycleStage,
  BabyGrowthLog,
  DiaperLog,
  MedicationLog,
  TummyTimeLog,
  BloodPressureLog
} from './types.ts';

const App: React.FC = () => {
  const [authEmail, setAuthEmail] = useState<string | null>(() => storage.getAuthEmail());
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState<boolean>(() => storage.hasAcceptedPrivacy());
  const [userUid, setUserUid] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupForegroundMessaging();
  }, []);

  const [profile, setProfile] = useState<PregnancyProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [trimester, setTrimester] = useState<Trimester>(Trimester.FIRST);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'baby' | 'education' | 'tools' | 'ava' | 'admin' | 'settings'>('dashboard');
  const [activeToolCat, setActiveToolCat] = useState<string>('all');

  const [entries, setEntries] = useState<FoodEntry[]>([]);
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
  const [tummyTimeLogs, setTummyTimeLogs] = useState<TummyTimeLog[]>([]);
  const [bloodPressureLogs, setBloodPressureLogs] = useState<BloodPressureLog[]>([]);
  const [kickLogs, setKickLogs] = useState<KickLog[]>([]);
  const [kegelLogs, setKegelLogs] = useState<KegelLog[]>([]);
  const [diaperLogs, setDiaperLogs] = useState<DiaperLog[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);

  const loadUserData = useCallback(() => {
    try {
      setProfile(storage.getProfile());
      setEntries(storage.getFoodEntries());
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
      setTummyTimeLogs(storage.getTummyTimeLogs());
      setBloodPressureLogs(storage.getBloodPressureLogs());
      setKickLogs(storage.getKickLogs());
      setKegelLogs(storage.getKegelLogs());
      setDiaperLogs(storage.getDiaperLogs());
      setMedicationLogs(storage.getMedications());
    } catch (err) {
      console.error("Error loading user data from storage:", err);
    }
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    // Fallback to stop loading if Firebase takes too long
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        clearTimeout(fallbackTimer);
        setLoading(true);
        if (user) {
          const identifier = user.email || `anon-${user.uid}`;
          storage.setAuthEmail(identifier);
          
          // Load from Firestore before setting state and loading user data
          try {
            await loadFromFirestore(identifier);
          } catch (fsErr) {
            console.error("Firestore sync error during auth:", fsErr);
          }
          
          setAuthEmail(identifier);
          setUserUid(user.uid);
          setHasAcceptedPrivacy(storage.hasAcceptedPrivacy());
          
          loadUserData();
          setLoading(false);
        } else {
          setAuthEmail(null);
          setUserUid(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setLoading(false);
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [loadUserData]);

  // Removed Firestore Syncing Logic


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
        milestones,
        medicationLogs
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

  const handleLogout = () => {
    auth.signOut();
    storage.logout();
    setAuthEmail(null);
    setUserUid(null);
    setProfile(null);
    setActiveTab('dashboard');
  };

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    if (profile) {
      const diff = new Date().getTime() - new Date(profile.lmpDate).getTime();
      const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
      if (weeks < 13) setTrimester(Trimester.FIRST);
      else if (weeks < 27) setTrimester(Trimester.SECOND);
      else setTrimester(Trimester.THIRD);
    }
  }, [profile]);

  if (showSplash || loading) return <SplashScreen onComplete={() => setShowSplash(false)} />;

  if (!authEmail) return <AuthScreen onAuthComplete={(e) => setAuthEmail(e)} />;
  
  if (!hasAcceptedPrivacy && !profile) {
    return (
      <PrivacyScreen onAccept={() => {
        storage.acceptPrivacy();
        setHasAcceptedPrivacy(true);
      }} />
    );
  }

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
    <ErrorBoundary>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
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
                entries={entries} vitamins={vitamins} weightLogs={weightLogs} sleepLogs={sleepLogs}
                feedingLogs={feedingLogs} milestones={milestones} healthLogs={healthLogs} reactions={reactions}
                journalEntries={journalEntries} babyGrowthLogs={babyGrowthLogs} diaperLogs={diaperLogs}
                tummyTimeLogs={tummyTimeLogs}
                medicationLogs={medicationLogs}
                bloodPressureLogs={bloodPressureLogs}
                trimester={trimester} profile={profile}
                onAddEntry={(e) => { 
                  storage.addFoodEntry({...e, id: crypto.randomUUID(), timestamp: Date.now()} as any); 
                  setEntries(storage.getFoodEntries()); 
                }}
                onRemoveEntry={(id) => { 
                  storage.removeFoodEntry(id); 
                  setEntries(storage.getFoodEntries()); 
                }}
                onLogVitamin={(n) => { 
                  storage.addVitamin({id: crypto.randomUUID(), name: n, timestamp: Date.now()}); 
                  setVitamins(storage.getVitamins()); 
                }}
                onAddBabyGrowth={(g) => { 
                  storage.addBabyGrowthLog({...g, id: crypto.randomUUID(), timestamp: Date.now()}); 
                  setBabyGrowthLogs(storage.getBabyGrowthLogs()); 
                }}
                onAddMedication={(m) => {
                  storage.addMedication({ name: m.name, dosage: m.dosage, time: m.time, id: crypto.randomUUID(), timestamp: Date.now() });
                  setMedicationLogs(storage.getMedications());
                }}
                onRemoveMedication={(id) => {
                  storage.removeMedication(id);
                  setMedicationLogs(storage.getMedications());
                }}
                onQuickTool={(cat) => { setActiveTab('tools'); setActiveToolCat(cat); }}
                onEditProfile={() => setIsEditingProfile(true)}
                onUpdateProfile={(p) => { 
                  storage.saveProfile(p); 
                  setProfile(p); 
                }}
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
                symptoms={symptoms} onLogSymptom={(t, s) => { 
                  storage.addSymptom({id: crypto.randomUUID(), type: t, severity: s, timestamp: Date.now()}); 
                  setSymptoms(storage.getSymptoms()); 
                }}
                onAddFoodEntry={(f) => {
                  storage.addFoodEntry({ ...f, id: crypto.randomUUID(), timestamp: Date.now() });
                  setEntries(storage.getFoodEntries());
                }}
                onRemoveFoodEntry={(id) => {
                  storage.removeFoodEntry(id);
                  setEntries(storage.getFoodEntries());
                }}
                onAddVitamin={(v) => {
                  storage.addVitamin({ ...v, id: crypto.randomUUID(), timestamp: Date.now() });
                  setVitamins(storage.getVitamins());
                }}
                contractions={contractions} onUpdateContractions={(c) => { 
                  storage.saveContractions(c); 
                  setContractions(c); 
                }}
                journalEntries={journalEntries} onAddJournal={(c, m) => { 
                  storage.addJournalEntry({id: crypto.randomUUID(), content: c, mood: m, timestamp: Date.now()}); 
                  setJournalEntries(storage.getJournalEntries()); 
                }}
                onRemoveJournal={(id) => { 
                  storage.removeJournalEntry(id); 
                  setJournalEntries(storage.getJournalEntries()); 
                }}
                calendarEvents={calendarEvents} onAddEvent={(t,d,ty,tm) => { 
                  storage.addCalendarEvent({id: crypto.randomUUID(), title: t, date: d, type: ty, time: tm}); 
                  setCalendarEvents(storage.getCalendarEvents()); 
                }}
                onRemoveEvent={(id) => { 
                  storage.removeCalendarEvent(id); 
                  setCalendarEvents(storage.getCalendarEvents()); 
                }}
                weightLogs={weightLogs} onAddWeight={(w) => { 
                  storage.addWeightLog({id: crypto.randomUUID(), weight: w, timestamp: Date.now()}); 
                  setWeightLogs(storage.getWeightLogs()); 
                }}
                sleepLogs={sleepLogs} onAddSleep={(s) => { 
                  storage.addSleepLog({id: crypto.randomUUID(), ...s, timestamp: Date.now()}); 
                  setSleepLogs(storage.getSleepLogs()); 
                }}
                onRemoveSleep={(id) => { 
                  storage.removeSleepLog(id); 
                  setSleepLogs(storage.getSleepLogs()); 
                }}
                feedingLogs={feedingLogs} onAddFeeding={(f) => { 
                  storage.addFeedingLog({id: crypto.randomUUID(), ...f, timestamp: Date.now()}); 
                  setFeedingLogs(storage.getFeedingLogs()); 
                }}
                diaperLogs={diaperLogs} onAddDiaper={(d) => { 
                  storage.addDiaperLog({id: crypto.randomUUID(), ...d, timestamp: Date.now()}); 
                  setDiaperLogs(storage.getDiaperLogs()); 
                }}
                milestones={milestones} onAddMilestone={(m) => { 
                  storage.addMilestone({id: crypto.randomUUID(), ...m, timestamp: Date.now()}); 
                  setMilestones(storage.getMilestones()); 
                }}
                healthLogs={healthLogs} onAddHealth={(h) => { 
                  storage.addHealthLog({id: crypto.randomUUID(), ...h, timestamp: Date.now()}); 
                  setHealthLogs(storage.getHealthLogs()); 
                }}
                reactions={reactions} onAddReaction={(r) => { 
                  storage.addReaction({id: crypto.randomUUID(), ...r, timestamp: Date.now()}); 
                  setReactions(storage.getReactions()); 
                }}
                kickLogs={kickLogs} onAddKick={(k) => { 
                  storage.addKickLog({id: crypto.randomUUID(), ...k, timestamp: Date.now()}); 
                  setKickLogs(storage.getKickLogs()); 
                }}
                kegelLogs={kegelLogs} onAddKegel={(k) => {
                  storage.addKegelLog({id: crypto.randomUUID(), ...k, timestamp: Date.now()});
                  setKegelLogs(storage.getKegelLogs());
                }}
                medicationLogs={medicationLogs}
                onAddMedication={(m) => {
                  storage.addMedication({ ...m, id: crypto.randomUUID(), timestamp: Date.now() });
                  setMedicationLogs(storage.getMedications());
                }}
                onRemoveMedication={(id) => {
                  storage.removeMedication(id);
                  setMedicationLogs(storage.getMedications());
                }}
                babyGrowthLogs={babyGrowthLogs}
                tummyTimeLogs={tummyTimeLogs}
                onAddTummyTime={(t) => {
                  storage.addTummyTimeLog({id: crypto.randomUUID(), ...t, timestamp: Date.now()});
                  setTummyTimeLogs(storage.getTummyTimeLogs());
                }}
                bloodPressureLogs={bloodPressureLogs}
                onAddBloodPressure={(b) => {
                  storage.addBloodPressureLog({id: crypto.randomUUID(), ...b, timestamp: Date.now()});
                  setBloodPressureLogs(storage.getBloodPressureLogs());
                }}
                onAddBabyGrowth={(g) => { 
                  storage.addBabyGrowthLog({id: crypto.randomUUID(), ...g, timestamp: Date.now()}); 
                  setBabyGrowthLogs(storage.getBabyGrowthLogs()); 
                }}
                foodEntries={entries}
                vitamins={vitamins}
                trimester={trimester} profile={profile}
                activeCategory={activeToolCat} setActiveCategory={setActiveToolCat}
                onUpdateProfile={(p) => { 
                  storage.saveProfile(p); 
                  setProfile(p); 
                }}
                onUpdateChecklist={() => {
                  // Local update handled via storage
                }}
                onUpdateBumpPhotos={() => {
                  // Local update handled via storage
                }}
                onUpdateBabyNames={() => {
                  // Local update handled via storage
                }}
                onUpdateArchive={() => {
                  // Local update handled via storage
                }}
              />
            )}
            {activeTab === 'settings' && <Settings profile={profile} onUpdateProfile={(p) => { 
              storage.saveProfile(p); 
              setProfile(p); 
            }} userUid={userUid} />}
            {activeTab === 'admin' && isAdmin && <AdminDashboard />}
          </motion.div>
        </AnimatePresence>
      </div>
      </Layout>
    </ErrorBoundary>
  );
};

export default App;