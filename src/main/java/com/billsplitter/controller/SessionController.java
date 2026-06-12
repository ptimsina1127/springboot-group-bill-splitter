package com.billsplitter.controller;

import com.billsplitter.dto.*;
import com.billsplitter.service.SessionService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    // ── Sessions ──────────────────────────────────────────────────────────────

    @PostMapping("/sessions")
    public ResponseEntity<SessionResponse> createSession(
            @Valid @RequestBody CreateSessionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.createSession(req));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<SessionDetailResponse> getSession(@PathVariable String sessionId) {
        try {
            return ResponseEntity.ok(sessionService.getSession(sessionId));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/sessions/by-short-code/{shortCode}")
    public ResponseEntity<SessionDetailResponse> getSessionByShortCode(@PathVariable String shortCode) {
        try {
            return ResponseEntity.ok(sessionService.getSessionByShortCode(shortCode));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/sessions/{sessionId}")
    public ResponseEntity<SessionResponse> updateSession(
            @PathVariable String sessionId,
            @Valid @RequestBody UpdateSessionRequest req) {
        try {
            return ResponseEntity.ok(sessionService.updateSession(sessionId, req));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Participants ──────────────────────────────────────────────────────────

    @PostMapping("/sessions/{sessionId}/participants")
    public ResponseEntity<ParticipantResponse> addParticipant(
            @PathVariable String sessionId,
            @Valid @RequestBody AddParticipantRequest req) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(sessionService.addParticipant(sessionId, req));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/sessions/{sessionId}/participants/{participantId}")
    public ResponseEntity<ParticipantResponse> updateParticipant(
            @PathVariable String sessionId,
            @PathVariable String participantId,
            @Valid @RequestBody UpdateParticipantRequest req) {
        try {
            return ResponseEntity.ok(
                    sessionService.updateParticipant(sessionId, participantId, req));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }


    // ── Expense Items ─────────────────────────────────────────────────────────

    @PostMapping("/sessions/{sessionId}/items")
    public ResponseEntity<ExpenseItemResponse> addExpenseItem(
            @PathVariable String sessionId,
            @Valid @RequestBody AddExpenseItemRequest req) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(sessionService.addExpenseItem(sessionId, req));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/sessions/{sessionId}/items/{itemId}")
    public ResponseEntity<ExpenseItemResponse> updateExpenseItem(
            @PathVariable String sessionId,
            @PathVariable String itemId,
            @Valid @RequestBody UpdateExpenseItemRequest req) {
        try {
            return ResponseEntity.ok(sessionService.updateExpenseItem(sessionId, itemId, req));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/sessions/{sessionId}/items/{itemId}")
    public ResponseEntity<Void> deleteExpenseItem(
            @PathVariable String sessionId,
            @PathVariable String itemId) {
        try {
            sessionService.deleteExpenseItem(sessionId, itemId);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Settlement ────────────────────────────────────────────────────────────

    @PostMapping("/sessions/{sessionId}/calculate")
    public ResponseEntity<SettlementResultResponse> calculateSettlements(
            @PathVariable String sessionId) {
        try {
            return ResponseEntity.ok(sessionService.calculateSettlements(sessionId));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/sessions/{sessionId}/summary")
    public ResponseEntity<SessionSummaryResponse> getSessionSummary(
            @PathVariable String sessionId) {
        try {
            return ResponseEntity.ok(sessionService.getSessionSummary(sessionId));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Error handler ─────────────────────────────────────────────────────────

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(
            org.springframework.web.bind.MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .findFirst().orElse("Validation failed");
        return ResponseEntity.badRequest().body(Map.of("error", msg));
    }
}
