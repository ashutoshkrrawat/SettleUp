import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { toast } from 'sonner';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function JoinGroup() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading, joinGroup } = useData();
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (loading) return; // Wait until authentication check is complete

    if (!currentUser) {
      toast.info('Please sign in or register to join the group.');
      navigate(`/auth?redirect=/join/${inviteCode}`);
      return;
    }

    const triggerJoin = async () => {
      setJoining(true);
      try {
        const group = await joinGroup(inviteCode);
        toast.success(`Successfully joined group: ${group.name}!`);
        navigate(`/group/${group._id}`);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to join group.');
      } finally {
        setJoining(false);
      }
    };

    triggerJoin();
  }, [inviteCode, currentUser, loading, navigate, joinGroup]);

  if (loading || joining) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-bold">Joining Group...</h2>
        <p className="text-muted-foreground text-sm mt-1">Please wait while we add you to the group.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-orange-500 mb-4" />
        <h2 className="text-2xl font-black mb-2">Failed to Join Group</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return null;
}
