package com.billsplitter.dto;

import java.math.BigDecimal;

public record DebtResponse(
        String fromParticipantId,
        String fromParticipantName,
        String toParticipantId,
        String toParticipantName,
        BigDecimal amount) {
}
