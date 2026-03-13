import { storage } from './storageService.ts';
import { Trimester } from '../types.ts';
import { jsPDF } from 'jspdf';

export const generatePregnancyDailyReport = (date: Date) => {
  const profile = storage.getProfile();
  if (!profile) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const dateStr = date.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric',
    month: 'long', 
    year: 'numeric' 
  }).toUpperCase();
  
  const parentName = profile.userName || 'Parent';
  const babyNames = (profile.babies || []).map(b => b.name || 'Baby').join(', ');
  const pregnancyType = profile.pregnancyType.charAt(0).toUpperCase() + profile.pregnancyType.slice(1);

  const startOfDay = new Date(date).setHours(0, 0, 0, 0);
  const endOfDay = new Date(date).setHours(23, 59, 59, 999);

  // Data Fetching (Pregnancy Only)
  const weightLogs = (storage.getWeightLogs() || []).filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay);
  const foods = (storage.getFoodEntries() || []).filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay);
  const water = (storage.getWaterLogs() || []).filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay)
                       .reduce((acc, curr) => acc + curr.amount, 0);
  const sleep = (storage.getSleepLogs() || []).find(l => !l.babyId && l.timestamp >= startOfDay && l.timestamp <= endOfDay);
  const symptoms = (storage.getSymptoms() || []).filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay);
  const journal = (storage.getJournalEntries() || []).filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay);
  const kicks = (storage.getKickLogs() || []).filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay);
  const kegels = (storage.getKegelLogs() || []).filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay);

  const nutritionTotals = foods.reduce((acc, curr) => ({
    c: acc.c + (curr.calories || 0),
    p: acc.p + (curr.protein || 0),
    i: acc.i + (curr.iron || 0),
  }), { c: 0, p: 0, i: 0 });

  const burgundy = [126, 22, 49]; // #7e1631
  const roseText = [244, 63, 94]; // #f43f5e
  const slateText = [71, 85, 105]; // #475569
  const boxBg = [255, 250, 250];

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');

  // Header Bar
  doc.setFillColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setFont('times', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(255, 255, 255);
  doc.text('Nestly', 20, 28);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('YOUR PREGNANCY COMPANION', 20, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(dateStr, pageWidth - 20, 28, { align: 'right' });

  let y = 60;
  
  // Profile Info Section
  doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
  doc.roundedRect(15, y, pageWidth - 30, 30, 8, 8, 'F');
  
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text(`Mama: ${parentName}`, 25, y + 12);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(`${pregnancyType} Journey: ${babyNames}`, 25, y + 20);
  
  y += 45;

  doc.setDrawColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 12;

  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('Daily Pregnancy Report', 15, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text('A dedicated summary of your pregnancy well-being.', 15, y);
  y += 15;

  const boxWidth = (pageWidth - 40) / 2;
  const boxHeight = 45;

  // Vital Stats Box
  doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
  doc.roundedRect(15, y, boxWidth, boxHeight, 8, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(roseText[0], roseText[1], roseText[2]);
  doc.text('VITAL STATS', 25, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(`Weight: ${weightLogs.length > 0 ? weightLogs[0].weight + ' kg' : '---'}`, 25, y + 24);
  doc.text(`Sleep: ${sleep ? sleep.hours + ' hrs' : '---'}`, 25, y + 31);
  doc.text(`Water: ${water > 0 ? water + ' ml' : '---'}`, 25, y + 38);

  // Pregnancy Specifics Box
  doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
  doc.roundedRect(15 + boxWidth + 10, y, boxWidth, boxHeight, 8, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(roseText[0], roseText[1], roseText[2]);
  doc.text('PREGNANCY TRACKING', 15 + boxWidth + 25, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(`Kick Count: ${kicks.length > 0 ? kicks.reduce((a,b) => a + b.count, 0) : '---'}`, 15 + boxWidth + 25, y + 24);
  doc.text(`Kegel Sessions: ${kegels.length}`, 15 + boxWidth + 25, y + 31);
  doc.text(`Symptoms: ${symptoms.length}`, 15 + boxWidth + 25, y + 38);

  y += 60;

  // Nutrition
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('Nutrition Summary', 15, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(`Calories: ${nutritionTotals.c} kcal | Protein: ${nutritionTotals.p}g | Iron: ${nutritionTotals.i}mg`, 15, y);
  y += 15;

  // Reflections
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(14);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('Daily Reflections', 15, y);
  y += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  
  if (journal.length > 0) {
    journal.forEach(j => {
      const splitNote = doc.splitTextToSize(`"${j.content}"`, pageWidth - 30);
      doc.text(splitNote, 15, y);
      y += (splitNote.length * 6) + 6;
      
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
    });
  } else {
    doc.text('No reflections recorded today.', 15, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setFillColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.rect(0, footerY, pageWidth, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('YOU ARE DOING AMAZING, MAMA.', pageWidth / 2, footerY + 18, { align: 'center' });

  doc.save(`Nestly_Pregnancy_Report_${date.toISOString().split('T')[0]}.pdf`);
};

export const generateNewbornDailyReport = (date: Date) => {
  const profile = storage.getProfile();
  if (!profile) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const dateStr = date.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric',
    month: 'long', 
    year: 'numeric' 
  }).toUpperCase();
  
  const parentName = profile.userName || 'Parent';
  const babyNames = (profile.babies || []).map(b => b.name || 'Baby').join(', ');

  const startOfDay = new Date(date).setHours(0, 0, 0, 0);
  const endOfDay = new Date(date).setHours(23, 59, 59, 999);

  // Data Fetching (Newborn Only)
  const feedings = (storage.getFeedingLogs() || []).filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay);
  const diapers = (storage.getDiaperLogs() || []).filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay);
  const babySleep = (storage.getSleepLogs() || []).filter(l => l.babyId && l.timestamp >= startOfDay && l.timestamp <= endOfDay);
  const tummyTime = (storage.getTummyTimeLogs() || []).filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay);
  const growth = (storage.getBabyGrowthLogs() || []).filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay);
  const journal = (storage.getJournalEntries() || []).filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay);

  const totalMilk = feedings.reduce((acc, curr) => acc + curr.amount, 0);
  const totalSleep = babySleep.reduce((acc, curr) => acc + curr.hours, 0);
  const totalTummy = Math.floor(tummyTime.reduce((acc, curr) => acc + curr.duration, 0) / 60);

  const burgundy = [126, 22, 49];
  const roseText = [244, 63, 94];
  const slateText = [71, 85, 105];
  const boxBg = [250, 250, 255]; // Slightly blue for baby

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');

  // Header Bar
  doc.setFillColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setFont('times', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(255, 255, 255);
  doc.text('Nestly', 20, 28);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('YOUR NEWBORN COMPANION', 20, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(dateStr, pageWidth - 20, 28, { align: 'right' });

  let y = 60;
  
  // Profile Info Section
  doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
  doc.roundedRect(15, y, pageWidth - 30, 30, 8, 8, 'F');
  
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text(`Parent: ${parentName}`, 25, y + 12);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(`Baby: ${babyNames}`, 25, y + 20);
  
  y += 45;

  doc.setDrawColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 12;

  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('Daily Newborn Report', 15, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text('A dedicated summary of your baby\'s daily milestones and care.', 15, y);
  y += 15;

  const boxWidth = (pageWidth - 40) / 2;
  const boxHeight = 45;

  // Care Stats Box
  doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
  doc.roundedRect(15, y, boxWidth, boxHeight, 8, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(roseText[0], roseText[1], roseText[2]);
  doc.text('FEEDING & SLEEP', 25, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(`Total Milk: ${totalMilk > 0 ? totalMilk + ' ml' : '---'}`, 25, y + 24);
  doc.text(`Feedings: ${feedings.length}`, 25, y + 31);
  doc.text(`Total Sleep: ${totalSleep > 0 ? totalSleep + ' hrs' : '---'}`, 25, y + 38);

  // Activity Box
  doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
  doc.roundedRect(15 + boxWidth + 10, y, boxWidth, boxHeight, 8, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(roseText[0], roseText[1], roseText[2]);
  doc.text('ACTIVITY & CARE', 15 + boxWidth + 25, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(`Diaper Changes: ${diapers.length}`, 15 + boxWidth + 25, y + 24);
  doc.text(`Tummy Time: ${totalTummy > 0 ? totalTummy + ' mins' : '---'}`, 15 + boxWidth + 25, y + 31);
  doc.text(`Growth Logs: ${growth.length}`, 15 + boxWidth + 25, y + 38);

  y += 60;

  // Detailed Care
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('Care Details', 15, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  
  const diaperSummary = diapers.length > 0 
    ? `Diapers: ${diapers.filter(d => d.type === 'wet').length} Wet, ${diapers.filter(d => d.type === 'dirty').length} Dirty`
    : 'No diaper changes logged.';
  doc.text(diaperSummary, 15, y);
  y += 15;

  // Reflections
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(14);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('Parental Reflections', 15, y);
  y += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  
  if (journal.length > 0) {
    journal.forEach(j => {
      const splitNote = doc.splitTextToSize(`"${j.content}"`, pageWidth - 30);
      doc.text(splitNote, 15, y);
      y += (splitNote.length * 6) + 6;
      
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
    });
  } else {
    doc.text('No reflections recorded today.', 15, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setFillColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.rect(0, footerY, pageWidth, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('YOU ARE DOING AMAZING, PARENT.', pageWidth / 2, footerY + 18, { align: 'center' });

  doc.save(`Nestly_Newborn_Report_${date.toISOString().split('T')[0]}.pdf`);
};

export const generateLaborReport = (date: Date) => {
  const profile = storage.getProfile();
  if (!profile) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const dateStr = date.toLocaleDateString('en-GB', { 
    day: 'numeric',
    month: 'long', 
    year: 'numeric' 
  }).toUpperCase();
  
  const parentName = profile.userName || 'Parent';
  const babyNames = (profile.babies || []).map(b => b.name || 'Baby').join(', ');
  const startOfDay = new Date(date).setHours(0, 0, 0, 0);
  const endOfDay = new Date(date).setHours(23, 59, 59, 999);
  
  const contractions = (storage.getContractions() || []).filter(c => c.startTime >= startOfDay && c.startTime <= endOfDay);

  const burgundy = [126, 22, 49];
  const roseText = [244, 63, 94];
  const slateText = [71, 85, 105];
  
  // Header
  doc.setFillColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setFont('times', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(255, 255, 255);
  doc.text('Labor Summary', 20, 28);
  
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('NESTLY CONTRACTION TRACKER', 20, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(dateStr, pageWidth - 20, 28, { align: 'right' });

  let y = 60;
  
  // Profile Info Section
  doc.setFillColor(255, 250, 250);
  doc.roundedRect(15, y, pageWidth - 30, 30, 8, 8, 'F');
  
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text(`Mama: ${parentName}`, 25, y + 12);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(`Preparing for: ${babyNames}`, 25, y + 20);
  
  y += 45;

  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text(`Contraction History (${contractions.length} logs)`, 15, y);
  y += 12;

  // Table Header
  doc.setFillColor(roseText[0], roseText[1], roseText[2]);
  doc.roundedRect(15, y, pageWidth - 30, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('START', 20, y + 6.5);
  doc.text('END', 60, y + 6.5);
  doc.text('DURATION', 100, y + 6.5);
  doc.text('INTERVAL', 145, y + 6.5);
  y += 15;

  const formatDuration = (ms?: number) => {
    if (!ms) return 'Active';
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);

  if (contractions.length > 0) {
    [...contractions].forEach((c, i) => {
      doc.text(formatTime(c.startTime), 20, y);
      doc.text(c.endTime ? formatTime(c.endTime) : '---', 60, y);
      doc.text(formatDuration(c.duration), 100, y);
      doc.text(c.interval ? formatDuration(c.interval) : '---', 145, y);
      
      doc.setDrawColor(245, 245, 245);
      doc.line(15, y + 3, pageWidth - 15, y + 3);
      y += 10;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
  } else {
    doc.text('No contractions recorded for this date.', 15, y);
  }

  // Disclaimer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text('Nestly assists in tracking but does not replace medical advice. Contact your provider if labor intensifies.', pageWidth / 2, footerY, { align: 'center' });

  doc.save(`Nestly_Labor_Summary_${date.toISOString().split('T')[0]}.pdf`);
};

export const generateFullPregnancyReport = () => {
  const profile = storage.getProfile();
  if (!profile) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const burgundy = [126, 22, 49];
  const roseText = [244, 63, 94];
  const slateText = [71, 85, 105];

  // Header
  doc.setFillColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setFont('times', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(255, 255, 255);
  doc.text('Pregnancy Archive', 20, 30);
  
  doc.setFontSize(10);
  doc.text('A COMPLETE RECORD OF YOUR PREGNANCY JOURNEY', 20, 40);

  let y = 70;

  // Profile Section
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('Mama Profile', 20, y);
  y += 15;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(`Name: ${profile.userName}`, 25, y);
  y += 8;
  doc.text(`Due Date: ${new Date(profile.dueDate).toLocaleDateString()}`, 25, y);
  y += 8;
  doc.text(`Pregnancy Type: ${profile.pregnancyType.toUpperCase()}`, 25, y);
  y += 20;

  // Babies Section
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('The Babies', 20, y);
  y += 15;

  (profile.babies || []).forEach((baby, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(roseText[0], roseText[1], roseText[2]);
    doc.text(`Baby ${idx + 1}: ${baby.name || 'Unnamed'}`, 25, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text(`Gender: ${baby.gender.toUpperCase()}`, 30, y);
    y += 10;
  });

  // Summary Stats
  const kicks = storage.getKickLogs() || [];
  const weightLogs = storage.getWeightLogs() || [];
  const symptoms = storage.getSymptoms() || [];
  const kegels = storage.getKegelLogs() || [];

  if (y > 220) { doc.addPage(); y = 30; }

  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('Pregnancy Statistics', 20, y);
  y += 15;

  const stats = [
    { label: 'Total Kick Sessions', value: kicks.length },
    { label: 'Total Weight Entries', value: weightLogs.length },
    { label: 'Total Symptoms Logged', value: symptoms.length },
    { label: 'Total Kegel Sessions', value: kegels.length }
  ];

  stats.forEach(s => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text(`${s.label}:`, 25, y);
    doc.setTextColor(roseText[0], roseText[1], roseText[2]);
    doc.text(`${s.value}`, 80, y);
    y += 10;
  });

  y += 15;

  // Final Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('A lifetime of pregnancy memories, preserved by Nestly.', pageWidth / 2, footerY, { align: 'center' });

  doc.save(`Nestly_Full_Pregnancy_Archive.pdf`);
};

export const generateFullNewbornReport = () => {
  const profile = storage.getProfile();
  if (!profile) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const burgundy = [126, 22, 49];
  const roseText = [244, 63, 94];
  const slateText = [71, 85, 105];

  // Header
  doc.setFillColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setFont('times', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(255, 255, 255);
  doc.text('Newborn Archive', 20, 30);
  
  doc.setFontSize(10);
  doc.text('A COMPLETE RECORD OF YOUR BABY\'S FIRST DAYS', 20, 40);

  let y = 70;

  // Profile Section
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('Family Profile', 20, y);
  y += 15;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(`Parent: ${profile.userName}`, 25, y);
  y += 20;

  // Babies Section
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('The Babies', 20, y);
  y += 15;

  (profile.babies || []).forEach((baby, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(roseText[0], roseText[1], roseText[2]);
    doc.text(`Baby ${idx + 1}: ${baby.name || 'Unnamed'}`, 25, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text(`Gender: ${baby.gender.toUpperCase()}`, 30, y);
    y += 6;
    if (baby.birthDate) {
      doc.text(`Birth Date: ${new Date(baby.birthDate).toLocaleDateString()}`, 30, y);
      y += 6;
    }
    if (baby.birthWeight) {
      doc.text(`Birth Weight: ${baby.birthWeight} kg`, 30, y);
      y += 6;
    }
    y += 10;
  });

  // Summary Stats
  const feeding = storage.getFeedingLogs() || [];
  const milestones = storage.getMilestones() || [];
  const diapers = storage.getDiaperLogs() || [];
  const tummyTime = storage.getTummyTimeLogs() || [];

  if (y > 220) { doc.addPage(); y = 30; }

  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('Newborn Statistics', 20, y);
  y += 15;

  const stats = [
    { label: 'Total Feedings Logged', value: feeding.length },
    { label: 'Milestones Reached', value: milestones.length },
    { label: 'Diaper Changes', value: diapers.length },
    { label: 'Tummy Time Sessions', value: tummyTime.length }
  ];

  stats.forEach(s => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text(`${s.label}:`, 25, y);
    doc.setTextColor(roseText[0], roseText[1], roseText[2]);
    doc.text(`${s.value}`, 80, y);
    y += 10;
  });

  y += 15;

  // Milestones List
  if (milestones.length > 0) {
    if (y > 220) { doc.addPage(); y = 30; }
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
    doc.text('Milestone Timeline', 20, y);
    y += 15;

    milestones.sort((a, b) => a.timestamp - b.timestamp).forEach(m => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(roseText[0], roseText[1], roseText[2]);
      doc.text(new Date(m.date).toLocaleDateString(), 25, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      doc.text(m.title, 60, y);
      y += 8;

      if (y > 270) { doc.addPage(); y = 30; }
    });
  }

  // Final Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('A lifetime of newborn memories, preserved by Nestly.', pageWidth / 2, footerY, { align: 'center' });

  doc.save(`Nestly_Full_Newborn_Archive.pdf`);
};
