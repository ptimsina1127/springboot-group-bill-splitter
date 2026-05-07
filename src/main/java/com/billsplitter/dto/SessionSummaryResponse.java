package com.billsplitter.dto;

import java.math.BigDecimal;
import java.util.List;

public record SessionSummaryResponse(
        String sessionId,
        String sessionName,
        BigDecimal totalExpenses,
        int participantCount,
        int itemCount,
        List<ParticipantBalanceResponse> balances) {
}
