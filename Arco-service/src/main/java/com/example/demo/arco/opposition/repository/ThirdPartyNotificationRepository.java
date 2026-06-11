package com.example.demo.arco.opposition.repository;

import com.example.demo.arco.opposition.model.ThirdPartyNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ThirdPartyNotificationRepository extends JpaRepository<ThirdPartyNotification, UUID> {

    List<ThirdPartyNotification> findByOppositionRequestId(UUID oppositionRequestId);
}
