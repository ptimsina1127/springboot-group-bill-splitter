import React, { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import apiClient from '../api/client';

export default function ExpenseList({ sessionId, participants, items, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [item, setItem] = useState({ description: '', amount: '', paidByParticipantId: '', sharedWithParticipantIds: [] });
  const [editingId, setEditingId] = useState(null);

  const openAddModal = () => {
    setItem({ description: '', amount: '', paidByParticipantId: participants[0]?.id || '', sharedWithParticipantIds: participants.map(p => p.id) });
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setItem({ ...item, amount: item.amount.toString() });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/sessions/${sessionId}/items/${editingId}`, item);
      } else {
        await apiClient.post(`/sessions/${sessionId}/items`, item);
      }
      setShowModal(false);
      onUpdate();
    } catch (error) { alert('Error saving expense'); }
  };

  const removeItem = async (id) => {
    try {
      await apiClient.delete(`/sessions/${sessionId}/items/${id}`);
      onUpdate();
    } catch (error) { alert('Error removing expense'); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p la-6">
      <div className="flex justify-between items-center mb la-6">
        <h3 className="text-xl font-bold text-slate-900">Expenses</h3>
        <button 
          onClick={openAddModal}
          className="flex items-center gap la-2 bg-brand-500 text-white px la-4 py la-2 rounded-xl font-semibold hover:bg-brand-600 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-400 text-sm uppercase tracking-wider">
              <th className="pb la-4 font-medium">Description</th>
              <th className="pb la-4 font-medium">Paid By</th>
              <th className="pb la-4 font-medium text-right">Amount</th>
              <th className="pb la-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="group">
                <td className="py la-4 text-slate-700 font-medium">{item.description}</td>
                <td className="py la-4 text-slate-500 text-sm">
                  {participants.find(p => p.id === item.paidByParticipantId)?.name || 'Unknown'}
                </td>
                <td className="py la-4 text-right font-bold text-slate-900">${item.amount}</td>
                <td className="py la-4 text-right">
                  <div className="flex justify-end gap la-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(item)} className="p la-1 text-slate-400 hover:text-brand-500 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeItem(item.id)} className="p la-1 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="4" className="py la-12 text-center text-slate-400 italic">No expenses added yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p la-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 mb la-6">{editingId ? 'Edit' : 'Add'} Expense</h3>
            <form onSubmit={handleSave} className="space-y la-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb la-1">Description</label>
                <input 
                  required
                  value={item.description}
                  onChange={(e) => setItem({...item, description: e.target.value})}
                  className="w-full px la-4 py la-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb la-1">Amount ($)</label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  value={item.amount}
                  onChange={(e) => setItem({...item, amount: e.target.value})}
                  className="w-full px la-4 py la-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb la-2">Paid By</label>
                <select 
                  value={item.paidByParticipantId}
                  onChange={(e) => setItem({...item, paidByParticipantId: e.target.value})}
                  className="w-full px la-4 py la-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-400 outline-none"
                >
                  {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb la-2">Split with</label>
                <div className="grid grid-cols la-2 gap la-2 max-h-40 overflow-y-auto p la-2 bg-slate-50 rounded-xl border border-slate-100">
                  {participants.map(p => (
                    <label key={p.id} className="flex items-center gap la-2 p la-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                      <input 
                        type="checkbox"
                        checked={item.sharedWithParticipantIds.includes(p.id)}
                        onChange={(e) => {
                          const current = [...item.sharedWithParticipantIds];
                          if (e.target.checked) current.push(p.id);
                          else current.splice(current.indexOf(p.id), 1);
                          setItem({...item, sharedWithParticipantIds: current});
                        }}
                        className="rounded text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-sm text-slate-600">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap la-3 mt la-8">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px la-4 py la-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-brand-500 text-white px la-4 py la-3 rounded-xl font-bold hover:bg-brand-600 transition-all shadow-lg shadow-brand-200 active:scale-95"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
