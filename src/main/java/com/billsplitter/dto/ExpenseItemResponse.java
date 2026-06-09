package com.billsplitter.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ExpenseItemResponse(
        String id,
        String sessionId,
        String paidByParticipantId,
        String description,
        BigDecimal amount,
        List<String> sharedWithParticipantIds,
        LocalDateTime createdAt) {
}
