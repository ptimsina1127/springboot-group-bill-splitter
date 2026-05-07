package com.billsplitter.dto;

import java.time.LocalDateTime;
import java.util.List;

public record SessionDetailResponse(
        String id,
        String name,
        LocalDateTime createdAt,
        List<ParticipantResponse> participants,
        List<ExpenseItemResponse> items) {
}
