package com.billsplitter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CreateSessionRequest(
        @NotBlank(message = "Session name is required") String name,
        @NotEmpty(message = "At least one participant is required") List<String> participantNames) {
}
