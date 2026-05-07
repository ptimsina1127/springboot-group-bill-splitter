package com.billsplitter.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateParticipantRequest(
        @NotBlank(message = "Participant name is required") String name) {
}
