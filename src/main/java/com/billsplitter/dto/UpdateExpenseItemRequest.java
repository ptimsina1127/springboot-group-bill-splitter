package com.billsplitter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.util.List;

public record UpdateExpenseItemRequest(
        @NotBlank(message = "paidByParticipantId is required") String paidByParticipantId,
        @NotBlank(message = "Description is required") String description,
        @NotNull @PositiveOrZero BigDecimal amount,
        List<String> sharedWithParticipantIds) {
}
