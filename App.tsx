import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { BabyProgress } from './components/BabyProgress.tsx';
import { ToolsHub } from './components/ToolsHub.tsx';
import { SetupScreen } from './components/SetupScreen.tsx';
import { EducationHub } from './components/EducationHub.tsx';
import { AuthScreen } from './components/AuthScreen.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AchievementToast } from './components/AchievementToast.tsx';
import { AvaChat } from './components/AvaChat.tsx';
import { Logo } from './components/Logo.tsx';
import { storage } from './services/storageService.ts';
import { checkAchievements } from './services/achievementService.ts';
import { subscribeUserToPush } from './services/pushService.ts';
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
  Achievement
} from './types.ts';

const App: React.FC = () => {
  const [authEmail, setAuthEmail] = useState<string | null>(() => storage.getAuthEmail());
  const [profile, setProfile] = useState<PregnancyProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [trimester, setTrimester] = useState<Trimester>(Trimester.FIRST);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'baby' | 'education' | 'tools' | 'ava' | 'admin'>('dashboard');
  const [activeToolCat, setActiveToolCat] = useState<string>('vitals');
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [vitamins, setVitamins] = useState<VitaminLog[]>([]);
  const [contractions, setContractions] = useState<Contraction[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);

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
  }, [authEmail]);

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
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Global Floating Bears are handled in Layout background */}
        
        {activeTab === 'dashboard' && (
          <Dashboard 
            entries={entries} waterLogs={waterLogs} vitamins={vitamins} weightLogs={weightLogs} sleepLogs={sleepLogs}
            trimester={trimester} profile={profile}
            onAddEntry={(e) => { storage.addFoodEntry({...e, id: Date.now().toString(), timestamp: Date.now()} as any); setEntries(storage.getFoodEntries()); }}
            onRemoveEntry={(id) => { storage.removeFoodEntry(id); setEntries(storage.getFoodEntries()); }}
            onAddWater={(a) => { storage.addWaterLog({amount: a, timestamp: Date.now()}); setWaterLogs(storage.getWaterLogs()); }}
            onLogVitamin={(n) => { storage.addVitamin({id: Date.now().toString(), name: n, timestamp: Date.now()}); setVitamins(storage.getVitamins()); }}
            onQuickTool={(cat) => { setActiveTab('tools'); setActiveToolCat(cat); }}
            onEditProfile={() => setIsEditingProfile(true)}
          />
        )}
        {activeTab === 'baby' && <BabyProgress profile={profile} />}
        {activeTab === 'ava' && <AvaChat profile={profile} />}
        {activeTab === 'education' && <EducationHub trimester={trimester} />}
        {activeTab === 'tools' && (
          <ToolsHub 
            symptoms={symptoms} onLogSymptom={(t, s) => { storage.addSymptom({id: Date.now().toString(), type: t, severity: s, timestamp: Date.now()}); setSymptoms(storage.getSymptoms()); }}
            contractions={contractions} onUpdateContractions={(c) => { storage.saveContractions(c); setContractions(c); }}
            journalEntries={journalEntries} onAddJournal={(c, m) => { storage.addJournalEntry({id: Date.now().toString(), content: c, mood: m, timestamp: Date.now()}); setJournalEntries(storage.getJournalEntries()); }}
            onRemoveJournal={(id) => { storage.removeJournalEntry(id); setJournalEntries(storage.getJournalEntries()); }}
            calendarEvents={calendarEvents} onAddEvent={(t,d,ty) => { storage.addCalendarEvent({id: Date.now().toString(), title: t, date: d, type: ty}); setCalendarEvents(storage.getCalendarEvents()); }}
            onRemoveEvent={(id) => { storage.removeCalendarEvent(id); setCalendarEvents(storage.getCalendarEvents()); }}
            weightLogs={weightLogs} onAddWeight={(w) => { storage.addWeightLog({id: Date.now().toString(), weight: w, timestamp: Date.now()}); setWeightLogs(storage.getWeightLogs()); }}
            sleepLogs={sleepLogs} onAddSleep={(h, q) => { storage.addSleepLog({id: Date.now().toString(), hours: h, quality: q, timestamp: Date.now()}); setSleepLogs(storage.getSleepLogs()); }}
            onRemoveSleep={(id) => { storage.removeSleepLog(id); setSleepLogs(storage.getSleepLogs()); }}
            trimester={trimester} profile={profile}
            activeCategory={activeToolCat} setActiveCategory={setActiveToolCat}
          />
        )}
        {activeTab === 'admin' && isAdmin && <AdminDashboard />}
      </div>
    </Layout>
  );
};

export default App;