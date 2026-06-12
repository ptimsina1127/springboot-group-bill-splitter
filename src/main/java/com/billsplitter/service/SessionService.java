package com.billsplitter.service;

import com.billsplitter.dto.*;
import com.billsplitter.entity.ExpenseItem;
import com.billsplitter.entity.Participant;
import com.billsplitter.entity.Session;
import com.billsplitter.repository.ExpenseItemRepository;
import com.billsplitter.repository.ParticipantRepository;
import com.billsplitter.repository.SessionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionService {

    private final SessionRepository sessionRepository;
    private final ParticipantRepository participantRepository;
    private final ExpenseItemRepository expenseItemRepository;

    private static final String BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final SecureRandom RANDOM = new SecureRandom();

    private String generateShortCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(5);
            for (int i = 0; i < 5; i++) {
                sb.append(BASE62.charAt(RANDOM.nextInt(62)));
            }
            String code = sb.toString();
            if (sessionRepository.findByShortCode(code).isEmpty()) {
                return code;
            }
        }
        throw new RuntimeException("Failed to generate unique short code after 10 attempts");
    }

    // ── Sessions ─────────────────────────────────────────────────────────────

    public SessionResponse createSession(CreateSessionRequest req) {
        Session session = Session.builder()
                .id(UUID.randomUUID().toString())
                .name(req.name())
                .shortCode(generateShortCode())
                .build();
        sessionRepository.save(session);

        List<String> names = req.participantNames();
        for (int i = 0; i < names.size(); i++) {
            Participant p = Participant.builder()
                    .id(UUID.randomUUID().toString())
                    .session(session)
                    .name(names.get(i))
                    .displayOrder(i)
                    .build();
            participantRepository.save(p);
        }

        return new SessionResponse(session.getId(), session.getName(),
                session.getShortCode(), session.getCreatedAt(), names.size(), "ACTIVE");
    }

    @Transactional(readOnly = true)
    public SessionDetailResponse getSession(String sessionId) {
        Session session = findSession(sessionId);
        List<Participant> participants = participantRepository
                .findBySessionIdOrderByDisplayOrderAsc(sessionId);
        List<ExpenseItem> items = expenseItemRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);

        return new SessionDetailResponse(
                session.getId(), session.getName(), session.getShortCode(), session.getCreatedAt(),
                session.getStatus(),
                participants.stream().map(this::toParticipantResponse).toList(),
                items.stream().map(this::toExpenseItemResponse).toList());
    }

    @Transactional(readOnly = true)
    public SessionDetailResponse getSessionByShortCode(String shortCode) {
        Session session = sessionRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new EntityNotFoundException("Session not found for code: " + shortCode));
        return getSession(session.getId());
    }

    public SessionResponse updateSession(String sessionId, UpdateSessionRequest req) {
        Session session = findSession(sessionId);
        session.setName(req.name());
        if (req.status() != null) {
            session.setStatus(req.status());
        }
        sessionRepository.save(session);
        long count = participantRepository.countBySessionId(sessionId);
        return new SessionResponse(session.getId(), session.getName(),
                session.getShortCode(), session.getCreatedAt(), (int) count, session.getStatus());
    }

    // ── Participants ──────────────────────────────────────────────────────────

    public ParticipantResponse addParticipant(String sessionId, AddParticipantRequest req) {
        Session session = findSession(sessionId);
        long order = participantRepository.countBySessionId(sessionId);
        Participant p = Participant.builder()
                .id(UUID.randomUUID().toString())
                .session(session)
                .name(req.name())
                .displayOrder((int) order)
                .build();
        participantRepository.save(p);
        return toParticipantResponse(p);
    }

    public ParticipantResponse updateParticipant(String sessionId, String participantId,
                                                  UpdateParticipantRequest req) {
        Participant p = participantRepository.findById(participantId)
                .filter(pt -> pt.getSession().getId().equals(sessionId))
                .orElseThrow(() -> new EntityNotFoundException("Participant not found"));
        p.setName(req.name());
        participantRepository.save(p);
        return toParticipantResponse(p);
    }

    public void removeParticipant(String sessionId, String participantId) {
        Participant p = participantRepository.findById(participantId)
                .filter(pt -> pt.getSession().getId().equals(sessionId))
                .orElseThrow(() -> new EntityNotFoundException("Participant not found"));
        expenseItemRepository.deleteByPaidByParticipantId(participantId);
        List<ExpenseItem> items = expenseItemRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        for (ExpenseItem item : items) {
            if (item.getSharedWithParticipantIds().remove(participantId)) {
                expenseItemRepository.save(item);
            }
        }
        participantRepository.delete(p);
    }

    // ── Expense Items ─────────────────────────────────────────────────────────

    public ExpenseItemResponse addExpenseItem(String sessionId, AddExpenseItemRequest req) {
        Session session = findSession(sessionId);
        List<String> sharedWith = req.sharedWithParticipantIds() != null
                ? req.sharedWithParticipantIds() : new ArrayList<>();

        ExpenseItem item = ExpenseItem.builder()
                .id(UUID.randomUUID().toString())
                .session(session)
                .paidByParticipantId(req.paidByParticipantId())
                .description(req.description())
                .amount(req.amount())
                .sharedWithParticipantIds(sharedWith)
                .build();
        expenseItemRepository.save(item);
        return toExpenseItemResponse(item);
    }

    public ExpenseItemResponse updateExpenseItem(String sessionId, String itemId,
                                                  UpdateExpenseItemRequest req) {
        ExpenseItem item = expenseItemRepository.findById(itemId)
                .filter(i -> i.getSession().getId().equals(sessionId))
                .orElseThrow(() -> new EntityNotFoundException("Expense item not found"));

        item.setPaidByParticipantId(req.paidByParticipantId());
        item.setDescription(req.description());
        item.setAmount(req.amount());
        item.setSharedWithParticipantIds(
                req.sharedWithParticipantIds() != null ? req.sharedWithParticipantIds() : new ArrayList<>());
        expenseItemRepository.save(item);
        return toExpenseItemResponse(item);
    }

    public void deleteExpenseItem(String sessionId, String itemId) {
        ExpenseItem item = expenseItemRepository.findById(itemId)
                .filter(i -> i.getSession().getId().equals(sessionId))
                .orElseThrow(() -> new EntityNotFoundException("Expense item not found"));
        expenseItemRepository.delete(item);
    }

    // ── Settlement Calculation ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SettlementResultResponse calculateSettlements(String sessionId) {
        Session session = findSession(sessionId);
        List<Participant> participants = participantRepository
                .findBySessionIdOrderByDisplayOrderAsc(sessionId);
        List<ExpenseItem> items = expenseItemRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);

        Set<String> allIds = participants.stream()
                .map(Participant::getId).collect(Collectors.toSet());
        Map<String, String> nameMap = participants.stream()
                .collect(Collectors.toMap(Participant::getId, Participant::getName));

        items = items.stream()
                .filter(i -> allIds.contains(i.getPaidByParticipantId()))
                .toList();

        Map<String, BigDecimal> balances = new HashMap<>();
        allIds.forEach(id -> balances.put(id, BigDecimal.ZERO));

        BigDecimal totalExpenses = BigDecimal.ZERO;

        for (ExpenseItem item : items) {
            BigDecimal amount = item.getAmount();
            totalExpenses = totalExpenses.add(amount);

            List<String> sharers = item.getSharedWithParticipantIds().isEmpty()
                    ? allIds : item.getSharedWithParticipantIds();

            BigDecimal sharePerPerson = amount.divide(
                    BigDecimal.valueOf(sharers.size()), 10, RoundingMode.HALF_UP);

            // Payer gets credit
            balances.merge(item.getPaidByParticipantId(), amount, BigDecimal::add);

            // Each sharer gets debited
            for (String sharerId : sharers) {
                if (balances.containsKey(sharerId)) {
                    balances.merge(sharerId, sharePerPerson.negate(), BigDecimal::add);
                }
            }
        }

        // Build creditors (positive balance) and debtors (negative balance)
        // Store as: creditors = [ [amount, originalIndex] ]
        List<double[]> creditors = new ArrayList<>();
        List<double[]> debtors = new ArrayList<>();
        List<String> creditorIds = new ArrayList<>();
        List<String> debtorIds = new ArrayList<>();

        double threshold = 0.001;
        for (Map.Entry<String, BigDecimal> entry : balances.entrySet()) {
            double bal = entry.getValue().doubleValue();
            if (bal > threshold) {
                creditorIds.add(entry.getKey());
                creditors.add(new double[]{bal, creditorIds.size() - 1});
            } else if (bal < -threshold) {
                debtorIds.add(entry.getKey());
                debtors.add(new double[]{-bal, debtorIds.size() - 1});
            }
        }

        // Sort by amount descending
        creditors.sort((a, b) -> Double.compare(b[0], a[0]));
        debtors.sort((a, b) -> Double.compare(b[0], a[0]));

        List<DebtResponse> debts = new ArrayList<>();
        int ci = 0, di = 0;

        while (ci < creditors.size() && di < debtors.size()) {
            double[] creditor = creditors.get(ci);
            double[] debtor = debtors.get(di);
            double settlement = Math.min(creditor[0], debtor[0]);

            String creditorId = creditorIds.get((int) creditor[1]);
            String debtorId = debtorIds.get((int) debtor[1]);

            debts.add(new DebtResponse(
                    debtorId,
                    nameMap.getOrDefault(debtorId, debtorId),
                    creditorId,
                    nameMap.getOrDefault(creditorId, creditorId),
                    BigDecimal.valueOf(settlement).setScale(2, RoundingMode.HALF_UP)));

            creditor[0] -= settlement;
            debtor[0] -= settlement;

            if (creditor[0] < threshold) ci++;
            if (debtor[0] < threshold) di++;
        }

        return new SettlementResultResponse(
                session.getId(), session.getName(), debts,
                totalExpenses.setScale(2, RoundingMode.HALF_UP));
    }

    @Transactional(readOnly = true)
    public SessionSummaryResponse getSessionSummary(String sessionId) {
        Session session = findSession(sessionId);
        List<Participant> participants = participantRepository
                .findBySessionIdOrderByDisplayOrderAsc(sessionId);
        List<ExpenseItem> items = expenseItemRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        Set<String> allIds = participants.stream().map(Participant::getId).collect(Collectors.toSet());

        items = items.stream()
                .filter(i -> allIds.contains(i.getPaidByParticipantId()))
                .toList();

        Map<String, BigDecimal> paid = new HashMap<>();
        Map<String, BigDecimal> owed = new HashMap<>();
        allIds.forEach(id -> {
            paid.put(id, BigDecimal.ZERO);
            owed.put(id, BigDecimal.ZERO);
        });

        BigDecimal totalExpenses = BigDecimal.ZERO;

        for (ExpenseItem item : items) {
            BigDecimal amount = item.getAmount();
            totalExpenses = totalExpenses.add(amount);

            paid.merge(item.getPaidByParticipantId(), amount, BigDecimal::add);

            List<String> sharers = item.getSharedWithParticipantIds().isEmpty()
                    ? allIds : item.getSharedWithParticipantIds();
            BigDecimal share = amount.divide(
                    BigDecimal.valueOf(sharers.size()), 10, RoundingMode.HALF_UP);

            for (String sharerId : sharers) {
                if (owed.containsKey(sharerId)) {
                    owed.merge(sharerId, share, BigDecimal::add);
                }
            }
        }

        List<ParticipantBalanceResponse> balances = participants.stream().map(p -> {
            BigDecimal totalPaid = paid.getOrDefault(p.getId(), BigDecimal.ZERO)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal totalOwed = owed.getOrDefault(p.getId(), BigDecimal.ZERO)
                    .setScale(2, RoundingMode.HALF_UP);
            return new ParticipantBalanceResponse(
                    p.getId(), p.getName(), totalPaid, totalOwed,
                    totalPaid.subtract(totalOwed).setScale(2, RoundingMode.HALF_UP));
        }).toList();

        return new SessionSummaryResponse(
                session.getId(), session.getName(),
                totalExpenses.setScale(2, RoundingMode.HALF_UP),
                participants.size(), items.size(), balances);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Session findSession(String id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Session not found: " + id));
    }

    private ParticipantResponse toParticipantResponse(Participant p) {
        return new ParticipantResponse(p.getId(), p.getSession().getId(),
                p.getName(), p.getDisplayOrder());
    }

    private ExpenseItemResponse toExpenseItemResponse(ExpenseItem item) {
        return new ExpenseItemResponse(
                item.getId(), item.getSession().getId(),
                item.getPaidByParticipantId(), item.getDescription(),
                item.getAmount().setScale(2, RoundingMode.HALF_UP),
                item.getSharedWithParticipantIds(),
                item.getCreatedAt());
    }
}
