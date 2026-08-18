import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, X, Check, Loader2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { toast } from 'sonner';
import expenseService from '../../services/expenseService';
import useAudioRecorder from '../hooks/useAudioRecorder';

export default function VoiceAIModal({ isOpen, onClose }) {
  const { groups, addExpense, currentUser } = useData();
  const { isRecording, recordingTime, volumeLevel, startRecording, stopRecording } = useAudioRecorder();

  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  // Form fields extracted by AI
  const [selectedGroup, setSelectedGroup] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState('EQUAL');

  const handleToggleRecording = async () => {
    if (isRecording) {
      try {
        setIsProcessing(true);
        const { audioBase64, mimeType } = await stopRecording();

        toast.info('Analyzing voice recording with Gemini AI...');
        const result = await expenseService.parseAudioExpense(audioBase64, mimeType);

        if (result.success && result.data) {
          const data = result.data;
          setParsedData(data);
          setDescription(data.description || '');
          setAmount(data.amount ? data.amount.toString() : '');
          setSplitType(data.splitType || 'EQUAL');

          const matchedGroup = groups.find(g => g._id === data.matchedGroupId) || groups[0];
          if (matchedGroup) {
            setSelectedGroup(matchedGroup._id);
          }
          toast.success('Voice audio analyzed successfully!');
        }
      } catch (err) {
        console.error('Audio AI processing error:', err);
        toast.error(err.response?.data?.message || 'Failed to process audio recording');
      } finally {
        setIsProcessing(false);
      }
    } else {
      try {
        setParsedData(null);
        await startRecording();
      } catch (err) {
        toast.error(err.message || 'Microphone access required');
      }
    }
  };

  const handleConfirmExpense = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0 || !selectedGroup) {
      toast.error('Please verify all expense details before saving.');
      return;
    }

    const group = groups.find(g => g._id === selectedGroup);
    if (!group) return;

    let splits = [];
    const members = group.members || [];
    if (splitType === 'EQUAL' && members.length > 0) {
      const perPerson = Math.round((numAmount / members.length) * 100) / 100;
      splits = members.map((m, idx) => {
        const mId = m._id || m;
        if (idx === members.length - 1) {
          const prevSum = perPerson * (members.length - 1);
          return { user: mId, amount: Math.round((numAmount - prevSum) * 100) / 100 };
        }
        return { user: mId, amount: perPerson };
      });
    }

    addExpense({
      groupId: selectedGroup,
      description: description.trim(),
      amount: numAmount,
      splitType,
      paidBy: currentUser._id,
      splits
    });

    toast.success('✨ Expense logged via Voice AI!');
    onClose();
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-card border border-border/80 w-full max-w-lg p-7 rounded-[36px] shadow-2xl relative z-10 space-y-6 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-foreground">Voice AI Assistant</h3>
                <p className="text-[11px] text-muted-foreground font-light">
                  Record audio in any browser or phone to log expenses automatically.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Microphone Box */}
          <div className="flex flex-col items-center justify-center py-6 space-y-4 bg-secondary/30 rounded-3xl border border-border/40 relative">
            <div className="relative flex items-center justify-center">
              {isRecording && (
                <motion.div
                  animate={{ scale: [1, 1 + volumeLevel / 100, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="absolute inset-0 rounded-full bg-primary/20"
                  style={{ width: '100px', height: '100px', margin: '-10px' }}
                />
              )}

              <button
                onClick={handleToggleRecording}
                disabled={isProcessing}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer relative z-10 ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-primary text-primary-foreground hover:scale-105'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-foreground">
                {isProcessing
                  ? 'AI analyzing audio with Gemini 2.5 Flash...'
                  : isRecording
                  ? `Recording Microphone (${formatTimer(recordingTime)})... Click to Stop`
                  : 'Click Microphone to start recording'}
              </p>
              <p className="text-[11px] text-muted-foreground font-light">
                Say e.g.: "Split 1200 rupees for dinner in Goa Trip group"
              </p>
            </div>
          </div>

          {/* Confirmation Card */}
          {parsedData && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleConfirmExpense}
              className="space-y-4 pt-2 border-t border-border/50"
            >
              <div className="flex items-center gap-2 text-xs text-primary font-bold">
                <Sparkles className="w-4 h-4" />
                <span>AI Extracted Details:</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Select Target Group
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full bg-secondary border border-border/60 rounded-2xl px-4 py-2.5 text-xs text-foreground outline-none"
                    required
                  >
                    {groups.map(g => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-secondary border border-border/60 rounded-2xl px-4 py-2 text-xs text-foreground outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-secondary border border-border/60 rounded-2xl px-4 py-2 text-xs text-foreground outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Log Expense</span>
              </button>
            </motion.form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
