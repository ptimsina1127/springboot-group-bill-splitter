package com.billsplitter.dto;

import java.time.LocalDateTime;

public record SessionResponse(
        String id,
        String name,
        LocalDateTime createdAt,
        int participantCount) {
}
