package com.aquora.mysql_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aquora.mysql_backend.entity.BorewellReadings;

public interface BorewellReadingRepository
        extends JpaRepository<BorewellReadings, Long> {

    // Get all readings of a particular borewell
    List<BorewellReadings> findByDeviceId(String deviceId);

    // Get latest reading of a particular borewell
    BorewellReadings findTopByDeviceIdOrderByTimestampDesc(String deviceId);

    // Count readings of a particular borewell
    long countByDeviceId(String deviceId);
}