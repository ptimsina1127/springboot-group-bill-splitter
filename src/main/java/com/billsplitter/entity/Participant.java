package com.billsplitter.entity;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "participants")
public class Participant {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @Column(nullable = false)
    private String name;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    public Participant() {}

    public Participant(String id, Session session, String name, int displayOrder) {
        this.id = id;
        this.session = session;
        this.name = name;
        this.displayOrder = displayOrder;
    }

    public static ParticipantBuilder builder() {
        return new ParticipantBuilder();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Session getSession() { return session; }
    public void setSession(Session session) { this.session = session; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Participant participant = (Participant) o;
        return Objects.equals(id, participant.id);
    }

    @Override
    public int hashCode() { return Objects.hash(id); }

    @Override
    public String toString() { return "Participant{id='" + id + "', name='" + name + "'}"; }

    public static class ParticipantBuilder {
        private String id;
        private Session session;
        private String name;
        private int displayOrder;

        public ParticipantBuilder id(String id) { this.id = id; return this; }
        public ParticipantBuilder session(Session session) { this.session = session; return this; }
        public ParticipantBuilder name(String name) { this.name = name; return this; }
        public ParticipantBuilder displayOrder(int displayOrder) { this.displayOrder = displayOrder; return this; }

        public Participant build() {
            return new Participant(id, session, name, displayOrder);
        }
    }
}
