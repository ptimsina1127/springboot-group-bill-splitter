package com.billsplitter.dto;

import java.math.BigDecimal;
import java.util.List;

public record SettlementResultResponse(
        String sessionId,
        String sessionName,
        List<DebtResponse> debts,
        BigDecimal totalExpenses) {
}
