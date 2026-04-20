import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Layout } from './components/Layout.tsx';
const Dashboard = lazy(() => import('./components/Dashboard.tsx').then(m => ({ default: m.Dashboard })));
const BabyProgress = lazy(() => import('./components/BabyProgress.tsx').then(m => ({ default: m.BabyProgress })));
const ToolsHub = lazy(() => import('./components/ToolsHub.tsx').then(m => ({ default: m.ToolsHub })));
const SetupScreen = lazy(() => import('./components/SetupScreen.tsx').then(m => ({ default: m.SetupScreen })));
const EducationHub = lazy(() => import('./components/EducationHub.tsx').then(m => ({ default: m.EducationHub })));
const PrivacyScreen = lazy(() => import('./components/PrivacyScreen.tsx').then(m => ({ default: m.PrivacyScreen })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard.tsx').then(m => ({ default: m.AdminDashboard })));
const AvaChat = lazy(() => import('./components/AvaChat.tsx').then(m => ({ default: m.AvaChat })));
const Settings = lazy(() => import('./components/Settings.tsx').then(m => ({ default: m.Settings })));
const VillageHub = lazy(() => import('./components/VillageHub.tsx').then(m => ({ default: m.VillageHub })));
import { storage } from './services/storageService.ts';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
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
} from '@nestly/shared';

const App: React.FC = () => {
  const [localUuid] = useState<string>(() => storage.getLocalUuidPublic());
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHasAcceptedPrivacy(storage.hasAcceptedPrivacy());
    setLoading(false);
  }, []);

  useEffect(() => {
    import('./services/pushService.ts').then(m => m.setupForegroundMessaging());
  }, []);

  const [profile, setProfile] = useState<PregnancyProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [trimester, setTrimester] = useState<Trimester>(Trimester.FIRST);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'baby' | 'education' | 'tools' | 'ava' | 'admin' | 'settings' | 'village'>('dashboard');
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

  // Load user data once UUID identity is resolved
  useEffect(() => {
    if (localUuid) {
      loadUserData();
    }
  }, [localUuid, loadUserData]);

  // Dismiss static splash screen once app is ready or after safety timeout
  useEffect(() => {
    const splash = document.getElementById('static-splash');
    if (!splash) return;

    if (!loading) {
      splash.style.transition = 'opacity 500ms ease-out';
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 600);
    }
  }, [loading]);

  // Notification Polling
  useEffect(() => {
    if (!localUuid || !profile) return;

    let interval: ReturnType<typeof setInterval> | undefined;

    (async () => {
      const { scheduleReminders, processReminders } = await import('./services/pushService.ts');

      const runReminders = async () => {
        scheduleReminders(profile, calendarEvents, vitamins, feedingLogs, sleepLogs, milestones, medicationLogs);
        await processReminders();
      };

      interval = setInterval(runReminders, 10000);
      runReminders();
    })();

    return () => { if (interval) clearInterval(interval); };
  }, [localUuid, profile, calendarEvents, vitamins, feedingLogs, sleepLogs, milestones]);

  useEffect(() => {
    if (!profile) return;
    const isPostpartum = profile.lifecycleStage === LifecycleStage.NEWBORN;
    const allowedThemes = ['pink', 'blue', 'orange'] as const;
    const theme = (allowedThemes as readonly string[]).includes(profile.themeColor as unknown as string)
      ? profile.themeColor
      : 'pink';

    if (theme !== profile.themeColor) {
      const nextProfile = { ...profile, themeColor: theme };
      storage.saveProfile(nextProfile);
      setProfile(nextProfile);
    }
    document.body.className = `theme-${theme} ${isPostpartum ? 'stage-newborn' : 'stage-pregnancy'}`;
  }, [profile?.lifecycleStage, profile?.themeColor]);

  // Handle deep linking from Shortcuts / Widgets / Invites
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const invite = params.get('invite');

    if (invite) {
      setActiveTab('village');
      sessionStorage.setItem('pendingInvite', invite);
    } else {
      if (tab === 'ava') setActiveTab('ava');
      if (tab === 'tools') setActiveTab('tools');
      if (tab === 'dashboard') setActiveTab('dashboard');
      if (tab === 'baby') setActiveTab('baby');
      if (tab === 'village') setActiveTab('village');
    }

    // Clear the URL params without reloading to keep a clean state
    if (tab || invite) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!profile) return;
    const diff = new Date().getTime() - new Date(profile.lmpDate).getTime();
    const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
    if (weeks < 13) setTrimester(Trimester.FIRST);
    else if (weeks < 27) setTrimester(Trimester.SECOND);
    else setTrimester(Trimester.THIRD);

    // Automatic newborn transition when baby is born! (EDD reached)
    const lmpTime = new Date(profile.lmpDate).getTime();
    const eddTime = lmpTime + 280 * 24 * 60 * 60 * 1000;
    if (profile.lifecycleStage === LifecycleStage.PREGNANCY && Date.now() > eddTime) {
      const nextProfile = { ...profile, lifecycleStage: LifecycleStage.NEWBORN };
      storage.saveProfile(nextProfile);
      setProfile(nextProfile);
    }
  }, [profile]);

  if (loading) return null;

  if (!hasAcceptedPrivacy) {
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

  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim()).filter(Boolean);
  const isAdmin = adminEmails.includes(localUuid);

  return (
    <ErrorBoundary>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => {}}>
      <div className="max-w-4xl mx-auto px-4 py-4">
          <Suspense fallback={
            <div className="flex items-center justify-center h-[60vh]">
              <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
            </div>
          }>
            <div key={activeTab} className="animate-slide-up">
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
                  }} localUuid={localUuid} />}
              {activeTab === 'village' && <VillageHub profile={profile} userUid={localUuid} />}
              {activeTab === 'admin' && isAdmin && <AdminDashboard />}
            </div>
          </Suspense>
      </div>
      </Layout>
    </ErrorBoundary>
  );
};

export default App;
