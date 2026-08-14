import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { toast } from 'sonner';
import { AlertCircle, Loader2 } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';

export default function JoinGroup() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading, joinGroup } = useData();
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (loading) return;

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
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-black text-foreground">Joining Group...</h2>
        <p className="text-muted-foreground text-xs font-light mt-1">Please wait while we validate your invitation link.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <DashboardCard className="max-w-md w-full p-8 flex flex-col items-center text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500" />
          <h2 className="text-2xl font-black text-foreground">Failed to Join Group</h2>
          <p className="text-muted-foreground text-xs font-light leading-relaxed">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-full shadow-sm hover:scale-105 transition-transform cursor-pointer"
          >
            Go to Dashboard
          </button>
        </DashboardCard>
      </div>
    );
  }

  return null;
}
