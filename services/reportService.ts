import { storage } from './storageService.ts';
import { Trimester } from '../types.ts';
import { jsPDF } from 'jspdf';

export const generateDailyReport = (date: Date) => {
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

  // Data Fetching
  const weightLogs = storage.getWeightLogs().filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay);
  const foods = storage.getFoodEntries().filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay);
  const water = storage.getWaterLogs().filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay)
                       .reduce((acc, curr) => acc + curr.amount, 0);
  const sleep = storage.getSleepLogs().find(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay);
  const symptoms = storage.getSymptoms().filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay);
  const journal = storage.getJournalEntries().filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay);

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
  doc.text('Daily Wellness Report', 15, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text('A dedicated summary of your well-being on this beautiful journey.', 15, y);
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

  // Nutrition Box
  doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
  doc.roundedRect(15 + boxWidth + 10, y, boxWidth, boxHeight, 8, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(roseText[0], roseText[1], roseText[2]);
  doc.text('NUTRITION', 15 + boxWidth + 25, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(`Calories: ${nutritionTotals.c > 0 ? nutritionTotals.c + ' kcal' : '---'}`, 15 + boxWidth + 25, y + 24);
  doc.text(`Protein: ${nutritionTotals.p > 0 ? nutritionTotals.p + ' g' : '---'}`, 15 + boxWidth + 25, y + 31);
  doc.text(`Iron: ${nutritionTotals.i > 0 ? nutritionTotals.i + ' mg' : '---'}`, 15 + boxWidth + 25, y + 38);

  y += 60;

  // Symptoms & Activities
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('Symptoms & Activities', 15, y);
  y += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  
  const symptomText = symptoms.length > 0 
    ? `Reported Symptoms: ${symptoms.map(s => s.type).join(', ')}` 
    : 'No symptoms reported today.';
  
  const splitSymptoms = doc.splitTextToSize(symptomText, pageWidth - 30);
  doc.text(splitSymptoms, 15, y);
  y += (splitSymptoms.length * 6) + 10;

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
    doc.text('No reflections recorded today. Every day is a new chapter in your story.', 15, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setFillColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.rect(0, footerY, pageWidth, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('YOU ARE DOING AMAZING, PARENT.', pageWidth / 2, footerY + 18, { align: 'center' });

  doc.save(`Nestly_Daily_Report_${date.toISOString().split('T')[0]}.pdf`);
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
  
  const contractions = storage.getContractions().filter(c => c.startTime >= startOfDay && c.startTime <= endOfDay);

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