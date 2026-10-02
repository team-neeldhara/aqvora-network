package com.aquora.mysql_backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquora.mysql_backend.dto.DashboardResponse;
import com.aquora.mysql_backend.entity.BorewellReadings;
import com.aquora.mysql_backend.repository.BorewellReadingRepository;

@RestController
@RequestMapping("/api/readings")
@CrossOrigin
public class BorewellReadingController {

    private final BorewellReadingRepository repository;

    public BorewellReadingController(
            BorewellReadingRepository repository) {
        this.repository = repository;
    }

    // POST - Create a new borewell reading
    @PostMapping
    public BorewellReadings createReading(
            @RequestBody BorewellReadings reading) {

        return repository.save(reading);
    }

    // GET - Get all readings
    @GetMapping
    public List<BorewellReadings> getAllReadings() {

        return repository.findAll();
    }

    // GET - Get reading by ID
    @GetMapping("/{id}")
    public BorewellReadings getReading(
            @PathVariable Long id) {

        return repository.findById(id).orElse(null);
    }

    // GET - Get all readings for a particular device
    @GetMapping("/device/{deviceId}")
    public List<BorewellReadings> getByDeviceId(
            @PathVariable String deviceId) {

        return repository.findByDeviceId(deviceId);
    }

    // GET - Get latest reading
    @GetMapping("/latest/{deviceId}")
    public BorewellReadings getLatestReading(
            @PathVariable String deviceId) {

        return repository
                .findTopByDeviceIdOrderByTimestampDesc(deviceId);
    }

    // GET - Dashboard data
    @GetMapping("/dashboard/{deviceId}")
    public DashboardResponse getDashboard(
            @PathVariable String deviceId) {

        BorewellReadings latest =
                repository.findTopByDeviceIdOrderByTimestampDesc(
                        deviceId);

        long totalReadings =
                repository.countByDeviceId(deviceId);

        return new DashboardResponse(
                latest,
                totalReadings);
    }
}