import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Sparkles, Receipt, Check, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import expenseService from '../../services/expenseService';
import { useData } from '../context/DataContext';

export default function ReceiptModal({ isOpen, onClose, defaultGroupId = null }) {
  const { currentUser, groups, addExpense } = useData();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [base64Data, setBase64Data] = useState(null);
  const [mimeType, setMimeType] = useState('image/jpeg');

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedData, setAnalyzedData] = useState(null);
  const [error, setError] = useState(null);

  // Form states prefilled after analysis
  const [groupId, setGroupId] = useState(defaultGroupId || (groups[0]?._id || ''));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState('EQUAL');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // 1. Handle image file selection & Base64 conversion
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
      setBase64Data(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 2. Send image to Gemini Receipt Vision API
  const handleAnalyzeReceipt = async () => {
    if (!base64Data) return;

    try {
      setAnalyzing(true);
      setError(null);
      const res = await expenseService.analyzeReceipt(base64Data, mimeType);

      if (res.success && res.data) {
        setAnalyzedData(res.data);
        setDescription(res.data.description || '');
        setAmount(res.data.amount || '');
        setSplitType(res.data.splitType || 'EQUAL');
      } else {
        setError('Failed to extract receipt details. Please try another image.');
      }
    } catch (err) {
      console.error('Receipt AI Error:', err);
      setError(err.response?.data?.message || 'Error analyzing receipt image.');
    } finally {
      setAnalyzing(false);
    }
  };

  // 3. Save confirmed expense to database
  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (!parsedAmt || parsedAmt <= 0 || !description.trim()) {
      setError('Please provide a valid description and positive amount.');
      return;
    }

    const targetGroup = groupId || defaultGroupId || groups[0]?._id;
    if (!targetGroup) {
      setError('Please select a group for this expense.');
      return;
    }

    const groupObj = groups.find(g => g._id === targetGroup);
    if (!groupObj || !groupObj.members || groupObj.members.length === 0) {
      setError('Selected group has no active members.');
      return;
    }

    // Calculate splits array for group members
    const memberCount = groupObj.members.length;
    const perPerson = Math.round((parsedAmt / memberCount) * 100) / 100;
    const splits = groupObj.members.map((m, idx) => {
      const mId = m._id || m;
      if (idx === memberCount - 1) {
        const sumPrev = perPerson * (memberCount - 1);
        return { user: mId, amount: Math.round((parsedAmt - sumPrev) * 100) / 100 };
      }
      return { user: mId, amount: perPerson };
    });

    try {
      setSubmitting(true);
      await addExpense({
        groupId: targetGroup,
        description: description.trim(),
        amount: parsedAmt,
        splitType,
        paidBy: currentUser?._id,
        splits
      });
      toast.success('✨ Expense added successfully from Receipt!');
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setBase64Data(null);
    setAnalyzedData(null);
    setError(null);
    setDescription('');
    setAmount('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-card border border-border shadow-2xl text-foreground"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2 text-base">
                  Receipt AI Scanner
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                    Gemini Vision
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">Scan receipt photo to populate expense details</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3 text-xs text-rose-600 dark:text-rose-400 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Upload or Preview Receipt */}
            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl border-border hover:border-purple-500/60 bg-muted/20 hover:bg-muted/50 cursor-pointer transition-all group">
                <div className="p-3.5 mb-3 rounded-full bg-secondary group-hover:bg-purple-500/20 text-muted-foreground group-hover:text-purple-500 transition-all">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-foreground">Click to upload receipt photo</span>
                <span className="text-xs text-muted-foreground mt-1">Supports PNG, JPG, JPEG, WEBP</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-border max-h-56 bg-black flex items-center justify-center">
                  <img src={previewUrl} alt="Receipt preview" className="object-contain max-h-56 w-full" />
                  <button
                    onClick={() => { setPreviewUrl(null); setAnalyzedData(null); }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors backdrop-blur-sm cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {!analyzedData && (
                  <button
                    onClick={handleAnalyzeReceipt}
                    disabled={analyzing}
                    className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing Receipt with Gemini AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Scan & Parse Receipt
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Step 2: Confirmed Form */}
            {analyzedData && (
              <form onSubmit={handleSubmitExpense} className="space-y-4 pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>AI extracted details! Verify or adjust before saving.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">Select Group</label>
                  <select
                    value={groupId || defaultGroupId || ''}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  >
                    {groups.map((g) => (
                      <option key={g._id} value={g._id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. D-Mart Groceries"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Split Scheme</label>
                    <select
                      value={splitType}
                      onChange={(e) => setSplitType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    >
                      <option value="EQUAL">Split Equally</option>
                      <option value="EXACT">Exact Amount</option>
                      <option value="PERCENT">Percentage</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Confirm & Add Expense
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
