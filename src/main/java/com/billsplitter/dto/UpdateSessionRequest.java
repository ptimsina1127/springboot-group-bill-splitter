package com.billsplitter.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateSessionRequest(
        @NotBlank(message = "Session name is required") String name) {
}
