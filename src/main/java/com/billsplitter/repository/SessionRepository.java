package com.billsplitter.repository;

import com.billsplitter.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SessionRepository extends JpaRepository<Session, String> {
    Optional<Session> findByShortCode(String shortCode);
}
