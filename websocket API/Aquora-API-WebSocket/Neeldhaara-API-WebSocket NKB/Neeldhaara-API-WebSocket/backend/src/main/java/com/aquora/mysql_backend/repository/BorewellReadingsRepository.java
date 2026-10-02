package com.aquora.mysql_backend.repository;

import com.aquora.mysql_backend.entity.BorewellReadings;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BorewellReadingsRepository
        extends JpaRepository<BorewellReadings, Long> {

    Optional<BorewellReadings>
    findTopByDeviceIdOrderByTimestampDesc(String deviceId);

    List<BorewellReadings>
    findByDeviceIdOrderByTimestampDesc(
            String deviceId,
            Pageable pageable
    );

    Optional<BorewellReadings>
    findTopByOrderByIdDesc();

    List<BorewellReadings>
    findByIdGreaterThanOrderByIdAsc(Long id);
}