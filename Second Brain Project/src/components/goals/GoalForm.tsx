import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Plus } from 'lucide-react';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const GoalForm = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/goals', { title });
      // Trigger refetch of goals list
      window.location.reload(); // Simple approach; use SWR/React Query for better UX
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
    setOpen(false);
    setTitle('');
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
        <Plus className="mr-2 h-4 w-4" /> New Goal
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Set a New Goal</h2>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Goal Title</label>
            <Input 
              placeholder="e.g. Run 5km, Build SaaS MVP..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-indigo-600 text-white">Create Goal</Button>
        </form>
      </div>
    </div>
  );
};

