package com.example.demo.arco.opposition.repository;

import com.example.demo.arco.opposition.enums.BlockStatus;
import com.example.demo.arco.opposition.model.TemporaryBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface TemporaryBlockRepository extends JpaRepository<TemporaryBlock, UUID> {

    List<TemporaryBlock> findByOppositionRequestId(UUID oppositionRequestId);

    // Para isDataSubjectBlocked (4.3)
    boolean existsByOppositionRequest_DataSubjectIdAndOppositionRequest_TreatmentActivityIdAndStatusIn(
            UUID dataSubjectId, UUID treatmentActivityId, List<BlockStatus> statuses);

    // Para scheduler de bloqueos vencidos (4.8)
    List<TemporaryBlock> findByDueDateBeforeAndStatus(LocalDateTime dueDate, BlockStatus status);
}
