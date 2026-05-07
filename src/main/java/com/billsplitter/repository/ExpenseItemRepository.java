package com.billsplitter.repository;

import com.billsplitter.entity.ExpenseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseItemRepository extends JpaRepository<ExpenseItem, String> {
    List<ExpenseItem> findBySessionId(String sessionId);
}
