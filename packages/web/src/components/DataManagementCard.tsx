import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ExportValidationError,
  PregnancyProfile,
  ZeroDataExportV1,
} from '@nestly/shared';
import { AlertTriangle, Download, FileText, Upload } from 'lucide-react';
import { storage } from '../services/storageService.ts';
import { buildWebExport, downloadJson, importFromFile } from '../services/exportService.ts';
import { generateDoctorSummary } from '../services/reportService.ts';

interface DataManagementCardProps {
  profile: PregnancyProfile;
}

// The Your Data card owns all localStorage-mutating flows on the Settings
// page: JSON export, doctor-summary PDF, import-with-preview, and the
// typed-DELETE wipe. Split out of Settings.tsx so the Delete-all blast
// radius is obvious from the file structure and so the import/delete
// flows can be unit-tested without mounting the whole Settings page.
export const DataManagementCard: React.FC<DataManagementCardProps> = ({ profile: _profile }) => {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<ZeroDataExportV1 | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleExportJson = (): void => {
    try {
      downloadJson(buildWebExport());
    } catch {
      setImportError('Could not build export file. Please try again.');
    }
  };

  const handleExportPdf = (): void => {
    try {
      generateDoctorSummary();
    } catch {
      setImportError('Could not build doctor summary PDF. Please try again.');
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const payload = await importFromFile(file);
      setImportPreview(payload);
    } catch (err) {
      const msg =
        err instanceof ExportValidationError
          ? err.code === 'FUTURE_VERSION'
            ? 'This export was created by a newer version of Nestly. Please update the app first.'
            : err.code === 'LEGACY_VERSION' || err.code === 'MISSING_VERSION'
              ? 'This file is not a recognised Nestly export.'
              : err.message
          : 'Could not read this file. Only Nestly export JSON files are supported.';
      setImportError(msg);
    }
  };

  const handleImportConfirm = (): void => {
    if (!importPreview) return;
    try {
      storage.restoreFromExport(importPreview);
      window.location.reload();
    } catch {
      setImportError('Could not restore this export. Your existing data was not changed.');
      setImportPreview(null);
    }
  };

  const handleDeleteAll = (): void => {
    // Close the modal first so React doesn't try to unmount against
    // already-wiped state during the post-reload teardown frame.
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
    storage.wipeAllUserScopedKeys();
    window.location.reload();
  };

  return (
    <>
      <div className="card-premium p-6 space-y-4">
        <h3 className="font-bold text-slate-800">Your Data</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Nestly keeps everything on this device. Nothing is uploaded. Export a backup,
          bring a summary to your appointment, or move your data to another phone.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleExportJson}
            className="w-full py-4 bg-rose-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Download size={14} /> Export data
          </button>
          <p className="text-[10px] text-slate-400 leading-snug px-2 -mt-1">
            Saves a JSON backup of everything on this device. Keep it somewhere safe.
          </p>

          <button
            onClick={handleExportPdf}
            className="w-full py-4 bg-rose-50 text-rose-900 border-2 border-rose-100 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <FileText size={14} /> Doctor summary (PDF)
          </button>

          <button
            onClick={() => importInputRef.current?.click()}
            className="w-full py-4 bg-white text-rose-900 border-2 border-rose-100 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Upload size={14} /> Import data
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFileChange}
          />

          <div className="flex items-center gap-3 pt-4">
            <div className="flex-1 h-px bg-rose-100" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-300">
              Danger zone
            </span>
            <div className="flex-1 h-px bg-rose-100" />
          </div>

          <button
            onClick={() => {
              setDeleteConfirmText('');
              setShowDeleteConfirm(true);
            }}
            className="w-full py-4 text-rose-300 text-[10px] font-black uppercase tracking-[0.2em] hover:text-rose-600 transition-colors"
          >
            Delete all data
          </button>
        </div>
      </div>

      <AnimatePresence>
        {importPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-5"
            >
              <h3 className="text-xl font-bold text-slate-900">Replace all data on this device?</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Importing will overwrite your current profile, journal, tracker logs, and settings
                with the contents of this file. This cannot be undone.
              </p>
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 space-y-1 text-xs text-rose-900">
                <div>
                  <span className="font-bold">Exported:</span>{' '}
                  {new Date(importPreview.meta.exportedAt).toLocaleString('en-GB')}
                </div>
                <div>
                  <span className="font-bold">Source:</span> {importPreview.meta.platform} v{importPreview.meta.appVersion}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setImportPreview(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportConfirm}
                  className="flex-1 py-3 bg-rose-900 text-white font-bold rounded-xl hover:bg-rose-800 transition-colors"
                >
                  Replace
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {importError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-full">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Could not import file</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{importError}</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setImportError(null);
                    importInputRef.current?.click();
                  }}
                  className="w-full py-3 bg-rose-900 text-white font-bold rounded-xl hover:bg-rose-800 transition-colors"
                >
                  Try another file
                </button>
                <button
                  onClick={() => setImportError(null)}
                  className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-full">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Delete all data?</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                This will permanently erase your profile, journal, tracker logs, photos, and settings
                from this device. This cannot be undone. Export your data first if you want a backup.
              </p>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-rose-300 outline-none text-sm font-semibold"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                  className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  Delete all
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
