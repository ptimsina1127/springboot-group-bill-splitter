package com.billsplitter.dto;

import jakarta.validation.constraints.NotBlank;

public record AddParticipantRequest(
        @NotBlank(message = "Participant name is required") String name) {
}
