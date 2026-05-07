package com.billsplitter.dto;

import java.math.BigDecimal;

public record ParticipantBalanceResponse(
        String participantId,
        String participantName,
        BigDecimal totalPaid,
        BigDecimal totalOwed,
        BigDecimal netBalance) {
}
