package com.billsplitter.repository;

import com.billsplitter.entity.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParticipantRepository extends JpaRepository<Participant, String> {
    List<Participant> findBySessionIdOrderByDisplayOrderAsc(String sessionId);
    long countBySessionId(String sessionId);
}
