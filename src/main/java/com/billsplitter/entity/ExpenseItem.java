package com.billsplitter.entity;

import com.billsplitter.util.StringListConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "expense_items")
public class ExpenseItem {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @Column(name = "paid_by_participant_id", nullable = false, length = 36)
    private String paidByParticipantId;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Convert(converter = StringListConverter.class)
    @Column(name = "shared_with_participant_ids", nullable = false, columnDefinition = "TEXT")
    private List<String> sharedWithParticipantIds = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public ExpenseItem() {}

    public ExpenseItem(String id, Session session, String paidByParticipantId, String description, BigDecimal amount, List<String> sharedWithParticipantIds, LocalDateTime createdAt) {
        this.id = id;
        this.session = session;
        this.paidByParticipantId = paidByParticipantId;
        this.description = description;
        this.amount = amount;
        this.sharedWithParticipantIds = sharedWithParticipantIds != null ? sharedWithParticipantIds : new ArrayList<>();
        this.createdAt = createdAt;
    }

    public static ExpenseItemBuilder builder() {
        return new ExpenseItemBuilder();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Session getSession() { return session; }
    public void setSession(Session session) { this.session = session; }
    public String getPaidByParticipantId() { return paidByParticipantId; }
    public void setPaidByParticipantId(String paidByParticipantId) { this.paidByParticipantId = paidByParticipantId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public List<String> getSharedWithParticipantIds() { return sharedWithParticipantIds; }
    public void setSharedWithParticipantIds(List<String> sharedWithParticipantIds) { this.sharedWithParticipantIds = sharedWithParticipantIds; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ExpenseItem that = (ExpenseItem) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() { return Objects.hash(id); }

    @Override
    public String toString() { return "ExpenseItem{id='" + id + "', description='" + description + "'}"; }

    public static class ExpenseItemBuilder {
        private String id;
        private Session session;
        private String paidByParticipantId;
        private String description;
        private BigDecimal amount;
        private List<String> sharedWithParticipantIds;
        private LocalDateTime createdAt;

        public ExpenseItemBuilder id(String id) { this.id = id; return this; }
        public ExpenseItemBuilder session(Session session) { this.session = session; return this; }
        public ExpenseItemBuilder paidByParticipantId(String paidByParticipantId) { this.paidByParticipantId = paidByParticipantId; return this; }
        public ExpenseItemBuilder description(String description) { this.description = description; return this; }
        public ExpenseItemBuilder amount(BigDecimal amount) { this.amount = amount; return this; }
        public ExpenseItemBuilder sharedWithParticipantIds(List<String> sharedWithParticipantIds) { this.sharedWithParticipantIds = sharedWithParticipantIds; return this; }
        public ExpenseItemBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public ExpenseItem build() {
            return new ExpenseItem(id, session, paidByParticipantId, description, amount, sharedWithParticipantIds, createdAt);
        }
    }
}
