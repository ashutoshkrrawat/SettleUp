import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, X, Check, Loader2, DollarSign, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import useVoiceRecognition from '../hooks/useVoiceRecognition';
import expenseService from '../../services/expenseService';
import { useData } from '../context/DataContext';

export default function VoiceAIModal({ isOpen, onClose }) {
  const { groups, currentUser, addExpense } = useData();
  const {
    isListening,
    transcript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition();

  const [parsing, setParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [parseError, setParseError] = useState(null);

  // Form states for confirmation step
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState('EQUAL');

  // Auto-start listening when modal opens
  useEffect(() => {
    if (isOpen) {
      setParsedResult(null);
      setParseError(null);
      resetTranscript();
      if (isSupported) {
        startListening();
      }
    } else {
      stopListening();
    }
  }, [isOpen]);

  // When speech stops and we have a transcript, send to AI parser
  useEffect(() => {
    if (!isListening && transcript && transcript.trim().length > 3 && !parsedResult && !parsing) {
      handleParseTranscript(transcript);
    }
  }, [isListening, transcript]);

  const handleParseTranscript = async (textToParse) => {
    const queryText = textToParse || transcript;
    if (!queryText || !queryText.trim()) return;

    setParsing(true);
    setParseError(null);

    try {
      const result = await expenseService.parseVoiceExpense(queryText.trim());
      setParsedResult(result);
      setSelectedGroupId(result.matchedGroupId || (groups[0]?._id || ''));
      setDescription(result.description || 'Voice Expense');
      setAmount(result.amount ? String(result.amount) : '');
      setSplitType(result.splitType || 'EQUAL');
    } catch (err) {
      console.error('AI Parse error:', err);
      setParseError('Failed to parse voice command. Try again.');
      toast.error('AI parsing failed. Please try speaking again.');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmAndLog = async (e) => {
    e.preventDefault();
    if (!selectedGroupId) {
      toast.error('Please select a group.');
      return;
    }
    if (!description.trim()) {
      toast.error('Description is required.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    const targetGroup = groups.find(g => g._id === selectedGroupId);
    if (!targetGroup) {
      toast.error('Group not found.');
      return;
    }

    // Build splits for equal distribution
    const membersCount = targetGroup.members.length;
    const splitAmt = Math.round((numAmount / membersCount) * 100) / 100;
    const splits = targetGroup.members.map((member, idx) => {
      const memberId = member?._id || member;
      if (idx === membersCount - 1) {
        const sumPrevious = splitAmt * (membersCount - 1);
        return { user: memberId, amount: Math.round((numAmount - sumPrevious) * 100) / 100 };
      }
      return { user: memberId, amount: splitAmt };
    });

    try {
      await addExpense({
        groupId: selectedGroupId,
        description: description.trim(),
        amount: numAmount,
        splitType,
        paidBy: currentUser._id,
        splits
      });

      toast.success(`🎉 Voice AI logged $${numAmount.toFixed(2)} in "${targetGroup.name}"!`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log expense');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-card border border-border/70 w-full max-w-md p-7 rounded-[32px] shadow-[0_24px_55px_rgba(0,0,0,0.22)] relative z-10 space-y-6"
        >
          {/* Top Title Bar */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-foreground">
                  Voice AI Assistant
                </h3>
                <p className="text-[11px] text-muted-foreground font-light">
                  Natural language expense logging
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!isSupported ? (
            <div className="text-center p-6 space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h4 className="font-bold text-sm text-foreground">Browser Not Supported</h4>
              <p className="text-xs text-muted-foreground">
                Your browser does not support speech recognition. Try Google Chrome, Edge, or Safari.
              </p>
            </div>
          ) : (
            <>
              {/* STATE 1: Listening Animation & Live Transcript */}
              {isListening && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-5">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-24 h-24 rounded-full bg-primary/20 animate-ping pointer-events-none" />
                    <button
                      onClick={stopListening}
                      className="relative w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_30px_rgba(243,200,76,0.5)] dark:shadow-[0_0_30px_rgba(121,166,23,0.5)] transition-transform hover:scale-105 cursor-pointer"
                    >
                      <Mic className="w-8 h-8 stroke-[2.5] animate-pulse" />
                    </button>
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                      Listening... Speak now
                    </p>
                    <p className="text-xs text-muted-foreground font-light min-h-[3rem] italic">
                      "{transcript || 'Say something like: "Equally split 1000 rupees for dinner in Goa Trip"'}"
                    </p>
                  </div>
                  <button
                    onClick={stopListening}
                    className="px-4 py-1.5 bg-secondary border border-border/60 text-xs font-bold rounded-full text-foreground hover:bg-secondary/80 cursor-pointer"
                  >
                    Done Speaking ➔
                  </button>
                </div>
              )}

              {/* STATE 2: AI Parsing Loader */}
              {!isListening && parsing && (
                <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <div>
                    <h4 className="font-bold text-sm text-foreground">AI Processing Intent...</h4>
                    <p className="text-xs text-muted-foreground italic font-light mt-1">
                      "{transcript}"
                    </p>
                  </div>
                </div>
              )}

              {/* STATE 3: AI Result Preview Confirmation Card */}
              {!isListening && !parsing && parsedResult && (
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleConfirmAndLog}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-2xl bg-secondary/50 border border-border/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Parsed Result
                      </span>
                      <button
                        type="button"
                        onClick={startListening}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry Voice
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                          Group Pool
                        </label>
                        <select
                          value={selectedGroupId}
                          onChange={(e) => setSelectedGroupId(e.target.value)}
                          className="w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none"
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
                          <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                            Amount ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none font-mono"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 bg-secondary text-muted-foreground hover:text-foreground font-bold text-xs rounded-full border border-border/60 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 premium-btn-attention py-3 bg-primary text-primary-foreground font-bold text-xs rounded-full shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Log</span>
                    </button>
                  </div>
                </motion.form>
              )}

              {/* STATE 4: Idle Speech Prompt (Initial open without speech) */}
              {!isListening && !parsing && !parsedResult && (
                <div className="py-6 text-center space-y-4">
                  <button
                    onClick={startListening}
                    className="w-16 h-16 rounded-full bg-primary text-primary-foreground mx-auto flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
                  >
                    <Mic className="w-7 h-7 stroke-[2.5]" />
                  </button>
                  <p className="text-xs text-muted-foreground font-light">
                    Click the microphone to start speaking.
                  </p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
