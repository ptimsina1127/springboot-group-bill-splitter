import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Users, Check, X } from 'lucide-react';
import apiClient from '../../api/client';
import { getColor } from '../../utils/avatarColor';

export default function ParticipantLedger({ participant, items, sessionId, allParticipants, onUpdate, onEditingChange }) {
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState(participant.name);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({
    description: '',
    amount: '',
    paidByParticipantId: participant.id,
    sharedWithParticipantIds: allParticipants.map(p => p.id)
  });

  // Inline text editing
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Share dropdown
  const [shareOpen, setShareOpen] = useState(null);
  const [shareAbove, setShareAbove] = useState(false);
  const shareRef = useRef(null);

  // Add form share dropdown
  const [addShareOpen, setAddShareOpen] = useState(false);
  const [addShareAbove, setAddShareAbove] = useState(false);
  const addShareRef = useRef(null);

  const participantExpenses = items.filter(i => i.paidByParticipantId === participant.id);
  const sortedExpenses = [...participantExpenses].sort((a, b) =>
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Close share dropdown on outside click
  useEffect(() => {
    if (!shareOpen && !addShareOpen) return;
    const handler = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(null);
      if (addShareRef.current && !addShareRef.current.contains(e.target)) setAddShareOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [shareOpen, addShareOpen]);

  // --- Add Form ---
  const resetAddForm = () => setAddFormData({
    description: '', amount: '', paidByParticipantId: participant.id,
    sharedWithParticipantIds: allParticipants.map(p => p.id)
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/sessions/${sessionId}/items`, addFormData);
      resetAddForm();
      onEditingChange(false);
      onUpdate();
    } catch (error) { alert('Error adding expense'); }
  };

  const toggleAddShared = (pid) => {
    setAddFormData(prev => ({
      ...prev,
      sharedWithParticipantIds: prev.sharedWithParticipantIds.includes(pid)
        ? prev.sharedWithParticipantIds.filter(id => id !== pid)
        : [...prev.sharedWithParticipantIds, pid]
    }));
  };

  // --- Inline Editing ---
  const startEdit = (expenseId, field, value) => {
    setEditingField({ id: expenseId, field });
    setEditValue(String(value));
    onEditingChange(true);
  };

  const saveEdit = async () => {
    if (!editingField) return;
    const { id, field } = editingField;
    const expense = participantExpenses.find(e => e.id === id);
    if (!expense) { setEditingField(null); onEditingChange(false); return; }

    const val = field === 'amount' ? parseFloat(editValue) : editValue.trim();
    if (val === '' || (field === 'amount' && isNaN(val))) { setEditingField(null); onEditingChange(false); return; }

    const updateData = {
      description: field === 'description' ? val : expense.description,
      amount: field === 'amount' ? val : expense.amount,
      paidByParticipantId: expense.paidByParticipantId,
      sharedWithParticipantIds: expense.sharedWithParticipantIds
    };

    try {
      await apiClient.put(`/sessions/${sessionId}/items/${id}`, updateData);
      onUpdate();
    } catch (error) { alert('Error updating expense'); }
    setEditingField(null);
    onEditingChange(false);
  };

  const editKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
    if (e.key === 'Escape') { setEditingField(null); onEditingChange(false); }
  };

  // --- Share Dropdown ---
  const openShare = (expenseId, e) => {
    if (shareOpen === expenseId) { setShareOpen(null); return; }
    const card = e.currentTarget.closest('.bg-white:not(button)');
    const btnRect = e.currentTarget.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const spaceBelow = cardRect.bottom - btnRect.bottom;
    setShareAbove(spaceBelow < 80);
    setShareOpen(expenseId);
  };

  const toggleShareExpense = async (pid) => {
    if (!shareOpen) return;
    const expense = participantExpenses.find(e => e.id === shareOpen);
    if (!expense) return;
    const current = expense.sharedWithParticipantIds;
    const updated = current.includes(pid)
      ? current.filter(id => id !== pid)
      : [...current, pid];

    try {
      await apiClient.put(`/sessions/${sessionId}/items/${shareOpen}`, {
        description: expense.description,
        amount: expense.amount,
        paidByParticipantId: expense.paidByParticipantId,
        sharedWithParticipantIds: updated
      });
      onUpdate();
    } catch (error) { alert('Error updating sharing'); }
  };

  // --- Delete ---
  const removeExpense = async (id) => {
    try {
      await apiClient.delete(`/sessions/${sessionId}/items/${id}`);
      if (editingField?.id === id) { setEditingField(null); onEditingChange(false); }
      onUpdate();
    } catch (error) { alert('Error removing expense'); }
  };

  // --- Name Editing ---
  const saveName = async () => {
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== participant.name) {
      try {
        await apiClient.put(`/sessions/${sessionId}/participants/${participant.id}`, { name: trimmed });
        onUpdate();
      } catch (error) { alert('Error updating name'); }
    }
    setEditingName(false);
    onEditingChange(false);
  };

  const nameKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveName(); }
    if (e.key === 'Escape') { setEditedName(participant.name); setEditingName(false); onEditingChange(false); }
  };

  const isEditingThis = (id, field) => editingField?.id === id && editingField?.field === field;

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-lg hover:border-slate-200">
      <div className="bg-slate-50/50 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-100 flex items-center gap-2">
        <div style={{ backgroundColor: getColor(participant.name) }}
          className="w-8 h-8 sm:w-9 sm:h-9 text-slate-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
          {participant.name[0].toUpperCase()}
        </div>
        {editingName ? (
          <input autoFocus value={editedName} onChange={(e) => setEditedName(e.target.value)}
            onBlur={saveName} onKeyDown={nameKeyDown}
            className="font-bold text-slate-800 text-base sm:text-lg bg-transparent border-b-2 border-brand-500 outline-none flex-1 py-0.5" />
        ) : (
          <h4 onClick={() => { setEditedName(participant.name); setEditingName(true); onEditingChange(true); }}
            className={`cursor-pointer hover:text-brand-600 transition-colors ${participant.name.length > 10 ? 'font-semibold text-sm sm:text-base' : 'font-bold text-base sm:text-lg'}`}>
            {participant.name}
          </h4>
        )}
      </div>

      <div className="p-3 sm:p-4 space-y-2">

        {/* Expense Items — render first */}
        {sortedExpenses.length > 0 && (
          <div className="space-y-1.5 sm:space-y-2">
            {sortedExpenses.map(exp => (
              <div key={exp.id} className="bg-slate-50/50 rounded-xl border border-slate-100 transition-all hover:border-slate-200">
                <div className="p-2.5 sm:p-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* Clickable Description */}
                    {isEditingThis(exp.id, 'description') ? (
                      <input autoFocus value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit} onKeyDown={editKeyDown}
                        className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-brand-400 outline-none text-xs sm:text-sm font-medium" />
                    ) : (
                      <span onClick={() => startEdit(exp.id, 'description', exp.description)}
                        className="flex-1 min-w-0 text-slate-600 font-medium text-xs sm:text-sm truncate cursor-pointer hover:text-brand-600 transition-colors">
                        {exp.description}
                      </span>
                    )}

                    {/* Clickable Amount */}
                    {isEditingThis(exp.id, 'amount') ? (
                      <input autoFocus type="number" step="0.01" value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit} onKeyDown={editKeyDown}
                        className="w-16 sm:w-20 shrink-0 px-2 py-1 rounded-lg border border-brand-400 outline-none text-xs sm:text-sm font-medium text-right" />
                    ) : (
                      <span onClick={() => startEdit(exp.id, 'amount', exp.amount)}
                        className="shrink-0 font-medium text-slate-800 text-xs sm:text-sm cursor-pointer hover:text-brand-600 transition-colors tabular-nums">
                        ${exp.amount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1.5">
                    <div className="relative">
                      <button onClick={(e) => openShare(exp.id, e)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-brand-500 hover:border-brand-300 transition-all text-[10px] font-bold">
                        <Users className="w-3 h-3" />
                        <span>{exp.sharedWithParticipantIds.length === allParticipants.length ? 'ALL' : `${exp.sharedWithParticipantIds.length}/${allParticipants.length}`}</span>
                      </button>
                      {shareOpen === exp.id && (
                        <div ref={shareRef}
                          className={`absolute z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 w-72 ${shareAbove ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Split with</div>
                          <div className="grid gap-1 grid-cols-3">
                            {allParticipants.map(p => {
                              const checked = exp.sharedWithParticipantIds.includes(p.id);
                              return (
                                <label key={p.id} className="flex items-center gap-1.5 px-2 py-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                                  <input type="checkbox" checked={checked} onChange={() => toggleShareExpense(p.id)}
                                    className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500" />
                                  <span className={`${p.name.length > 12 ? 'text-xs font-semibold' : 'text-sm font-semibold'} text-slate-700`}>{p.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    <button onClick={() => removeExpense(exp.id)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inline Add Form — render below existing expenses */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-100 space-y-2">
            <div className="flex gap-2 min-w-0">
              <input required value={addFormData.description}
                onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                placeholder="Expense description"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 focus:ring-4 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all text-xs sm:text-sm font-medium" />
              <input required type="number" step="0.01" min="0.01" value={addFormData.amount}
                onChange={(e) => setAddFormData({ ...addFormData, amount: e.target.value })}
                placeholder="0.00"
                className="w-20 shrink-0 px-3 py-2 rounded-xl border border-slate-200 focus:ring-4 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all text-xs sm:text-sm font-medium text-right" />
            </div>
            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Split with</label>
              <button type="button" onClick={(e) => {
                  if (addShareOpen) { setAddShareOpen(false); return; }
                  const card = e.currentTarget.closest('.bg-white:not(button)');
                  const btnRect = e.currentTarget.getBoundingClientRect();
                  const cardRect = card.getBoundingClientRect();
                  const spaceBelow = cardRect.bottom - btnRect.bottom;
                  setAddShareAbove(spaceBelow < 80);
                  setAddShareOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-500 transition-all text-xs font-semibold">
                <Users className="w-3 h-3" />
                {addFormData.sharedWithParticipantIds.length === allParticipants.length
                  ? 'ALL'
                  : `${addFormData.sharedWithParticipantIds.length}/${allParticipants.length}`}
              </button>
              {addShareOpen && (
                <div ref={addShareRef}
                  className={`absolute z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 w-72 ${addShareAbove ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Split with</div>
                  <div className="grid gap-1 grid-cols-3">
                    {allParticipants.map(p => (
                      <label key={p.id} className="flex items-center gap-1.5 px-2 py-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                        <input type="checkbox" checked={addFormData.sharedWithParticipantIds.includes(p.id)}
                          onChange={() => toggleAddShared(p.id)}
                          className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500" />
                        <span className="text-xs font-semibold text-slate-700 truncate">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-0.5">
              <button type="submit" className="flex-1 bg-brand-500 text-white py-2 rounded-xl font-bold text-xs transition-all hover:bg-brand-600 active:scale-95 shadow-sm flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" /> Add
              </button>
              <button type="button" onClick={() => { setShowAddForm(false); resetAddForm(); onEditingChange(false); }}
                className="px-3 py-2 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 transition-all flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* Empty state */}
        {sortedExpenses.length === 0 && !showAddForm && (
          <div className="text-center py-4 text-slate-400 text-xs font-medium">No expenses yet</div>
        )}

        {/* Plus button at bottom */}
        {!showAddForm && (
          <div className="flex justify-center pt-0.5">
            <button onClick={() => { setShowAddForm(true); resetAddForm(); onEditingChange(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-brand-500 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-all font-bold text-xs active:scale-95">
              <Plus className="w-3.5 h-3.5" /> Add Expense
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
