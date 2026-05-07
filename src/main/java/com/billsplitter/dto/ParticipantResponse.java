package com.billsplitter.dto;

public record ParticipantResponse(
        String id,
        String sessionId,
        String name,
        int displayOrder) {
}
