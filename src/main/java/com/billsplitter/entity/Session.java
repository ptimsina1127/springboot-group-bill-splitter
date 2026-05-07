package com.billsplitter.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "sessions")
public class Session {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String name;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Participant> participants = new ArrayList<>();

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ExpenseItem> expenseItems = new ArrayList<>();

    public Session() {}

    public Session(String id, String name, LocalDateTime createdAt, List<Participant> participants, List<ExpenseItem> expenseItems) {
        this.id = id;
        this.name = name;
        this.createdAt = createdAt;
        this.participants = participants != null ? participants : new ArrayList<>();
        this.expenseItems = expenseItems != null ? expenseItems : new ArrayList<>();
    }

    public static SessionBuilder builder() {
        return new SessionBuilder();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<Participant> getParticipants() { return participants; }
    public void setParticipants(List<Participant> participants) { this.participants = participants; }
    public List<ExpenseItem> getExpenseItems() { return expenseItems; }
    public void setExpenseItems(List<ExpenseItem> expenseItems) { this.expenseItems = expenseItems; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Session session = (Session) o;
        return Objects.equals(id, session.id);
    }

    @Override
    public int hashCode() { return Objects.hash(id); }

    public static class SessionBuilder {
        private String id;
        private String name;
        private LocalDateTime createdAt;
        private List<Participant> participants;
        private List<ExpenseItem> expenseItems;

        public SessionBuilder id(String id) { this.id = id; return this; }
        public SessionBuilder name(String name) { this.name = name; return this; }
        public SessionBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public SessionBuilder participants(List<Participant> participants) { this.participants = participants; return this; }
        public SessionBuilder expenseItems(List<ExpenseItem> expenseItems) { this.expenseItems = expenseItems; return this; }

        public Session build() {
            return new Session(id, name, createdAt, participants, expenseItems);
        }
    }
}
