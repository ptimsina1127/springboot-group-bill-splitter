import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, RotateCcw, Receipt, ArrowRight, DollarSign } from 'lucide-react';
import apiClient from '../api/client';
import { getColor } from '../utils/avatarColor';

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 animate-pulse">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-6 h-6 bg-slate-200 rounded-full flex-shrink-0" />
        <div className="h-3 bg-slate-200 rounded w-16" />
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <div className="h-3 bg-slate-200 rounded w-6" />
        <div className="h-4 bg-slate-200 rounded w-10" />
        <div className="h-3 bg-slate-200 rounded w-6" />
        <div className="flex items-center gap-1.5">
          <div className="h-3 bg-slate-200 rounded w-12" />
          <div className="w-6 h-6 bg-slate-200 rounded-full flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}

export default function SettlementView({ sessionId, sessionName, itemCount }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const calculate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/sessions/${sessionId}/calculate`);
      setResult(response.data);
    } catch (error) {
      alert('Error calculating settlements');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { calculate(); }, [calculate]);

  if (loading) return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-green-50 border-b border-green-100 rounded-t-[2rem]">
        <div className="flex items-center gap-2 animate-pulse">
          <div className="w-4 h-4 bg-green-200 rounded" />
          <div className="h-3 bg-green-200 rounded w-16" />
        </div>
        <div className="flex items-center gap-2 animate-pulse">
          <div className="h-3 bg-green-200 rounded w-20" />
          <div className="h-3 bg-green-200 rounded w-24" />
        </div>
      </div>
      <div className="p-3 sm:p-4 space-y-2">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );

  const debts = result?.debts ?? [];
  const totalExpenses = result?.totalExpenses || '0.00';

  return (
    <div className="flex flex-col">
      <h3 className="text-sm sm:text-base text-slate-900 font-bold mb-3">Settlements</h3>
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-green-50 border-b border-green-100">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-xs font-bold text-green-800 uppercase tracking-wider">Balanced</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Receipt className="w-3 h-3" />
            <span>{itemCount ?? '?'} Items</span>
          </span>
          <span className="flex items-center gap-1 text-slate-700 font-semibold">
            <DollarSign className="w-3 h-3" />
            <span>{totalExpenses}</span>
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-1.5">
        {debts.length > 0 ? debts.map((debt, i) => {
          const fromColor = getColor(debt.fromParticipantName);
          const toColor = getColor(debt.toParticipantName);
          return (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <div style={{ backgroundColor: fromColor }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-700 flex-shrink-0">
                  {debt.fromParticipantName[0].toUpperCase()}
                </div>
                <span className="text-xs font-medium text-slate-600 truncate">{debt.fromParticipantName}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[10px] text-slate-400 font-medium">pays</span>
                <span className="text-sm font-semibold text-brand-600 tabular-nums">${debt.amount}</span>
                <ArrowRight className="w-3 h-3 text-slate-300" />
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-medium text-slate-600 truncate">{debt.toParticipantName}</span>
                  <div style={{ backgroundColor: toColor }}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-700 flex-shrink-0">
                    {debt.toParticipantName[0].toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <CheckCircle className="w-8 h-8 text-green-300 mb-2" />
            <p className="text-xs font-semibold">Everything is already settled!</p>
          </div>
        )}

        {debts.length > 0 && (
          <button onClick={calculate}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50 transition-all font-bold text-xs active:scale-95">
            <RotateCcw className="w-3.5 h-3.5" />
            Recalculate
          </button>
        )}
        </div>
      </div>
    </div>
  );
}
