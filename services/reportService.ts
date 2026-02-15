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
  
  const mamaName = profile.userName || 'Mama';

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

  const burgundy = [126, 34, 49];
  const roseText = [219, 39, 119];
  const grayText = [107, 114, 128];
  const boxBg = [255, 245, 245];

  doc.setFillColor(255, 250, 250);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('Nestly', 15, 25);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(roseText[0], roseText[1], roseText[2]);
  doc.text('YOUR PREGNANCY COMPANION', 15, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(dateStr, pageWidth - 15, 25, { align: 'right' });
  doc.text(`Mama: ${mamaName}`, pageWidth - 15, 30, { align: 'right' });

  let y = 55;
  doc.setDrawColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 10;

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('Notes for one', 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('A dedicated summary of your well-being on this beautiful journey.', 15, y);
  y += 20;

  const boxWidth = (pageWidth - 40) / 2;
  const boxHeight = 45;

  doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
  doc.roundedRect(15, y, boxWidth, boxHeight, 5, 5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(roseText[0], roseText[1], roseText[2]);
  doc.text('VITAL STATS', 25, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(`Weight: ${weightLogs.length > 0 ? weightLogs[0].weight + ' kg' : '---'}`, 25, y + 20);
  doc.text(`Sleep: ${sleep ? sleep.hours + ' hrs' : '---'}`, 25, y + 27);
  doc.text(`Water: ${water > 0 ? water + ' ml' : '---'}`, 25, y + 34);

  doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
  doc.roundedRect(15 + boxWidth + 10, y, boxWidth, boxHeight, 5, 5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(roseText[0], roseText[1], roseText[2]);
  doc.text('NUTRITION INTAKE', 15 + boxWidth + 20, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(`Calories: ${nutritionTotals.c > 0 ? nutritionTotals.c + ' kcal' : '---'}`, 15 + boxWidth + 20, y + 20);
  doc.text(`Protein: ${nutritionTotals.p > 0 ? nutritionTotals.p + ' g' : '---'}`, 15 + boxWidth + 20, y + 27);
  doc.text(`Iron: ${nutritionTotals.i > 0 ? nutritionTotals.i + ' mg' : '---'}`, 15 + boxWidth + 20, y + 34);

  y += 60;

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('Activities & Symptoms', 15, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Exercise: None logged', 15, y);
  y += 5;
  const symptomText = symptoms.length > 0 
    ? `Symptoms: ${symptoms.map(s => s.type).join(', ')}` 
    : 'Symptoms: No symptoms reported';
  doc.text(symptomText, 15, y);
  y += 20;

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(12);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('Daily Reflections', 15, y);
  y += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  
  if (journal.length > 0) {
    journal.forEach(j => {
      const splitNote = doc.splitTextToSize(`"${j.content}"`, pageWidth - 30);
      doc.text(splitNote, 15, y);
      y += (splitNote.length * 5) + 5;
    });
  } else {
    doc.text('No notes were recorded today. Every day is a new page in your motherhood story.', 15, y);
  }

  doc.setFillColor(255, 245, 245);
  doc.rect(0, doc.internal.pageSize.getHeight() - 40, pageWidth, 40, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(roseText[0], roseText[1], roseText[2]);
  doc.text('KEEP NESTING, MAMA. YOU ARE DOING AMAZING.', pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });

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
  
  const mamaName = profile.userName || 'Mama';
  const startOfDay = new Date(date).setHours(0, 0, 0, 0);
  const endOfDay = new Date(date).setHours(23, 59, 59, 999);
  
  const contractions = storage.getContractions().filter(c => c.startTime >= startOfDay && c.startTime <= endOfDay);

  const burgundy = [126, 34, 49];
  const roseText = [219, 39, 119];
  const grayText = [107, 114, 128];
  
  doc.setFillColor(255, 250, 250);
  doc.rect(0, 0, pageWidth, 50, 'F');
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text('Labor Summary', 15, 25);
  doc.setFontSize(9);
  doc.setTextColor(roseText[0], roseText[1], roseText[2]);
  doc.text('NESTLY CONTRACTION TRACKER', 15, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(dateStr, pageWidth - 15, 25, { align: 'right' });
  doc.text(`Mama: ${mamaName}`, pageWidth - 15, 30, { align: 'right' });

  let y = 60;
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(burgundy[0], burgundy[1], burgundy[2]);
  doc.text(`Contraction History (${contractions.length} logs)`, 15, y);
  y += 12;

  doc.setFillColor(244, 63, 94);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('START', 20, y + 5.5);
  doc.text('END', 60, y + 5.5);
  doc.text('DURATION', 100, y + 5.5);
  doc.text('INTERVAL (SINCE LAST)', 140, y + 5.5);
  y += 12;

  const formatDuration = (ms?: number) => {
    if (!ms) return 'Active';
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);

  if (contractions.length > 0) {
    [...contractions].forEach((c, i) => {
      doc.text(formatTime(c.startTime), 20, y);
      doc.text(c.endTime ? formatTime(c.endTime) : '---', 60, y);
      doc.text(formatDuration(c.duration), 100, y);
      doc.text(c.interval ? formatDuration(c.interval) : '---', 140, y);
      
      doc.setDrawColor(245, 245, 245);
      doc.line(15, y + 2, pageWidth - 15, y + 2);
      y += 8;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
  } else {
    doc.text('No contractions recorded for this date.', 15, y);
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Nestly assists in tracking but does not replace medical advice. Contact your provider if labor intensifies.', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  doc.save(`Nestly_Labor_Summary_${date.toISOString().split('T')[0]}.pdf`);
};