package com.aquora.mysql_backend.service;

import com.aquora.mysql_backend.dto.BorewellReadingResponse;
import com.aquora.mysql_backend.entity.BorewellReadings;
import com.aquora.mysql_backend.repository.BorewellReadingsRepository;
import com.aquora.mysql_backend.websocket.BorewellWebSocketHandler;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DatabaseWebSocketPublisher {

    private final BorewellReadingsRepository repo;
    private final BorewellWebSocketHandler ws;

    private Long lastPublishedId;

    public DatabaseWebSocketPublisher(
            BorewellReadingsRepository repo,
            BorewellWebSocketHandler ws) {
        this.repo = repo;
        this.ws = ws;
    }

    @Scheduled(fixedDelayString = "${neeldhaara.websocket.poll-ms:1000}")
    public void poll() {

        // First run: remember the latest existing database row.
        // REST provides the initial data to the frontend.
        if (lastPublishedId == null) {
            lastPublishedId = repo.findTopByOrderByIdDesc()
                    .map(BorewellReadings::getId)
                    .orElse(null);
            return;
        }

        // Find ALL readings inserted after the last published row.
        List<BorewellReadings> newReadings =
                repo.findByIdGreaterThanOrderByIdAsc(lastPublishedId);

        for (BorewellReadings reading : newReadings) {

            if (reading.getId() == null) {
                continue;
            }

            // Send this reading to every connected WebSocket client.
            ws.broadcast(BorewellReadingResponse.from(reading));

            lastPublishedId = reading.getId();
        }
    }
}