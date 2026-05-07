import React, { useState } from 'react';
import { Plus, Trash2, Edit2, UserPlus } from 'lucide-react';
import apiClient from '../api/client';

export default function ParticipantList({ sessionId, participants, onUpdate }) {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const addParticipant = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/sessions/${sessionId}/participants`, { name });
      setName('');
      onUpdate();
    } catch (error) { alert('Error adding participant'); }
  };

  const removeParticipant = async (id) => {
    try {
      await apiClient.delete(`/sessions/${sessionId}/participants/${id}`);
      onUpdate();
    } catch (error) { alert('Error removing participant'); }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const saveEdit = async (id) => {
    try {
      await apiClient.put(`/sessions/${sessionId}/participants/${id}`, { name: editName });
      setEditingId(null);
      onUpdate();
    } catch (error) { alert('Error updating participant'); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p la-6">
      <h3 className="text-xl font-bold text-slate-900 mb la-6 flex items-center gap la-2">
        <UserPlus className="w-5 h-5 text-brand-500" /> Participants
      </h3>
      
      <form onSubmit={addParticipant} className="flex gap la-2 mb la-6">
        <input 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name..."
          className="flex-1 px la-3 py la-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-brand-400"
        />
        <button type="submit" className="bg-brand-500 text-white p la-2 rounded-lg hover:bg-brand-600 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="space-y la-3">
        {participants.map((p) => (
          <div key={p.id} className="flex items-center justify-between p la-3 bg-slate-50 rounded-xl border border-slate-100 group">
            {editingId === p.id ? (
              <div className="flex gap la-2 w-full">
                <input 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px la-2 py la-1 rounded border border-slate-200 text-sm"
                />
                <button onClick={() => saveEdit(p.id)} className="text-green-600 font-bold text-xs">Save</button>
              </div>
            ) : (
              <>
                <span className="text-slate-700 font-medium">{p.name}</span>
                <div className="flex gap la-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(p)} className="p la-1 text-slate-400 hover:text-brand-500 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                    <button onClick={() => removeParticipant(p.id)} className="p la-1 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
